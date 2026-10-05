import type { PlaceRegistry } from "place-core";

import { marketplaceDefinition } from "./commerce/marketplace.js";
import { prisonDefinition } from "./civic/prison.js";
import { townHallDefinition } from "./civic/town-hall.js";
import { tavernDefinition } from "./hospitality/tavern.js";
import { foundryDefinition } from "./production/foundry.js";
import { mineDefinition } from "./production/mine.js";
import { residenceDefinition } from "./residential/residence.js";

export {
  marketplaceDefinition
} from "./commerce/marketplace.js";

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
  mineDefinition
} from "./production/mine.js";

export {
  residenceDefinition
} from "./residential/residence.js";

export const placeDefinitions = [
  marketplaceDefinition,
  residenceDefinition,
  townHallDefinition,
  prisonDefinition,
  tavernDefinition,
  foundryDefinition,
  mineDefinition
] as const;

export function registerPlaceDefinitions(registry: PlaceRegistry): void {
  for (const definition of placeDefinitions) {
    registry.registerDefinition(definition);
  }
}
