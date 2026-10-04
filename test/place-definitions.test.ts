import assert from "node:assert/strict";
import test from "node:test";

import { createSimulation } from "../src/simulation.js";
import { smallTownhouseDefinition } from "../src/places/definitions/index.js";

test("small townhouse definition compiles with the intended topology", () => {
  assert.equal(smallTownhouseDefinition.id, "small-townhouse");
  assert.equal(smallTownhouseDefinition.layers.length, 3);
  assert.equal(smallTownhouseDefinition.getLayer("ground")?.kind, "floor");
  assert.equal(smallTownhouseDefinition.getLayer("upper")?.kind, "floor");
  assert.equal(smallTownhouseDefinition.getLayer("cellar")?.kind, "floor");

  assert.equal(smallTownhouseDefinition.getSpace("living-room")?.parentSpaceId, "ground-floor");
  assert.equal(smallTownhouseDefinition.getSpace("bedroom-front")?.parentSpaceId, "upper-floor");
  assert.equal(smallTownhouseDefinition.getSpace("cellar")?.kind, "cellar");

  assert.equal(smallTownhouseDefinition.getPortal("front-door")?.kind, "door");
  assert.equal(smallTownhouseDefinition.getPortal("stairs-to-upper")?.kind, "stairs");
  assert.equal(smallTownhouseDefinition.getPortal("stairs-to-cellar")?.kind, "stairs");

  assert.deepEqual(
    smallTownhouseDefinition.getAnchorsByTag("sleep").map((anchor) => anchor.id).sort(),
    ["bed-front", "bed-middle", "bed-rear"]
  );
});

test("simulation registers the shared small townhouse definition once", () => {
  const { places } = createSimulation();

  assert.equal(places.definitions.size, 1);
  assert.equal(places.getDefinition("small-townhouse"), smallTownhouseDefinition);
});
