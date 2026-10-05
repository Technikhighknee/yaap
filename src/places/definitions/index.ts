import type { PlaceRegistry } from "place-core";

import { townHallDefinition } from "./civic/town-hall.js";
import { smallHutDefinition } from "./residential/small-hut.js";

export {
  townHallDefinition
} from "./civic/town-hall.js";

export {
  smallHutDefinition
} from "./residential/small-hut.js";

export const placeDefinitions = [
  smallHutDefinition,
  townHallDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
