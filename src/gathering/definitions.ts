import type {
  GatheringOutputDefinition
} from "./types.js";

import {
  GatheringSystem
} from "./system.js";

export const GATHERING_OUTPUTS = [
  {
    resourceTypeId: "iron",
    itemId: "iron",
    amount: 5,
    workSeconds: 8
  }
] as const satisfies
  readonly GatheringOutputDefinition[];

export function registerGatheringOutputs(
  system: GatheringSystem
): void {
  for (const output of GATHERING_OUTPUTS) {
    system.registerOutput(output);
  }
}
