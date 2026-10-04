import assert from "node:assert/strict";
import test from "node:test";

import { createSimulation } from "../src/simulation.js";

test("boots world-core and place-core together", () => {
  const simulation = createSimulation();

  assert.ok(simulation.world);
  assert.ok(simulation.navigation);
  assert.ok(simulation.bridge);
  assert.ok(simulation.places);
});
