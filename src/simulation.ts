import {
  Navigation,
  NavigationRegistry,
  World,
  startJourney,
  stepSimulation as stepWorldSimulation,
  stopJourney
} from "world-core";

import {
  PlaceRegistry,
  WorldCoreBridge,
  stepPlaceSimulation
} from "place-core";

import { registerPlaceDefinitions } from "./places/definitions/index.js";
import {
  registerResourceDefinitions
} from "./resources/definitions.js";
import {
  ResourceRegistry
} from "./resources/registry.js";

export function createSimulation() {
  const world = new World();
  const navigation = new NavigationRegistry();

  const bridge = new WorldCoreBridge({
    world,
    navigation,
    Navigation,
    startJourney,
    stopJourney
  });

  const places = new PlaceRegistry({ bridge });
  registerPlaceDefinitions(places);

  const resources =
    new ResourceRegistry();
  registerResourceDefinitions(
    resources
  );

  return {
    world,
    navigation,
    bridge,
    places,
    resources
  };
}

export type Simulation =
  ReturnType<typeof createSimulation>;

export function stepSimulation(
  simulation: Simulation,
  deltaSeconds: number
): void {
  stepWorldSimulation(
    simulation.world,
    simulation.navigation,
    deltaSeconds
  );

  stepPlaceSimulation(
    simulation.places,
    simulation.bridge,
    deltaSeconds
  );
}
