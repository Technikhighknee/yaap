import type {
  Inventory
} from "./inventory.js";

import {
  InventoryRegistry
} from "./registry.js";

import type {
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
  | "sales";

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

    return binding;
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
    return this.bindings.delete(
      bindingKey(
        owner,
        channel
      )
    );
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
    }

    return {
      bindingCount:
        this.bindings.size
    };
  }
}
