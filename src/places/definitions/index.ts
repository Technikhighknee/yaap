import type { PlaceRegistry } from "place-core";

import { prisonDefinition } from "./civic/prison.js";
import { townHallDefinition } from "./civic/town-hall.js";
import { alehouseDefinition } from "./hospitality/alehouse.js";
import { smallHutDefinition } from "./residential/small-hut.js";

export {
  prisonDefinition
} from "./civic/prison.js";

export {
  townHallDefinition
} from "./civic/town-hall.js";

export {
  alehouseDefinition
} from "./hospitality/alehouse.js";

export {
  smallHutDefinition
} from "./residential/small-hut.js";

export const placeDefinitions = [
  smallHutDefinition,
  townHallDefinition,
  prisonDefinition,
  alehouseDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
