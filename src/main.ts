import {
  mobilityProfile
} from "world-core";

import {
  startTravel
} from "place-core";

import {
  createSmallTownScenario,
  SMALL_TOWN_IDS
} from "./scenarios/small-town.js";

import {
  stepSimulation
} from "./simulation.js";

const simulation =
  createSmallTownScenario();

const bed =
  simulation.places.resolveAnchor(
    SMALL_TOWN_IDS.residence,
    "bed"
  );

if (!bed) {
  throw new Error(
    "small-town residence bed is unavailable"
  );
}

simulation.world.addEntity({
  id: "buyer",
  domainId: bed.domainId,
  position: bed.position,
  mobility: mobilityProfile("pedestrian")
});

const travel =
  startTravel(
    simulation.places,
    simulation.bridge,
    "buyer",
    {
      placeId:
        SMALL_TOWN_IDS.marketplace,
      anchorId: "food-stall"
    }
  );

if (!travel) {
  throw new Error(
    "buyer could not start travel to the food stall"
  );
}

const deltaSeconds = 0.25;
const maxTicks = 2_000;
let ticks = 0;

while (
  simulation.places.activeTravels.has(
    "buyer"
  ) &&
  ticks < maxTicks
) {
  stepSimulation(
    simulation,
    deltaSeconds
  );
  ticks += 1;
}

if (
  simulation.places.activeTravels.has(
    "buyer"
  )
) {
  throw new Error(
    "buyer did not reach the food stall within the simulation limit"
  );
}

const buyer =
  simulation.world.getEntity("buyer");

if (!buyer) {
  throw new Error(
    "buyer disappeared during travel"
  );
}

const location =
  simulation.places.getEntityLocation(
    "buyer"
  );

console.log(JSON.stringify({
  ticks,
  elapsedSeconds:
    ticks * deltaSeconds,
  buyer: {
    domainId: buyer.domainId,
    position: buyer.position
  },
  location: location
    ? {
        places: location.places,
        spaces: location.spaces.map(
          (space) => space.spaceId
        )
      }
    : null,
  world:
    simulation.world.getDiagnostics(),
  places:
    simulation.places.getDiagnostics()
}, null, 2));
