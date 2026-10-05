import {
  startJourney
} from "world-core";

import type {
  NavigationRegistry,
  World
} from "world-core";

import type {
  InventoryBindingRegistry
} from "../inventory/bindings.js";

import type {
  ItemRegistry
} from "../items/registry.js";

import type {
  PlaceTransferRegistry
} from "../logistics/transfer.js";

import type {
  ResourceRegistry
} from "../resources/registry.js";

import type {
  GatheringOutputDefinition
} from "./types.js";

export type GatheringPhase =
  | "travelling-to-resource"
  | "working"
  | "returning"
  | "complete"
  | "failed";

export interface GatheringJob {
  readonly workerEntityId: string;
  readonly resourceNodeId: string;
  readonly depositPlaceId: string;
  readonly output: Readonly<GatheringOutputDefinition>;
  phase: GatheringPhase;
  workRemainingSeconds: number;
  failureReason: string | null;
}

export interface GatheringEnvironment {
  readonly world: World;
  readonly navigation: NavigationRegistry;
  readonly resources: ResourceRegistry;
  readonly items: ItemRegistry;
  readonly inventoryBindings: InventoryBindingRegistry;
  readonly transfers: PlaceTransferRegistry;
}

export class GatheringSystem {
  readonly outputs =
    new Map<
      string,
      Readonly<GatheringOutputDefinition>
    >();

  readonly jobs =
    new Map<string, GatheringJob>();

  constructor(
    private readonly environment:
      GatheringEnvironment
  ) {}

  registerOutput(
    definition: GatheringOutputDefinition
  ): void {
    if (
      definition.resourceTypeId.length === 0 ||
      definition.itemId.length === 0 ||
      !Number.isSafeInteger(definition.amount) ||
      definition.amount <= 0 ||
      !Number.isFinite(definition.workSeconds) ||
      definition.workSeconds <= 0
    ) {
      throw new TypeError(
        "invalid gathering output definition"
      );
    }

    if (
      !this.environment.resources
        .resourceTypes.has(
          definition.resourceTypeId
        )
    ) {
      throw new Error(
        `unknown gathering resource type: ${definition.resourceTypeId}`
      );
    }

    this.environment.items.require(
      definition.itemId
    );

    if (
      this.outputs.has(
        definition.resourceTypeId
      )
    ) {
      throw new Error(
        `gathering output already registered: ${definition.resourceTypeId}`
      );
    }

    this.outputs.set(
      definition.resourceTypeId,
      Object.freeze({
        ...definition
      })
    );
  }

  start(input: {
    workerEntityId: string;
    resourceNodeId: string;
    depositPlaceId: string;
  }): GatheringJob {
    const existingJob =
      this.jobs.get(
        input.workerEntityId
      );

    if (
      existingJob &&
      existingJob.phase !== "complete" &&
      existingJob.phase !== "failed"
    ) {
      throw new Error(
        `worker already has gathering job: ${input.workerEntityId}`
      );
    }

    const worker =
      this.environment.world
        .getEntity(
          input.workerEntityId
        );
    if (!worker) {
      throw new Error(
        `unknown gathering worker: ${input.workerEntityId}`
      );
    }
    if (worker.journey) {
      throw new Error(
        `gathering worker is already travelling: ${input.workerEntityId}`
      );
    }

    const node =
      this.environment.resources
        .getNode(
          input.resourceNodeId
        );
    if (
      !node ||
      node.resourceTypeId === null
    ) {
      throw new Error(
        `resource node is not gatherable: ${input.resourceNodeId}`
      );
    }

    const output =
      this.outputs.get(
        node.resourceTypeId
      );
    if (!output) {
      throw new Error(
        `no gathering output for resource type: ${node.resourceTypeId}`
      );
    }

    const carried =
      this.environment.inventoryBindings
        .getInventory(
          {
            kind: "entity",
            id: input.workerEntityId
          },
          "carried"
        );
    if (!carried) {
      throw new Error(
        `gathering worker has no carried inventory: ${input.workerEntityId}`
      );
    }
    if (
      carried.remainingCapacity(
        output.itemId
      ) < output.amount
    ) {
      throw new Error(
        `gathering worker lacks inventory capacity: ${input.workerEntityId}`
      );
    }

    const deposit =
      this.environment.inventoryBindings
        .getInventory(
          {
            kind: "place",
            id: input.depositPlaceId
          },
          "storage"
        );
    if (!deposit) {
      throw new Error(
        `gathering deposit place has no storage: ${input.depositPlaceId}`
      );
    }
    if (
      deposit.remainingCapacity(
        output.itemId
      ) < output.amount
    ) {
      throw new Error(
        `gathering deposit storage lacks capacity: ${input.depositPlaceId}`
      );
    }

    const endpoint =
      this.environment.transfers.get(
        input.depositPlaceId
      );
    if (!endpoint) {
      throw new Error(
        `gathering deposit has no transfer endpoint: ${input.depositPlaceId}`
      );
    }

    if (
      !startJourney(
        this.environment.world,
        this.environment.navigation,
        input.workerEntityId,
        node.location
          .navigationNodeId
      )
    ) {
      throw new Error(
        `cannot route gathering worker to resource: ${input.workerEntityId}`
      );
    }

    const job: GatheringJob = {
      workerEntityId:
        input.workerEntityId,
      resourceNodeId:
        input.resourceNodeId,
      depositPlaceId:
        input.depositPlaceId,
      output,
      phase:
        "travelling-to-resource",
      workRemainingSeconds:
        output.workSeconds,
      failureReason: null
    };

    this.jobs.set(
      input.workerEntityId,
      job
    );

    return job;
  }

  step(deltaSeconds: number): void {
    if (
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0
    ) {
      throw new TypeError(
        "gathering deltaSeconds must be positive and finite"
      );
    }

    for (
      const job
      of this.jobs.values()
    ) {
      if (
        job.phase === "complete" ||
        job.phase === "failed"
      ) {
        continue;
      }

      const worker =
        this.environment.world
          .getEntity(
            job.workerEntityId
          );

      if (!worker) {
        this.fail(
          job,
          "worker disappeared"
        );
        continue;
      }

      if (
        job.phase ===
        "travelling-to-resource"
      ) {
        if (!worker.journey) {
          const node =
            this.environment.resources
              .getNode(
                job.resourceNodeId
              );

          if (
            !node ||
            worker.domainId !==
              node.location.domainId ||
            worker.position.x !==
              node.location.position.x ||
            worker.position.y !==
              node.location.position.y
          ) {
            this.fail(
              job,
              "worker did not reach resource"
            );
            continue;
          }

          job.phase = "working";
        }
        continue;
      }

      if (
        job.phase === "working"
      ) {
        job.workRemainingSeconds -=
          deltaSeconds;

        if (
          job.workRemainingSeconds > 0
        ) {
          continue;
        }

        const carried =
          this.environment
            .inventoryBindings
            .getInventory(
              {
                kind: "entity",
                id: job.workerEntityId
              },
              "carried"
            );

        if (!carried) {
          this.fail(
            job,
            "worker carried inventory disappeared"
          );
          continue;
        }

        const added =
          carried.add(
            job.output.itemId,
            job.output.amount
          );

        if (
          added.moved !==
          job.output.amount
        ) {
          if (added.moved > 0) {
            carried.remove(
              job.output.itemId,
              added.moved
            );
          }
          this.fail(
            job,
            "worker inventory changed during gathering"
          );
          continue;
        }

        const endpoint =
          this.environment.transfers.get(
            job.depositPlaceId
          );

        if (
          !endpoint ||
          !startJourney(
            this.environment.world,
            this.environment.navigation,
            job.workerEntityId,
            endpoint.navigationNodeId
          )
        ) {
          carried.remove(
            job.output.itemId,
            job.output.amount
          );
          this.fail(
            job,
            "cannot route worker back to deposit"
          );
          continue;
        }

        job.phase = "returning";
        continue;
      }

      if (
        job.phase === "returning" &&
        !worker.journey
      ) {
        const transferEnvironment = {
          world:
            this.environment.world,
          inventoryBindings:
            this.environment
              .inventoryBindings
        };

        if (
          !this.environment.transfers
            .canEntityTransfer(
              transferEnvironment,
              job.workerEntityId,
              job.depositPlaceId
            )
        ) {
          this.fail(
            job,
            "worker did not reach deposit"
          );
          continue;
        }

        const moved =
          this.environment.transfers
            .transferEntityToPlace(
              transferEnvironment,
              job.workerEntityId,
              "carried",
              job.depositPlaceId,
              "storage",
              job.output.itemId,
              job.output.amount
            );

        if (
          moved.moved !==
          job.output.amount
        ) {
          this.fail(
            job,
            "deposit could not accept complete gathering output"
          );
          continue;
        }

        job.phase = "complete";
      }
    }
  }

  private fail(
    job: GatheringJob,
    reason: string
  ): void {
    job.phase = "failed";
    job.failureReason = reason;
  }
}
