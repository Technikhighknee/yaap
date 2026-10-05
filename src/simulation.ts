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

  return {
    world,
    navigation,
    bridge,
    places
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
