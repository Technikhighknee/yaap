import type {
  ItemId
} from "../items/types.js";

export type InventoryId = string;

export interface InventorySlot {
  itemId: ItemId | null;
  quantity: number;
}

export interface CreateInventoryInput {
  readonly id: InventoryId;
  readonly slotCount: number;
  readonly slotCapacity: number;
}

export interface InventoryMutationResult {
  readonly requested: number;
  readonly moved: number;
  readonly remainder: number;
}
