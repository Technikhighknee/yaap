import type {
  ItemDefinition
} from "./types.js";

import {
  ItemRegistry
} from "./registry.js";

export const ITEM_DEFINITIONS = [
  { id: "iron-ore" },
  { id: "silver-ore" },
  { id: "gold-ore" },
  { id: "iron" },
  { id: "silver" },
  { id: "gold" },
  { id: "charcoal" },
  { id: "gemstone" },
  { id: "pinewood" },
  { id: "oakwood" },
  { id: "water" },
  { id: "wheat" },
  { id: "hops" },
  { id: "cattle" },
  { id: "sheep" }
] as const satisfies
  readonly ItemDefinition[];

export function registerItemDefinitions(
  registry: ItemRegistry
): void {
  for (
    const definition
    of ITEM_DEFINITIONS
  ) {
    registry.register(
      definition
    );
  }
}
