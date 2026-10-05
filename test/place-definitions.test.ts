import assert from "node:assert/strict";
import test from "node:test";

import { createSimulation } from "../src/simulation.js";
import {
  placeDefinitions,
  smallHutDefinition,
  townHallDefinition
} from "../src/places/definitions/index.js";

test("small hut contains only the currently needed residential topology", () => {
  assert.equal(smallHutDefinition.id, "small-hut");

  assert.deepEqual(
    smallHutDefinition.layers.map((layer) => layer.id),
    ["ground"]
  );

  assert.deepEqual(
    smallHutDefinition.spaces.map((space) => space.id),
    ["living-room", "bedroom"]
  );

  assert.deepEqual(
    smallHutDefinition.portals.map((portal) => portal.id),
    ["front-door", "bedroom-door"]
  );

  assert.equal(
    smallHutDefinition.getSpace("living-room")?.defaultAnchorId,
    "living-room-center"
  );
  assert.equal(
    smallHutDefinition.getSpace("bedroom")?.defaultAnchorId,
    "bed"
  );
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

  assert.equal(
    townHallDefinition.getSpace("entrance-hall")?.defaultAnchorId,
    "entrance-hall-center"
  );
  assert.equal(
    townHallDefinition.getSpace("council-chamber")?.defaultAnchorId,
    "council-chamber-center"
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
