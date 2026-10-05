import type {
  InventoryChannel
} from "../inventory/bindings.js";

export type HaulingPhase =
  | "travelling"
  | "complete"
  | "failed";

export interface HaulingJob {
  readonly transportId: string;
  readonly sourcePlaceId: string;
  readonly sourceChannel:
    InventoryChannel;
  readonly targetPlaceId: string;
  readonly targetChannel:
    InventoryChannel;
  readonly itemId: string;
  readonly amount: number;
  phase: HaulingPhase;
  deliveredAmount: number;
  failureReason: string | null;
}
