import { createSimulation } from "./simulation.js";

const simulation = createSimulation();

console.log(JSON.stringify({
  world: simulation.world.getDiagnostics(),
  places: simulation.places.getDiagnostics()
}, null, 2));
