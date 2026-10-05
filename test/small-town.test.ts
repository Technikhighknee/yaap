import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  planTravel,
  startTravel
} from "place-core";

import {
  createSmallTownScenario,
  SMALL_TOWN_IDS
} from "../src/scenarios/small-town.js";

import {
  stepSimulation
} from "../src/simulation.js";

test("small town composes owned interiors with one embedded marketplace", () => {
  const simulation =
    createSmallTownScenario();
  const {
    world,
    places,
    bridge
  } = simulation;

  assert.deepEqual(
    [
      SMALL_TOWN_IDS.marketplace,
      SMALL_TOWN_IDS.residence,
      SMALL_TOWN_IDS.tavern,
      SMALL_TOWN_IDS.foundry,
      SMALL_TOWN_IDS.townHall,
      SMALL_TOWN_IDS.prison
    ].map((id) =>
      places.getPlace(id)?.definitionId
    ),
    [
      "marketplace",
      "residence",
      "tavern",
      "foundry",
      "town-hall",
      "prison"
    ]
  );

  assert.equal(
    places.getDomainBinding("default"),
    null
  );

  const foodStall =
    places.resolveAnchor(
      SMALL_TOWN_IDS.marketplace,
      "food-stall"
    );
  assert.ok(foodStall);
  assert.equal(
    foodStall.domainId,
    "default"
  );
  assert.equal(
    foodStall.nodeId,
    "market-food"
  );
  assert.deepEqual(
    foodStall.position,
    { x: 112, y: 103 }
  );

  const marketContext =
    places.locate(
      "default",
      foodStall.position
    );
  assert.deepEqual(
    marketContext.places,
    [SMALL_TOWN_IDS.marketplace]
  );
  assert.deepEqual(
    marketContext.spaces.map(
      (space) => space.spaceId
    ),
    ["market-square"]
  );

  const bed =
    places.resolveAnchor(
      SMALL_TOWN_IDS.residence,
      "bed"
    );
  assert.ok(bed);

  world.addEntity({
    id: "buyer",
    domainId: bed.domainId,
    position: bed.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const plan = planTravel(
    places,
    bridge,
    "buyer",
    {
      placeId:
        SMALL_TOWN_IDS.marketplace,
      anchorId: "food-stall"
    }
  );

  assert.ok(plan);
  assert.equal(
    plan.resolvedTarget.domainId,
    "default"
  );
  assert.equal(
    plan.resolvedTarget.nodeId,
    "market-food"
  );
  assert.deepEqual(
    plan.domainPath,
    [
      bed.domainId,
      "default"
    ]
  );
  assert.ok(
    plan.steps.some(
      (step) =>
        step.type ===
        "traverse-portal"
    )
  );
  assert.equal(
    plan.steps.at(-1)?.type,
    "local-journey"
  );

  places.assertInternalConsistency();
  world.assertInternalConsistency();
});


test("buyer actually travels from the residence bed to the marketplace food stall", () => {
  const simulation =
    createSmallTownScenario();

  const {
    world,
    places,
    bridge
  } = simulation;

  const bed =
    places.resolveAnchor(
      SMALL_TOWN_IDS.residence,
      "bed"
    );
  const foodStall =
    places.resolveAnchor(
      SMALL_TOWN_IDS.marketplace,
      "food-stall"
    );

  assert.ok(bed);
  assert.ok(foodStall);

  world.addEntity({
    id: "buyer",
    domainId: bed.domainId,
    position: bed.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const travel =
    startTravel(
      places,
      bridge,
      "buyer",
      {
        placeId:
          SMALL_TOWN_IDS.marketplace,
        anchorId: "food-stall"
      }
    );

  assert.ok(travel);
  assert.equal(
    travel.status,
    "active"
  );
  assert.ok(
    places.entitiesInPlace(
      SMALL_TOWN_IDS.residence
    ).has("buyer")
  );

  const deltaSeconds = 0.25;
  const maxTicks = 2_000;
  let ticks = 0;

  while (
    places.activeTravels.has(
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

  assert.ok(
    ticks < maxTicks,
    "buyer should complete the trip within the simulation limit"
  );
  assert.equal(
    places.activeTravels.has(
      "buyer"
    ),
    false
  );

  const buyer =
    world.getEntity("buyer");
  assert.ok(buyer);

  assert.equal(
    buyer.domainId,
    foodStall.domainId
  );
  assert.deepEqual(
    buyer.position,
    foodStall.position
  );

  const location =
    places.getEntityLocation(
      "buyer"
    );
  assert.ok(location);

  assert.deepEqual(
    location.places,
    [SMALL_TOWN_IDS.marketplace]
  );
  assert.deepEqual(
    location.spaces.map(
      (space) => space.spaceId
    ),
    ["market-square"]
  );

  assert.equal(
    places.entitiesInPlace(
      SMALL_TOWN_IDS.residence
    ).has("buyer"),
    false
  );
  assert.ok(
    places.entitiesInPlace(
      SMALL_TOWN_IDS.marketplace
    ).has("buyer")
  );
  assert.ok(
    places.entitiesInSpace(
      SMALL_TOWN_IDS.marketplace,
      "market-square"
    ).has("buyer")
  );

  places.assertInternalConsistency();
  world.assertInternalConsistency();
  simulation.navigation
    .assertInternalConsistency();
});
