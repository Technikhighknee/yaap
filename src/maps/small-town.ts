import type {
  MapDefinition
} from "./types.js";

export const SMALL_TOWN_IDS = {
  marketplace: "market-square",
  residence: "house",
  tavern: "tavern",
  foundry: "foundry",
  mine: "mine",
  woodcutterCamp: "woodcutter-camp",
  townHall: "town-hall",
  prison: "prison"
} as const;

export const SMALL_TOWN_RESOURCE_IDS = {
  iron: "iron-01",
  silver: "silver-01",
  gold: "gold-01",
  gemstone: "gemstone-01",
  pinewood: "pinewood-01",
  oakwood: "oakwood-01",
  well: "well-01"
} as const;

export const SMALL_TOWN_MAP:
  MapDefinition = {
  id: "small-town",

  navigation: {
    topologies: [
      {
        id: "small-town",
        nodes: [
          {
            id: "market-center",
            x: 112,
            y: 109
          },
          {
            id: "market-raw-materials",
            x: 104,
            y: 104
          },
          {
            id: "market-food",
            x: 112,
            y: 103
          },
          {
            id: "market-iron-goods",
            x: 120,
            y: 104
          },
          {
            id: "market-textiles",
            x: 105,
            y: 114
          },
          {
            id: "market-miscellaneous",
            x: 119,
            y: 114
          },
          {
            id: "house-street",
            x: 88,
            y: 104
          },
          {
            id: "tavern-street",
            x: 136,
            y: 104
          },
          {
            id: "foundry-street",
            x: 88,
            y: 116
          },
          {
            id: "foundry-loading",
            x: 88,
            y: 112
          },
          {
            id: "town-hall-street",
            x: 136,
            y: 116
          },
          {
            id: "prison-street",
            x: 112,
            y: 132
          },
          {
            id: "outskirts-crossroad",
            x: 112,
            y: 154
          },
          {
            id: "well-01",
            x: 124,
            y: 148
          },
          {
            id: "mine-crossroad",
            x: 92,
            y: 178
          },
          {
            id: "mine-loading",
            x: 92,
            y: 168
          },
          {
            id: "iron-01",
            x: 70,
            y: 190
          },
          {
            id: "silver-01",
            x: 84,
            y: 202
          },
          {
            id: "gold-01",
            x: 100,
            y: 190
          },
          {
            id: "gemstone-01",
            x: 114,
            y: 204
          },
          {
            id: "wood-crossroad",
            x: 144,
            y: 176
          },
          {
            id: "woodcutter-loading",
            x: 144,
            y: 166
          },
          {
            id: "woodcutter-charcoal-kiln",
            x: 147,
            y: 166
          },
          {
            id: "pinewood-01",
            x: 150,
            y: 192
          },
          {
            id: "oakwood-01",
            x: 170,
            y: 202
          }
        ],
        roads: [
          {
            id: "market-to-raw-materials",
            from: "market-center",
            to: "market-raw-materials",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-food",
            from: "market-center",
            to: "market-food",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-iron-goods",
            from: "market-center",
            to: "market-iron-goods",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-textiles",
            from: "market-center",
            to: "market-textiles",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-miscellaneous",
            from: "market-center",
            to: "market-miscellaneous",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-house",
            from: "market-center",
            to: "house-street",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-tavern",
            from: "market-center",
            to: "tavern-street",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-foundry",
            from: "market-center",
            to: "foundry-street",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-foundry-loading",
            from: "market-center",
            to: "foundry-loading",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-town-hall",
            from: "market-center",
            to: "town-hall-street",
            width: 4,
            surface: "street"
          },
          {
            id: "market-to-prison",
            from: "market-center",
            to: "prison-street",
            width: 4,
            surface: "street"
          },
          {
            id: "prison-to-outskirts",
            from: "prison-street",
            to: "outskirts-crossroad",
            width: 3,
            surface: "road"
          },
          {
            id: "outskirts-to-well",
            from: "outskirts-crossroad",
            to: "well-01",
            width: 2,
            surface: "path"
          },
          {
            id: "outskirts-to-mine-crossroad",
            from: "outskirts-crossroad",
            to: "mine-crossroad",
            width: 3,
            surface: "road"
          },
          {
            id: "crossroad-to-mine-loading",
            from: "mine-crossroad",
            to: "mine-loading",
            width: 3,
            surface: "road"
          },
          {
            id: "mine-to-iron",
            from: "mine-crossroad",
            to: "iron-01",
            width: 2,
            surface: "path"
          },
          {
            id: "mine-to-silver",
            from: "mine-crossroad",
            to: "silver-01",
            width: 2,
            surface: "path"
          },
          {
            id: "mine-to-gold",
            from: "mine-crossroad",
            to: "gold-01",
            width: 2,
            surface: "path"
          },
          {
            id: "mine-to-gemstone",
            from: "mine-crossroad",
            to: "gemstone-01",
            width: 2,
            surface: "path"
          },
          {
            id: "outskirts-to-wood-crossroad",
            from: "outskirts-crossroad",
            to: "wood-crossroad",
            width: 3,
            surface: "road"
          },
          {
            id: "crossroad-to-woodcutter-loading",
            from: "wood-crossroad",
            to: "woodcutter-loading",
            width: 3,
            surface: "road"
          },
          {
            id: "woodcutter-loading-to-charcoal-kiln",
            from: "woodcutter-loading",
            to: "woodcutter-charcoal-kiln",
            width: 2,
            surface: "path"
          },
          {
            id: "wood-to-pinewood",
            from: "wood-crossroad",
            to: "pinewood-01",
            width: 2,
            surface: "path"
          },
          {
            id: "wood-to-oakwood",
            from: "wood-crossroad",
            to: "oakwood-01",
            width: 2,
            surface: "path"
          }
        ]
      }
    ],
    domains: [
      {
        domainId: "default",
        topologyId: "small-town"
      }
    ]
  },

  places: [
    {
      id: SMALL_TOWN_IDS.marketplace,
      definitionId: "marketplace",
      layerDomains: {
        market: "default"
      },
      embeddedNodeBindings: {
        anchors: {
          "market-center":
            "market-center",
          "raw-materials-stall":
            "market-raw-materials",
          "food-stall":
            "market-food",
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
    },
    {
      id: SMALL_TOWN_IDS.residence,
      definitionId: "residence",
      attachments: {
        street: {
          domainId: "default",
          position: {
            x: 88,
            y: 104
          },
          nodeId: "house-street"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 84.5,
          y: 103.5,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.tavern,
      definitionId: "tavern",
      attachments: {
        street: {
          domainId: "default",
          position: {
            x: 136,
            y: 104
          },
          nodeId: "tavern-street"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 131.25,
          y: 103.5,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.mine,
      definitionId: "mine",
      layerDomains: {
        site: "default"
      },
      embeddedNodeBindings: {
        anchors: {
          loading: "mine-loading"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 85,
          y: 163,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.woodcutterCamp,
      definitionId: "woodcutter-camp",
      layerDomains: {
        site: "default"
      },
      embeddedNodeBindings: {
        anchors: {
          loading: "woodcutter-loading",
          "charcoal-kiln":
            "woodcutter-charcoal-kiln"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 139,
          y: 162,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.foundry,
      definitionId: "foundry",
      attachments: {
        street: {
          domainId: "default",
          position: {
            x: 88,
            y: 116
          },
          nodeId: "foundry-street"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 83,
          y: 115.5,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.townHall,
      definitionId: "town-hall",
      attachments: {
        street: {
          domainId: "default",
          position: {
            x: 136,
            y: 116
          },
          nodeId: "town-hall-street"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 131,
          y: 115.5,
          rotation: 0,
          scale: 1
        }
      }
    },
    {
      id: SMALL_TOWN_IDS.prison,
      definitionId: "prison",
      attachments: {
        street: {
          domainId: "default",
          position: {
            x: 112,
            y: 132
          },
          nodeId: "prison-street"
        }
      },
      placement: {
        domainId: "default",
        containment: "footprint",
        transform: {
          x: 106,
          y: 131.5,
          rotation: 0,
          scale: 1
        }
      }
    }
  ],

  resourceNodes: [
    {
      id: SMALL_TOWN_RESOURCE_IDS.iron,
      definitionId: "iron-node",
      location: {
        domainId: "default",
        position: {
          x: 70,
          y: 190
        },
        navigationNodeId: "iron-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.silver,
      definitionId: "silver-node",
      location: {
        domainId: "default",
        position: {
          x: 84,
          y: 202
        },
        navigationNodeId: "silver-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.gold,
      definitionId: "gold-node",
      location: {
        domainId: "default",
        position: {
          x: 100,
          y: 190
        },
        navigationNodeId: "gold-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.gemstone,
      definitionId: "gemstone-node",
      location: {
        domainId: "default",
        position: {
          x: 114,
          y: 204
        },
        navigationNodeId:
          "gemstone-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.pinewood,
      definitionId: "pinewood-node",
      location: {
        domainId: "default",
        position: {
          x: 150,
          y: 192
        },
        navigationNodeId:
          "pinewood-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.oakwood,
      definitionId: "oakwood-node",
      location: {
        domainId: "default",
        position: {
          x: 170,
          y: 202
        },
        navigationNodeId:
          "oakwood-01"
      }
    },
    {
      id: SMALL_TOWN_RESOURCE_IDS.well,
      definitionId: "well",
      location: {
        domainId: "default",
        position: {
          x: 124,
          y: 148
        },
        navigationNodeId: "well-01"
      }
    }
  ]
};
