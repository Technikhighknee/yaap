import type {
  ProductionRecipeDefinition
} from "./types.js";

import {
  ProductionSystem
} from "./system.js";

export const PRODUCTION_RECIPES = [
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
    workstationAnchorId: "forge"
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
