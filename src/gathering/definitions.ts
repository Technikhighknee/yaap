import type {
  GatheringOutputDefinition
} from "./types.js";

export const GATHERING_OUTPUTS = [
  {
    resourceTypeId: "iron",
    itemId: "iron",
    amount: 5,
    workSeconds: 8
  }
] as const satisfies
  readonly GatheringOutputDefinition[];
