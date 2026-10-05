import type {
  World
} from "world-core";

import type {
  InventoryBindingRegistry,
  InventoryChannel
} from "../inventory/bindings.js";

import type {
  PlaceTransferRegistry
} from "../logistics/transfer.js";

import type {
  TransportRegistry
} from "../transports/registry.js";

import type {
  HaulingJob
} from "./types.js";

export interface HaulingEnvironment {
  readonly world: World;
  readonly inventoryBindings:
    InventoryBindingRegistry;
  readonly transfers:
    PlaceTransferRegistry;
  readonly transports:
    TransportRegistry;
}

function assertPositiveSafeInteger(
  value: number,
  label: string
): void {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new TypeError(
      `${label} must be a positive safe integer`
    );
  }
}

export class HaulingSystem {
  readonly jobs =
    new Map<string, HaulingJob>();

  constructor(
    private readonly environment:
      HaulingEnvironment
  ) {}

  start(input: {
    transportId: string;
    sourcePlaceId: string;
    sourceChannel:
      InventoryChannel;
    targetPlaceId: string;
    targetChannel:
      InventoryChannel;
    itemId: string;
    amount: number;
  }): HaulingJob {
    assertPositiveSafeInteger(
      input.amount,
      "hauling amount"
    );

    if (
      input.sourcePlaceId ===
      input.targetPlaceId
    ) {
      throw new Error(
        "hauling source and target place must differ"
      );
    }

    const existing =
      this.jobs.get(
        input.transportId
      );

    if (
      existing &&
      existing.phase !== "complete" &&
      existing.phase !== "failed"
    ) {
      throw new Error(
        `transport already has hauling job: ${input.transportId}`
      );
    }

    const transport =
      this.environment.transports.get(
        input.transportId
      );

    if (!transport) {
      throw new Error(
        `unknown hauling transport: ${input.transportId}`
      );
    }

    if (
      transport.operatorEntityId ===
      null
    ) {
      throw new Error(
        `hauling transport has no operator: ${input.transportId}`
      );
    }

    const transportEntity =
      this.environment.world
        .getEntity(
          transport.worldEntityId
        );

    if (!transportEntity) {
      throw new Error(
        `hauling transport world entity missing: ${input.transportId}`
      );
    }

    if (transportEntity.journey) {
      throw new Error(
        `hauling transport is already travelling: ${input.transportId}`
      );
    }

    const source =
      this.environment
        .inventoryBindings
        .getInventory(
          {
            kind: "place",
            id: input.sourcePlaceId
          },
          input.sourceChannel
        );
    const target =
      this.environment
        .inventoryBindings
        .getInventory(
          {
            kind: "place",
            id: input.targetPlaceId
          },
          input.targetChannel
        );
    const cargo =
      this.environment.transports
        .cargo(
          input.transportId
        );

    if (!source) {
      throw new Error(
        `hauling source inventory missing: ${input.sourcePlaceId}:${input.sourceChannel}`
      );
    }

    if (!target) {
      throw new Error(
        `hauling target inventory missing: ${input.targetPlaceId}:${input.targetChannel}`
      );
    }

    if (
      source.quantityOf(
        input.itemId
      ) < input.amount
    ) {
      throw new Error(
        "hauling source lacks requested items"
      );
    }

    if (
      cargo.remainingCapacity(
        input.itemId
      ) < input.amount
    ) {
      throw new Error(
        "hauling cargo lacks requested capacity"
      );
    }

    if (
      target.remainingCapacity(
        input.itemId
      ) < input.amount
    ) {
      throw new Error(
        "hauling target lacks requested capacity"
      );
    }

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
          input.transportId,
          input.sourcePlaceId
        )
    ) {
      throw new Error(
        `hauling transport is outside source transfer range: ${input.transportId}`
      );
    }

    const targetEndpoint =
      this.environment.transfers.get(
        input.targetPlaceId
      );

    if (!targetEndpoint) {
      throw new Error(
        `hauling target has no transfer endpoint: ${input.targetPlaceId}`
      );
    }

    const loaded =
      this.environment.transfers
        .transferPlaceToEntity(
          transferEnvironment,
          input.sourcePlaceId,
          input.sourceChannel,
          input.transportId,
          "cargo",
          input.itemId,
          input.amount
        );

    if (
      loaded.moved !== input.amount
    ) {
      throw new Error(
        "hauling load changed after validation"
      );
    }

    try {
      if (
        !this.environment.transports
          .startJourney(
            input.transportId,
            targetEndpoint
              .navigationNodeId
          )
      ) {
        throw new Error(
          "hauling route could not start"
        );
      }
    } catch (error) {
      const rollback =
        this.environment.transfers
          .transferEntityToPlace(
            transferEnvironment,
            input.transportId,
            "cargo",
            input.sourcePlaceId,
            input.sourceChannel,
            input.itemId,
            input.amount
          );

      if (
        rollback.moved !==
        input.amount
      ) {
        throw new Error(
          "hauling load rollback failed",
          {
            cause: error
          }
        );
      }

      throw error;
    }

    const job: HaulingJob = {
      transportId:
        input.transportId,
      sourcePlaceId:
        input.sourcePlaceId,
      sourceChannel:
        input.sourceChannel,
      targetPlaceId:
        input.targetPlaceId,
      targetChannel:
        input.targetChannel,
      itemId:
        input.itemId,
      amount:
        input.amount,
      phase: "travelling",
      deliveredAmount: 0,
      failureReason: null
    };

    this.jobs.set(
      input.transportId,
      job
    );

    return job;
  }

  step(): void {
    const transferEnvironment = {
      world:
        this.environment.world,
      inventoryBindings:
        this.environment
          .inventoryBindings
    };

    for (
      const job
      of this.jobs.values()
    ) {
      if (
        job.phase !== "travelling"
      ) {
        continue;
      }

      const transport =
        this.environment.transports.get(
          job.transportId
        );

      if (!transport) {
        this.fail(
          job,
          "transport disappeared"
        );
        continue;
      }

      const entity =
        this.environment.world
          .getEntity(
            transport.worldEntityId
          );

      if (!entity) {
        this.fail(
          job,
          "transport world entity disappeared"
        );
        continue;
      }

      if (entity.journey) {
        continue;
      }

      if (
        !this.environment.transfers
          .canEntityTransfer(
            transferEnvironment,
            job.transportId,
            job.targetPlaceId
          )
      ) {
        this.fail(
          job,
          "transport did not reach target transfer range"
        );
        continue;
      }

      const delivered =
        this.environment.transfers
          .transferEntityToPlace(
            transferEnvironment,
            job.transportId,
            "cargo",
            job.targetPlaceId,
            job.targetChannel,
            job.itemId,
            job.amount
          );

      job.deliveredAmount =
        delivered.moved;

      if (
        delivered.moved !==
        job.amount
      ) {
        this.fail(
          job,
          "target could not accept complete hauling load"
        );
        continue;
      }

      job.phase = "complete";
    }
  }

  private fail(
    job: HaulingJob,
    reason: string
  ): void {
    job.phase = "failed";
    job.failureReason = reason;
  }
}
