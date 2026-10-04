import type { PlaceRegistry } from "place-core";

import { smallTownhouseDefinition } from "./residential/small-townhouse.js";

export {
  smallTownhouseDefinition
} from "./residential/small-townhouse.js";

export const placeDefinitions = [
  smallTownhouseDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
