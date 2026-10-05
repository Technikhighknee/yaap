import type {
  ItemId
} from "../items/types.js";

import {
  ItemRegistry
} from "../items/registry.js";

import type {
  CreateInventoryInput,
  InventoryMutationResult,
  InventorySlot
} from "./types.js";

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

function result(
  requested: number,
  moved: number
): InventoryMutationResult {
  return Object.freeze({
    requested,
    moved,
    remainder:
      requested - moved
  });
}

interface MutableInventorySlot {
  itemId: ItemId | null;
  quantity: number;
}

export class Inventory {
  readonly id: string;
  readonly slotCapacity: number;
  private readonly slotsInternal:
    MutableInventorySlot[];

  constructor(
    private readonly items:
      ItemRegistry,
    input: CreateInventoryInput
  ) {
    assertNonEmptyString(
      input.id,
      "inventory id"
    );
    assertPositiveSafeInteger(
      input.slotCount,
      "inventory slotCount"
    );
    assertPositiveSafeInteger(
      input.slotCapacity,
      "inventory slotCapacity"
    );

    this.id = input.id;
    this.slotCapacity =
      input.slotCapacity;
    this.slotsInternal = Array.from(
      {
        length:
          input.slotCount
      },
      () => ({
        itemId: null,
        quantity: 0
      })
    );
  }

  get slotCount(): number {
    return this.slotsInternal.length;
  }

  get slots():
    readonly InventorySlot[] {
    return this.slotsInternal;
  }

  quantityOf(
    itemId: ItemId
  ): number {
    this.items.require(itemId);

    let total = 0;

    for (
      const slot
      of this.slotsInternal
    ) {
      if (
        slot.itemId === itemId
      ) {
        total += slot.quantity;
      }
    }

    return total;
  }

  remainingCapacity(
    itemId: ItemId
  ): number {
    this.items.require(itemId);

    let capacity = 0;

    for (
      const slot
      of this.slotsInternal
    ) {
      if (
        slot.itemId === itemId
      ) {
        capacity +=
          this.slotCapacity -
          slot.quantity;
      } else if (
        slot.itemId === null
      ) {
        capacity +=
          this.slotCapacity;
      }
    }

    return capacity;
  }

  add(
    itemId: ItemId,
    amount: number
  ): InventoryMutationResult {
    this.items.require(itemId);
    assertPositiveSafeInteger(
      amount,
      "inventory add amount"
    );

    let remaining = amount;

    for (
      const slot
      of this.slotsInternal
    ) {
      if (
        remaining === 0
      ) {
        break;
      }

      if (
        slot.itemId !== itemId
      ) {
        continue;
      }

      const available =
        this.slotCapacity -
        slot.quantity;
      const toAdd =
        Math.min(
          available,
          remaining
        );

      slot.quantity += toAdd;
      remaining -= toAdd;
    }

    for (
      const slot
      of this.slotsInternal
    ) {
      if (
        remaining === 0
      ) {
        break;
      }

      if (
        slot.itemId !== null
      ) {
        continue;
      }

      const toAdd =
        Math.min(
          this.slotCapacity,
          remaining
        );

      slot.itemId = itemId;
      slot.quantity = toAdd;
      remaining -= toAdd;
    }

    return result(
      amount,
      amount - remaining
    );
  }

  remove(
    itemId: ItemId,
    amount: number
  ): InventoryMutationResult {
    this.items.require(itemId);
    assertPositiveSafeInteger(
      amount,
      "inventory remove amount"
    );

    let remaining = amount;

    for (
      let index =
        this.slotsInternal.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        remaining === 0
      ) {
        break;
      }

      const slot =
        this.slotsInternal[index];

      if (
        !slot ||
        slot.itemId !== itemId
      ) {
        continue;
      }

      const toRemove =
        Math.min(
          slot.quantity,
          remaining
        );

      slot.quantity -= toRemove;
      remaining -= toRemove;

      if (
        slot.quantity === 0
      ) {
        slot.itemId = null;
      }
    }

    return result(
      amount,
      amount - remaining
    );
  }

  transferTo(
    target: Inventory,
    itemId: ItemId,
    amount: number
  ): InventoryMutationResult {
    if (target === this) {
      throw new Error(
        "cannot transfer inventory items to the same inventory"
      );
    }

    this.items.require(itemId);
    target.items.require(itemId);
    assertPositiveSafeInteger(
      amount,
      "inventory transfer amount"
    );

    const movable = Math.min(
      amount,
      this.quantityOf(itemId),
      target.remainingCapacity(
        itemId
      )
    );

    if (movable === 0) {
      return result(amount, 0);
    }

    const removed =
      this.remove(
        itemId,
        movable
      );

    if (
      removed.moved !== movable
    ) {
      throw new Error(
        "inventory transfer source changed during transfer"
      );
    }

    const added =
      target.add(
        itemId,
        movable
      );

    if (
      added.moved !== movable
    ) {
      const rollback =
        this.add(
          itemId,
          removed.moved
        );

      if (
        rollback.moved !==
        removed.moved
      ) {
        throw new Error(
          "inventory transfer rollback failed"
        );
      }

      if (added.moved > 0) {
        const targetRollback =
          target.remove(
            itemId,
            added.moved
          );

        if (
          targetRollback.moved !==
          added.moved
        ) {
          throw new Error(
            "inventory transfer target rollback failed"
          );
        }
      }

      throw new Error(
        "inventory transfer target changed during transfer"
      );
    }

    return result(
      amount,
      movable
    );
  }

  assertInternalConsistency(): {
    slotCount: number;
    occupiedSlotCount: number;
  } {
    let occupiedSlotCount = 0;

    for (
      const slot
      of this.slotsInternal
    ) {
      if (
        slot.itemId === null
      ) {
        if (
          slot.quantity !== 0
        ) {
          throw new Error(
            `empty inventory slot in ${this.id} has a quantity`
          );
        }

        continue;
      }

      this.items.require(
        slot.itemId
      );

      if (
        !Number.isSafeInteger(
          slot.quantity
        ) ||
        slot.quantity <= 0 ||
        slot.quantity >
          this.slotCapacity
      ) {
        throw new Error(
          `invalid inventory slot quantity in ${this.id}`
        );
      }

      occupiedSlotCount += 1;
    }

    return {
      slotCount:
        this.slotsInternal.length,
      occupiedSlotCount
    };
  }
}
