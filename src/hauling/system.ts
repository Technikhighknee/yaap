import type {
  World
} from "world-core";

import type {
  InventoryBindingRegistry,
  InventoryChannel
} from "../inventory/bindings.js";

import type {
  Inventory
} from "../inventory/inventory.js";

import type {
  PlaceTransferRegistry
} from "../logistics/transfer.js";

import type {
  TransportRegistry
} from "../transports/registry.js";

import type {
  HaulingJob,
  HaulingManifestLine
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

function canonicalManifest(
  manifest:
    readonly HaulingManifestLine[]
): readonly Readonly<HaulingManifestLine>[] {
  if (manifest.length === 0) {
    throw new TypeError(
      "hauling manifest must not be empty"
    );
  }

  const seen =
    new Set<string>();

  return Object.freeze(
    manifest.map((line) => {
      if (line.itemId.length === 0) {
        throw new TypeError(
          "hauling manifest itemId must not be empty"
        );
      }

      assertPositiveSafeInteger(
        line.amount,
        "hauling manifest amount"
      );

      if (seen.has(line.itemId)) {
        throw new Error(
          `hauling manifest contains duplicate item: ${line.itemId}`
        );
      }
      seen.add(line.itemId);

      return Object.freeze({
        itemId: line.itemId,
        amount: line.amount
      });
    })
  );
}

function inventoryCanAcceptManifest(
  inventory: Inventory,
  manifest:
    readonly Readonly<HaulingManifestLine>[]
): boolean {
  let emptySlots =
    inventory.slots.filter(
      (slot) =>
        slot.itemId === null
    ).length;

  for (const line of manifest) {
    let remaining =
      line.amount;

    for (const slot of inventory.slots) {
      if (
        slot.itemId !==
        line.itemId
      ) {
        continue;
      }

      remaining -= Math.min(
        remaining,
        inventory.slotCapacity -
          slot.quantity
      );

      if (remaining === 0) {
        break;
      }
    }

    if (remaining === 0) {
      continue;
    }

    const neededSlots =
      Math.ceil(
        remaining /
          inventory.slotCapacity
      );

    emptySlots -=
      neededSlots;

    if (emptySlots < 0) {
      return false;
    }
  }

  return true;
}

function transferManifest(
  source: Inventory,
  target: Inventory,
  manifest:
    readonly Readonly<HaulingManifestLine>[]
): void {
  const moved:
    Readonly<HaulingManifestLine>[] = [];

  for (const line of manifest) {
    const result =
      source.transferTo(
        target,
        line.itemId,
        line.amount
      );

    if (
      result.moved ===
      line.amount
    ) {
      moved.push(line);
      continue;
    }

    if (result.moved > 0) {
      const currentRollback =
        target.transferTo(
          source,
          line.itemId,
          result.moved
        );

      if (
        currentRollback.moved !==
        result.moved
      ) {
        throw new Error(
          "hauling manifest current-line rollback failed"
        );
      }
    }

    for (
      let index =
        moved.length - 1;
      index >= 0;
      index -= 1
    ) {
      const previous =
        moved[index];

      if (!previous) {
        continue;
      }

      const rollback =
        target.transferTo(
          source,
          previous.itemId,
          previous.amount
        );

      if (
        rollback.moved !==
        previous.amount
      ) {
        throw new Error(
          "hauling manifest rollback failed"
        );
      }
    }

    throw new Error(
      "hauling manifest transfer changed after validation"
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
    manifest:
      readonly HaulingManifestLine[];
  }): HaulingJob {
    const manifest =
      canonicalManifest(
        input.manifest
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

    for (const line of manifest) {
      if (
        source.quantityOf(
          line.itemId
        ) < line.amount
      ) {
        throw new Error(
          `hauling source lacks requested item: ${line.itemId}`
        );
      }
    }

    if (
      !inventoryCanAcceptManifest(
        cargo,
        manifest
      )
    ) {
      throw new Error(
        "hauling cargo lacks requested manifest capacity"
      );
    }

    if (
      !inventoryCanAcceptManifest(
        target,
        manifest
      )
    ) {
      throw new Error(
        "hauling target lacks requested manifest capacity"
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

    transferManifest(
      source,
      cargo,
      manifest
    );

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
      transferManifest(
        cargo,
        source,
        manifest
      );

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
      manifest,
      phase: "travelling",
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

      if (
        transport.operatorEntityId ===
        null
      ) {
        this.fail(
          job,
          "transport lost operator"
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

      const targetEndpoint =
        this.environment.transfers.get(
          job.targetPlaceId
        );

      if (!targetEndpoint) {
        this.fail(
          job,
          "hauling target transfer endpoint unavailable"
        );
        continue;
      }

      if (entity.journey) {
        if (
          entity.journey
            .destinationNodeId !==
          targetEndpoint
            .navigationNodeId
        ) {
          try {
            if (
              !this.environment
                .transports
                .rerouteJourney(
                  job.transportId,
                  targetEndpoint
                    .navigationNodeId
                )
            ) {
              this.fail(
                job,
                "hauling target reroute failed"
              );
            }
          } catch {
            this.fail(
              job,
              "hauling target reroute failed"
            );
          }
        }

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

      const target =
        this.environment
          .inventoryBindings
          .getInventory(
            {
              kind: "place",
              id: job.targetPlaceId
            },
            job.targetChannel
          );
      const cargo =
        this.environment.transports
          .cargo(
            job.transportId
          );

      if (!target) {
        this.fail(
          job,
          "target inventory disappeared"
        );
        continue;
      }

      let cargoIntact = true;

      for (const line of job.manifest) {
        if (
          cargo.quantityOf(
            line.itemId
          ) < line.amount
        ) {
          cargoIntact = false;
          break;
        }
      }

      if (!cargoIntact) {
        this.fail(
          job,
          "hauling cargo changed during transit"
        );
        continue;
      }

      if (
        !inventoryCanAcceptManifest(
          target,
          job.manifest
        )
      ) {
        this.fail(
          job,
          "target no longer has capacity for complete hauling manifest"
        );
        continue;
      }

      try {
        transferManifest(
          cargo,
          target,
          job.manifest
        );
      } catch {
        this.fail(
          job,
          "hauling unload changed after validation"
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
