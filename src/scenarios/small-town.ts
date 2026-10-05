import {
  SMALL_TOWN_IDS,
  SMALL_TOWN_MAP,
  SMALL_TOWN_RESOURCE_IDS
} from "../maps/small-town.js";

import {
  materializeMap
} from "../maps/materialize.js";

import {
  createSimulation
} from "../simulation.js";

export {
  SMALL_TOWN_IDS,
  SMALL_TOWN_RESOURCE_IDS
};

export function createSmallTownScenario() {
  return materializeMap(
    createSimulation(),
    SMALL_TOWN_MAP
  );
}
