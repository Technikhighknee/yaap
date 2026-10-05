import type {
  Inventory
} from "./inventory.js";

import {
  InventoryRegistry
} from "./registry.js";

import type {
  CreateInventoryInput,
  InventoryId
} from "./types.js";

export type InventoryOwner =
  | {
      readonly kind: "entity";
      readonly id: string;
    }
  | {
      readonly kind: "place";
      readonly id: string;
    };

export type InventoryChannel =
  | "carried"
  | "storage"
  | "sales"
  | "cargo";

export interface InventoryBinding {
  readonly owner: InventoryOwner;
  readonly channel:
    InventoryChannel;
  readonly inventoryId:
    InventoryId;
}

function assertNonEmptyString(
  value: string,
  label: string
): void {
  if (value.length === 0) {
    throw new TypeError(
      `${label} must not be empty`
    );
  }
}

function ownerKey(
  owner: InventoryOwner
): string {
  return `${owner.kind}\u0000${owner.id}`;
}

function bindingKey(
  owner: InventoryOwner,
  channel: InventoryChannel
): string {
  return `${ownerKey(owner)}\u0000${channel}`;
}

export class InventoryBindingRegistry {
  private readonly bindings =
    new Map<
      string,
      InventoryBinding
    >();

  private readonly inventoryOwners =
    new Map<
      InventoryId,
      string
    >();

  constructor(
    readonly inventories:
      InventoryRegistry
  ) {}

  bind(
    owner: InventoryOwner,
    channel: InventoryChannel,
    inventoryId: InventoryId
  ): InventoryBinding {
    assertNonEmptyString(
      owner.id,
      "inventory owner id"
    );

    this.inventories.get(
      inventoryId
    ) ??
      (() => {
        throw new Error(
          `unknown inventory: ${inventoryId}`
        );
      })();

    if (
      this.inventoryOwners.has(
        inventoryId
      )
    ) {
      throw new Error(
        `inventory already bound: ${inventoryId}`
      );
    }

    const key =
      bindingKey(
        owner,
        channel
      );

    if (
      this.bindings.has(key)
    ) {
      throw new Error(
        `inventory channel already bound: ${owner.kind}:${owner.id}:${channel}`
      );
    }

    const binding =
      Object.freeze({
        owner:
          Object.freeze({
            kind: owner.kind,
            id: owner.id
          }) as InventoryOwner,
        channel,
        inventoryId
      });

    this.bindings.set(
      key,
      binding
    );
    this.inventoryOwners.set(
      inventoryId,
      key
    );

    return binding;
  }

  createBoundInventory(
    owner: InventoryOwner,
    channel: InventoryChannel,
    input: CreateInventoryInput
  ): Inventory {
    assertNonEmptyString(
      owner.id,
      "inventory owner id"
    );

    if (
      this.getBinding(
        owner,
        channel
      )
    ) {
      throw new Error(
        `inventory channel already bound: ${owner.kind}:${owner.id}:${channel}`
      );
    }

    const inventory =
      this.inventories.create(
        input
      );

    this.bind(
      owner,
      channel,
      inventory.id
    );

    return inventory;
  }

  getBinding(
    owner: InventoryOwner,
    channel: InventoryChannel
  ): InventoryBinding | null {
    return (
      this.bindings.get(
        bindingKey(
          owner,
          channel
        )
      ) ??
      null
    );
  }

  getInventory(
    owner: InventoryOwner,
    channel: InventoryChannel
  ): Inventory | null {
    const binding =
      this.getBinding(
        owner,
        channel
      );

    if (!binding) {
      return null;
    }

    return this.inventories.get(
      binding.inventoryId
    );
  }

  bindingsFor(
    owner: InventoryOwner
  ): readonly InventoryBinding[] {
    const key = ownerKey(owner);

    return Array.from(
      this.bindings.values()
    ).filter(
      (binding) =>
        ownerKey(
          binding.owner
        ) === key
    );
  }

  unbind(
    owner: InventoryOwner,
    channel: InventoryChannel
  ): boolean {
    const key =
      bindingKey(
        owner,
        channel
      );
    const binding =
      this.bindings.get(key);

    if (!binding) {
      return false;
    }

    this.bindings.delete(key);
    this.inventoryOwners.delete(
      binding.inventoryId
    );

    return true;
  }

  assertInternalConsistency(): {
    bindingCount: number;
  } {
    for (
      const binding
      of this.bindings.values()
    ) {
      assertNonEmptyString(
        binding.owner.id,
        "inventory owner id"
      );

      if (
        !this.inventories.get(
          binding.inventoryId
        )
      ) {
        throw new Error(
          `inventory binding references missing inventory: ${binding.inventoryId}`
        );
      }

      const key =
        bindingKey(
          binding.owner,
          binding.channel
        );

      if (
        this.inventoryOwners.get(
          binding.inventoryId
        ) !== key
      ) {
        throw new Error(
          `inventory binding reverse index mismatch: ${binding.inventoryId}`
        );
      }
    }

    if (
      this.inventoryOwners.size !==
      this.bindings.size
    ) {
      throw new Error(
        "inventory binding index size mismatch"
      );
    }

    return {
      bindingCount:
        this.bindings.size
    };
  }
}
