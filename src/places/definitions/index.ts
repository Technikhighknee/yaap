import type { PlaceRegistry } from "place-core";

import { smallHutDefinition } from "./residential/small-hut.js";

export {
  smallHutDefinition
} from "./residential/small-hut.js";

export const placeDefinitions = [
  smallHutDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
