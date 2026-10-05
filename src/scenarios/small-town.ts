import {
  createOwnerInventory
} from "../inventory/owners.js";

import {
  SMALL_TOWN_IDS,
  SMALL_TOWN_MAP,
  SMALL_TOWN_RESOURCE_IDS
} from "../maps/small-town.js";

import {
  materializeMap
} from "../maps/materialize.js";

import {
  createSimulation
} from "../simulation.js";

export {
  SMALL_TOWN_IDS,
  SMALL_TOWN_RESOURCE_IDS
};

export const SMALL_TOWN_INVENTORY_SPECS = {
  mine: {
    storage: {
      slotCount: 4,
      slotCapacity: 20
    }
  },
  foundry: {
    storage: {
      slotCount: 4,
      slotCapacity: 20
    },
    sales: {
      slotCount: 4,
      slotCapacity: 20
    }
  }
} as const;

export function createSmallTownScenario() {
  const simulation =
    materializeMap(
      createSimulation(),
      SMALL_TOWN_MAP
    );

  createOwnerInventory(
    simulation,
    {
      kind: "place",
      id: SMALL_TOWN_IDS.mine
    },
    "storage",
    SMALL_TOWN_INVENTORY_SPECS
      .mine.storage
  );

  const mineLoading =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.mine,
      "loading"
    );

  if (!mineLoading || !mineLoading.nodeId) {
    throw new Error(
      "small-town mine loading anchor is unresolved"
    );
  }

  simulation.transfers.register({
    placeId: SMALL_TOWN_IDS.mine,
    domainId: mineLoading.domainId,
    position: mineLoading.position,
    navigationNodeId:
      mineLoading.nodeId,
    range: 6
  });

  createOwnerInventory(
    simulation,
    {
      kind: "place",
      id: SMALL_TOWN_IDS.foundry
    },
    "storage",
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.storage
  );

  createOwnerInventory(
    simulation,
    {
      kind: "place",
      id: SMALL_TOWN_IDS.foundry
    },
    "sales",
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.sales
  );

  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();

  return simulation;
}
