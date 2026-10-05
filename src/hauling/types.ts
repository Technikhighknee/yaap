import type {
  InventoryChannel
} from "../inventory/bindings.js";

export type HaulingPhase =
  | "travelling"
  | "complete"
  | "failed";

export interface HaulingManifestLine {
  readonly itemId: string;
  readonly amount: number;
}

export interface HaulingJob {
  readonly transportId: string;
  readonly sourcePlaceId: string;
  readonly sourceChannel:
    InventoryChannel;
  readonly targetPlaceId: string;
  readonly targetChannel:
    InventoryChannel;
  readonly manifest:
    readonly Readonly<HaulingManifestLine>[];
  phase: HaulingPhase;
  failureReason: string | null;
}
