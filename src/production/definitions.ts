import type {
  ProductionRecipeDefinition
} from "./types.js";

import {
  ProductionSystem
} from "./system.js";

export const PRODUCTION_RECIPES = [
  {
    id: "burn-pine-charcoal",
    inputs: [
      {
        itemId: "pinewood",
        amount: 5
      }
    ],
    outputs: [
      {
        itemId: "charcoal",
        amount: 2
      }
    ],
    workSeconds: 16,
    workstationTag:
      "charcoal-burning"
  },
  {
    id: "burn-oak-charcoal",
    inputs: [
      {
        itemId: "oakwood",
        amount: 5
      }
    ],
    outputs: [
      {
        itemId: "charcoal",
        amount: 2
      }
    ],
    workSeconds: 16,
    workstationTag:
      "charcoal-burning"
  },
  {
    id: "smelt-iron",
    inputs: [
      {
        itemId: "iron-ore",
        amount: 5
      },
      {
        itemId: "charcoal",
        amount: 2
      }
    ],
    outputs: [
      {
        itemId: "iron",
        amount: 5
      }
    ],
    workSeconds: 12,
    workstationTag: "forge"
  }
] as const satisfies
  readonly ProductionRecipeDefinition[];

export function registerProductionRecipes(
  system: ProductionSystem
): void {
  for (
    const recipe
    of PRODUCTION_RECIPES
  ) {
    system.registerRecipe(
      recipe
    );
  }
}
