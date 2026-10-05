import type { PlaceRegistry } from "place-core";

import { prisonDefinition } from "./civic/prison.js";
import { townHallDefinition } from "./civic/town-hall.js";
import { tavernDefinition } from "./hospitality/tavern.js";
import { foundryDefinition } from "./production/foundry.js";
import { residenceDefinition } from "./residential/residence.js";

export {
  prisonDefinition
} from "./civic/prison.js";

export {
  townHallDefinition
} from "./civic/town-hall.js";

export {
  tavernDefinition
} from "./hospitality/tavern.js";

export {
  foundryDefinition
} from "./production/foundry.js";

export {
  residenceDefinition
} from "./residential/residence.js";

export const placeDefinitions = [
  residenceDefinition,
  townHallDefinition,
  prisonDefinition,
  tavernDefinition,
  foundryDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
