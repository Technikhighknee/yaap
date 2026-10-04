import {
  Navigation,
  NavigationRegistry,
  World,
  startJourney,
  stopJourney
} from "world-core";

import {
  PlaceRegistry,
  WorldCoreBridge
} from "place-core";

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

  return {
    world,
    navigation,
    bridge,
    places
  };
}
