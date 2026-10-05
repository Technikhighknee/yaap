import {
  ItemRegistry
} from "../items/registry.js";

import {
  Inventory
} from "./inventory.js";

import type {
  CreateInventoryInput,
  InventoryId
} from "./types.js";

export class InventoryRegistry {
  readonly inventories =
    new Map<
      InventoryId,
      Inventory
    >();

  constructor(
    readonly items: ItemRegistry
  ) {}

  create(
    input: CreateInventoryInput
  ): Inventory {
    if (
      this.inventories.has(
        input.id
      )
    ) {
      throw new Error(
        `inventory already exists: ${input.id}`
      );
    }

    const inventory =
      new Inventory(
        this.items,
        input
      );

    this.inventories.set(
      inventory.id,
      inventory
    );

    return inventory;
  }

  get(
    id: InventoryId
  ): Inventory | null {
    return (
      this.inventories.get(id) ??
      null
    );
  }

  remove(
    id: InventoryId
  ): boolean {
    return this.inventories.delete(
      id
    );
  }

  assertInternalConsistency(): {
    inventoryCount: number;
  } {
    for (
      const [
        id,
        inventory
      ] of this.inventories
    ) {
      if (
        id !== inventory.id
      ) {
        throw new Error(
          `invalid inventory registry entry: ${id}`
        );
      }

      inventory
        .assertInternalConsistency();
    }

    return {
      inventoryCount:
        this.inventories.size
    };
  }
}
