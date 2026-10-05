import {
  Navigation
} from "world-core";

import { createSimulation } from "../simulation.js";

export const SMALL_TOWN_IDS = {
  marketplace: "market-square",
  residence: "house",
  tavern: "tavern",
  foundry: "foundry",
  townHall: "town-hall",
  prison: "prison"
} as const;

export function createSmallTownScenario() {
  const simulation = createSimulation();
  const {
    navigation,
    places
  } = simulation;

  const city = new Navigation();

  const nodes = [
    ["market-center", 112, 109],
    ["market-raw-materials", 104, 104],
    ["market-food", 112, 103],
    ["market-iron-goods", 120, 104],
    ["market-textiles", 105, 114],
    ["market-miscellaneous", 119, 114],
    ["house-street", 88, 104],
    ["tavern-street", 136, 104],
    ["foundry-street", 88, 116],
    ["town-hall-street", 136, 116],
    ["prison-street", 112, 132]
  ] as const;

  for (const [id, x, y] of nodes) {
    city.addNode({ id, x, y });
  }

  const connections = [
    ["market-to-raw-materials", "market-center", "market-raw-materials"],
    ["market-to-food", "market-center", "market-food"],
    ["market-to-iron-goods", "market-center", "market-iron-goods"],
    ["market-to-textiles", "market-center", "market-textiles"],
    ["market-to-miscellaneous", "market-center", "market-miscellaneous"],
    ["market-to-house", "market-center", "house-street"],
    ["market-to-tavern", "market-center", "tavern-street"],
    ["market-to-foundry", "market-center", "foundry-street"],
    ["market-to-town-hall", "market-center", "town-hall-street"],
    ["market-to-prison", "market-center", "prison-street"]
  ] as const;

  for (const [id, from, to] of connections) {
    city.addRoad({
      id,
      from,
      to,
      width: 4,
      surface: "street"
    });
  }

  navigation.registerTopology(
    "small-town",
    city
  );
  navigation.bindDomain(
    "default",
    "small-town"
  );

  places.createPlace({
    id: SMALL_TOWN_IDS.marketplace,
    definitionId: "marketplace",
    layerDomains: {
      market: "default"
    },
    embeddedNodeBindings: {
      anchors: {
        "market-center": "market-center",
        "raw-materials-stall":
          "market-raw-materials",
        "food-stall": "market-food",
        "iron-goods-stall":
          "market-iron-goods",
        "textiles-stall":
          "market-textiles",
        "miscellaneous-stall":
          "market-miscellaneous"
      }
    },
    placement: {
      domainId: "default",
      containment: "footprint",
      transform: {
        x: 100,
        y: 100,
        rotation: 0,
        scale: 1
      }
    }
  });

  const buildings = [
    {
      id: SMALL_TOWN_IDS.residence,
      definitionId: "residence",
      streetNodeId: "house-street",
      position: { x: 88, y: 104 },
      transform: { x: 84.5, y: 103.5 }
    },
    {
      id: SMALL_TOWN_IDS.tavern,
      definitionId: "tavern",
      streetNodeId: "tavern-street",
      position: { x: 136, y: 104 },
      transform: { x: 131.25, y: 103.5 }
    },
    {
      id: SMALL_TOWN_IDS.foundry,
      definitionId: "foundry",
      streetNodeId: "foundry-street",
      position: { x: 88, y: 116 },
      transform: { x: 83, y: 115.5 }
    },
    {
      id: SMALL_TOWN_IDS.townHall,
      definitionId: "town-hall",
      streetNodeId: "town-hall-street",
      position: { x: 136, y: 116 },
      transform: { x: 131, y: 115.5 }
    },
    {
      id: SMALL_TOWN_IDS.prison,
      definitionId: "prison",
      streetNodeId: "prison-street",
      position: { x: 112, y: 132 },
      transform: { x: 106, y: 131.5 }
    }
  ] as const;

  for (const building of buildings) {
    places.createPlace({
      id: building.id,
      definitionId:
        building.definitionId,
      attachments: {
        street: {
          domainId: "default",
          position:
            building.position,
          nodeId:
            building.streetNodeId
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          ...building.transform,
          rotation: 0,
          scale: 1
        }
      }
    });
  }

  places.assertInternalConsistency();
  simulation.world.assertInternalConsistency();
  simulation.navigation.assertInternalConsistency();

  return simulation;
}
