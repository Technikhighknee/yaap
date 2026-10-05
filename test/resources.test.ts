import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  startTravel
} from "place-core";

import {
  createSmallTownScenario,
  SMALL_TOWN_IDS,
  SMALL_TOWN_RESOURCE_IDS
} from "../src/scenarios/small-town.js";

import {
  createSimulation,
  stepSimulation
} from "../src/simulation.js";

test("resource definitions are separate from runtime node instances", () => {
  const simulation =
    createSimulation();
  const {
    resources
  } = simulation;

  const ironDefinition =
    resources.getNodeDefinition(
      "iron-node"
    );
  const fieldDefinition =
    resources.getNodeDefinition(
      "field"
    );

  assert.deepEqual(
    ironDefinition?.resource,
    {
      kind: "fixed",
      resourceTypeId: "iron"
    }
  );
  assert.deepEqual(
    fieldDefinition?.resource,
    {
      kind: "assignable"
    }
  );

  const field =
    resources.createNode({
      id: "field-runtime-01",
      definitionId: "field",
      location: {
        domainId: "default",
        position: {
          x: 10,
          y: 20
        },
        navigationNodeId:
          "field-runtime-01"
      }
    });

  assert.equal(
    field.resourceTypeId,
    null
  );

  resources.setNodeResourceType(
    field.id,
    "wheat"
  );
  assert.equal(
    field.resourceTypeId,
    "wheat"
  );

  resources.setNodeResourceType(
    field.id,
    "hops"
  );
  assert.equal(
    field.resourceTypeId,
    "hops"
  );

  const iron =
    resources.createNode({
      id: "iron-runtime-01",
      definitionId: "iron-node",
      location: {
        domainId: "default",
        position: {
          x: 30,
          y: 40
        },
        navigationNodeId:
          "iron-runtime-01"
      }
    });

  assert.equal(
    iron.resourceTypeId,
    "iron"
  );

  assert.throws(
    () =>
      resources.setNodeResourceType(
        iron.id,
        "gold"
      ),
    /fixed resource type/
  );

  resources.assertInternalConsistency();
});

test("small town materializes reachable resource nodes outside the town", () => {
  const simulation =
    createSmallTownScenario();

  const {
    world,
    places,
    bridge,
    resources
  } = simulation;

  assert.equal(
    resources.nodes.size,
    7
  );

  const iron =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.iron
    );
  const silver =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.silver
    );
  const gold =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.gold
    );
  const gemstone =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.gemstone
    );
  const pinewood =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.pinewood
    );
  const oakwood =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.oakwood
    );
  const well =
    resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.well
    );

  assert.ok(iron);
  assert.ok(silver);
  assert.ok(gold);
  assert.ok(gemstone);
  assert.ok(pinewood);
  assert.ok(oakwood);
  assert.ok(well);

  assert.equal(
    iron.resourceTypeId,
    "iron"
  );
  assert.equal(
    silver.resourceTypeId,
    "silver"
  );
  assert.equal(
    gold.resourceTypeId,
    "gold"
  );
  assert.equal(
    gemstone.resourceTypeId,
    "gemstone"
  );
  assert.equal(
    pinewood.resourceTypeId,
    "pinewood"
  );
  assert.equal(
    oakwood.resourceTypeId,
    "oakwood"
  );
  assert.equal(
    well.resourceTypeId,
    "water"
  );

  const bed =
    places.resolveAnchor(
      SMALL_TOWN_IDS.residence,
      "bed"
    );
  assert.ok(bed);

  world.addEntity({
    id: "prospector",
    domainId: bed.domainId,
    position: bed.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const travel =
    startTravel(
      places,
      bridge,
      "prospector",
      {
        domainId:
          iron.location.domainId,
        position:
          iron.location.position,
        nodeId:
          iron.location
            .navigationNodeId
      }
    );

  assert.ok(travel);

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    places.activeTravels.has(
      "prospector"
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
    "prospector should reach the iron node"
  );

  const prospector =
    world.getEntity("prospector");
  assert.ok(prospector);

  assert.equal(
    prospector.domainId,
    iron.location.domainId
  );
  assert.deepEqual(
    prospector.position,
    iron.location.position
  );

  resources.assertInternalConsistency();
  places.assertInternalConsistency();
  world.assertInternalConsistency();
  simulation.navigation
    .assertInternalConsistency();
});
