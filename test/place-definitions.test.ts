import assert from "node:assert/strict";
import test from "node:test";

import { createSimulation } from "../src/simulation.js";
import {
  alehouseDefinition,
  foundryDefinition,
  placeDefinitions,
  prisonDefinition,
  residenceDefinition,
  townHallDefinition
} from "../src/places/definitions/index.js";

test("residence shares one interior while upgrade rooms start disabled", () => {
  assert.equal(residenceDefinition.id, "residence");

  assert.deepEqual(
    residenceDefinition.layers.map((layer) => layer.id),
    ["ground"]
  );

  assert.deepEqual(
    residenceDefinition.spaces.map((space) => [
      space.id,
      space.enabled
    ]),
    [
      ["living-room", true],
      ["bedroom", true],
      ["study", false],
      ["salon", false],
      ["backroom", false]
    ]
  );

  assert.deepEqual(
    residenceDefinition.portals.map((portal) => portal.id),
    [
      "front-door",
      "bedroom-door",
      "study-door",
      "salon-door",
      "backroom-door"
    ]
  );

  const { places } = createSimulation();
  const residence = places.createPlace({
    id: "home",
    definitionId: "residence"
  });

  assert.equal(residence.spaceOverrides.size, 0);
  assert.equal(
    places.getSpace("home", "study")?.enabled,
    false
  );
  assert.equal(
    places.resolveAnchor("home", "study-desk"),
    null
  );
  assert.equal(
    places.resolvePortal("home", "study-door")?.traversable,
    false
  );

  places.setSpaceState(
    "home",
    "study",
    { enabled: true }
  );

  assert.equal(
    places.getSpace("home", "study")?.enabled,
    true
  );
  assert.ok(
    places.resolveAnchor("home", "study-desk")
  );
  assert.equal(
    places.resolvePortal("home", "study-door")?.traversable,
    true
  );
  assert.deepEqual(
    residence.spaceOverrides.get("study"),
    { enabled: true }
  );

  places.setSpaceState(
    "home",
    "study",
    { enabled: false }
  );
  assert.equal(residence.spaceOverrides.size, 0);
});

test("town hall contains only the entrance hall and council chamber", () => {
  assert.equal(townHallDefinition.id, "town-hall");

  assert.deepEqual(
    townHallDefinition.layers.map((layer) => layer.id),
    ["ground"]
  );

  assert.deepEqual(
    townHallDefinition.spaces.map((space) => space.id),
    ["entrance-hall", "council-chamber"]
  );

  assert.deepEqual(
    townHallDefinition.portals.map((portal) => portal.id),
    ["front-door", "council-chamber-door"]
  );

  assert.ok(townHallDefinition.getAnchor("clerk-desk"));
  assert.ok(townHallDefinition.getAnchor("council-table"));
});

test("prison separates detention cells from the cellar torture chamber", () => {
  assert.equal(prisonDefinition.id, "prison");

  assert.deepEqual(
    prisonDefinition.layers.map((layer) => layer.id),
    ["ground", "cellar"]
  );

  assert.deepEqual(
    prisonDefinition.spaces.map((space) => space.id),
    [
      "cell-block",
      "cell-a",
      "cell-b",
      "cell-c",
      "cell-d",
      "torture-chamber"
    ]
  );

  assert.deepEqual(
    prisonDefinition.getAnchorsByTag("cell")
      .map((anchor) => anchor.id)
      .sort(),
    [
      "cell-a-center",
      "cell-b-center",
      "cell-c-center",
      "cell-d-center"
    ]
  );

  assert.equal(
    prisonDefinition.getPortal("stairs-to-cellar")?.a.kind,
    "local"
  );
  assert.equal(
    prisonDefinition.getPortal("stairs-to-cellar")?.b.kind,
    "local"
  );

  for (const id of ["a", "b", "c", "d"]) {
    const portal = prisonDefinition.getPortal(`cell-${id}-door`);

    assert.ok(portal);
    assert.equal(portal.kind, "cell-door");
    assert.equal(portal.blocksWhenClosed, true);
    assert.deepEqual(
      portal.roadBindings,
      [
        {
          layerId: "ground",
          roadId: `cell-${id}-threshold`
        }
      ]
    );
  }

  assert.ok(prisonDefinition.getAnchor("guard-post"));
  assert.ok(prisonDefinition.getAnchor("torture-table"));
  assert.equal(
    prisonDefinition.getAnchor("cell-block-center")?.nodeId,
    "cell-block-center"
  );
});

test("alehouse has a dining room above a brew cellar", () => {
  assert.equal(alehouseDefinition.id, "alehouse");

  assert.deepEqual(
    alehouseDefinition.layers.map((layer) => layer.id),
    ["ground", "cellar"]
  );

  assert.deepEqual(
    alehouseDefinition.spaces.map((space) => space.id),
    ["dining-room", "brew-cellar"]
  );

  assert.deepEqual(
    alehouseDefinition.portals.map((portal) => portal.id),
    ["front-door", "stairs-to-cellar"]
  );

  assert.equal(
    alehouseDefinition.getSpace("dining-room")?.defaultAnchorId,
    "dining-room-center"
  );
  assert.equal(
    alehouseDefinition.getSpace("brew-cellar")?.defaultAnchorId,
    "brew-cellar-center"
  );

  assert.deepEqual(
    alehouseDefinition.getAnchorsByTag("table")
      .map((anchor) => anchor.id)
      .sort(),
    ["table-a", "table-b", "table-c"]
  );

  assert.deepEqual(
    alehouseDefinition.getAnchorsByTag("workstation")
      .map((anchor) => anchor.id)
      .sort(),
    ["brew-vat-a", "brew-vat-b"]
  );

  assert.ok(alehouseDefinition.getAnchor("serving-counter"));
  assert.ok(alehouseDefinition.getAnchor("brew-vat-a"));
  assert.ok(alehouseDefinition.getAnchor("brew-vat-b"));
});

test("foundry is one workshop with concrete shared functional anchors", () => {
  assert.equal(foundryDefinition.id, "foundry");

  assert.deepEqual(
    foundryDefinition.layers.map((layer) => layer.id),
    ["ground"]
  );

  assert.deepEqual(
    foundryDefinition.spaces.map((space) => space.id),
    ["workshop"]
  );

  assert.deepEqual(
    foundryDefinition.portals.map((portal) => portal.id),
    ["front-door"]
  );

  assert.deepEqual(
    foundryDefinition.getAnchorsByTag("workstation")
      .map((anchor) => anchor.id)
      .sort(),
    ["anvil", "forge", "quench-tub", "workbench"]
  );

  assert.equal(
    foundryDefinition.getSpace("workshop")?.defaultAnchorId,
    "workshop-center"
  );
});

test("simulation registers every shared place definition once", () => {
  const { places } = createSimulation();

  assert.equal(places.definitions.size, placeDefinitions.length);

  for (const definition of placeDefinitions) {
    assert.equal(
      places.getDefinition(definition.id),
      definition
    );
  }
});
