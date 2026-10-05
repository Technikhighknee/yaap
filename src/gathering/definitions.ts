import type {
  GatheringOutputDefinition
} from "./types.js";

import {
  GatheringSystem
} from "./system.js";

export const GATHERING_OUTPUTS = [
  {
    resourceTypeId: "iron",
    itemId: "iron-ore",
    amount: 5,
    workSeconds: 8
  },
  {
    resourceTypeId: "silver",
    itemId: "silver-ore",
    amount: 5,
    workSeconds: 8
  },
  {
    resourceTypeId: "gold",
    itemId: "gold-ore",
    amount: 5,
    workSeconds: 8
  },
  {
    resourceTypeId: "gemstone",
    itemId: "gemstone",
    amount: 5,
    workSeconds: 8
  },
  {
    resourceTypeId: "pinewood",
    itemId: "pinewood",
    amount: 5,
    workSeconds: 8
  },
  {
    resourceTypeId: "oakwood",
    itemId: "oakwood",
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
