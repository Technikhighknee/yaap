import assert from "node:assert/strict";
import test from "node:test";

import { createSimulation } from "../src/simulation.js";
import { smallHutDefinition } from "../src/places/definitions/index.js";

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

test("simulation registers the shared small hut definition once", () => {
  const { places } = createSimulation();

  assert.equal(places.definitions.size, 1);
  assert.equal(
    places.getDefinition("small-hut"),
    smallHutDefinition
  );
});
