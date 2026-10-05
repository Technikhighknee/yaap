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

import {
  registerGatheringOutputs
} from "./gathering/definitions.js";
import {
  GatheringSystem
} from "./gathering/system.js";
import {
  InventoryBindingRegistry
} from "./inventory/bindings.js";
import {
  InventoryRegistry
} from "./inventory/registry.js";
import {
  PlaceTransferRegistry
} from "./logistics/transfer.js";
import {
  registerItemDefinitions
} from "./items/definitions.js";
import {
  ItemRegistry
} from "./items/registry.js";
import { registerPlaceDefinitions } from "./places/definitions/index.js";
import {
  registerResourceDefinitions
} from "./resources/definitions.js";
import {
  ResourceRegistry
} from "./resources/registry.js";
import {
  registerTransportDefinitions
} from "./transports/definitions.js";
import {
  TransportRegistry
} from "./transports/registry.js";

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

  const items =
    new ItemRegistry();
  registerItemDefinitions(items);

  const inventories =
    new InventoryRegistry(items);
  const inventoryBindings =
    new InventoryBindingRegistry(
      inventories
    );

  const transfers =
    new PlaceTransferRegistry(
      places
    );

  const gathering =
    new GatheringSystem({
      world,
      navigation,
      resources,
      items,
      inventoryBindings,
      transfers
    });
  registerGatheringOutputs(
    gathering
  );

  const transports =
    new TransportRegistry({
      world,
      navigation,
      places,
      inventories,
      inventoryBindings
    });
  registerTransportDefinitions(
    transports
  );

  return {
    world,
    navigation,
    bridge,
    places,
    resources,
    items,
    inventories,
    inventoryBindings,
    transfers,
    gathering,
    transports
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

  simulation.transports.step();
  simulation.gathering.step(
    deltaSeconds
  );

  stepPlaceSimulation(
    simulation.places,
    simulation.bridge,
    deltaSeconds
  );
}
