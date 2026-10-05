import type {
  Simulation
} from "../simulation.js";

import type {
  Inventory
} from "./inventory.js";

import type {
  InventoryChannel,
  InventoryOwner
} from "./bindings.js";

export interface OwnerInventorySpec {
  readonly slotCount: number;
  readonly slotCapacity: number;
}

function requireOwner(
  simulation: Simulation,
  owner: InventoryOwner
): void {
  if (
    owner.kind === "entity"
  ) {
    if (
      !simulation.world.getEntity(
        owner.id
      )
    ) {
      throw new Error(
        `unknown inventory entity owner: ${owner.id}`
      );
    }

    return;
  }

  if (
    !simulation.places.getPlace(
      owner.id
    )
  ) {
    throw new Error(
      `unknown inventory place owner: ${owner.id}`
    );
  }
}

export function ownerInventoryId(
  owner: InventoryOwner,
  channel: InventoryChannel
): string {
  return `${owner.kind}:${owner.id}:${channel}`;
}

export function createOwnerInventory(
  simulation: Simulation,
  owner: InventoryOwner,
  channel: InventoryChannel,
  spec: OwnerInventorySpec
): Inventory {
  requireOwner(
    simulation,
    owner
  );

  const inventory =
    simulation.inventories.create({
      id: ownerInventoryId(
        owner,
        channel
      ),
      slotCount:
        spec.slotCount,
      slotCapacity:
        spec.slotCapacity
    });

  try {
    simulation.inventoryBindings.bind(
      owner,
      channel,
      inventory.id
    );
  } catch (error) {
    simulation.inventories.remove(
      inventory.id
    );
    throw error;
  }

  return inventory;
}
