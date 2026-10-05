import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "marketplace",
  kind: "marketplace",
  tags: [
    "marketplace",
    "market",
    "commerce",
    "public"
  ],
  defaultAnchorId: "market-center",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 24,
    maxY: 18
  },

  layers: [
    {
      id: "market",
      kind: "outdoor",
      spatialMode: "embedded",
      tags: ["outdoor", "public"]
    }
  ],

  spaces: [
    {
      id: "market-square",
      layerId: "market",
      kind: "market-square",
      tags: [
        "market",
        "commerce",
        "public",
        "outdoor"
      ],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 24,
        maxY: 18
      },
      defaultAnchorId: "market-center"
    }
  ],

  anchors: [
    {
      id: "market-center",
      kind: "market-center",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 12, y: 9 },
      tags: ["market", "public"]
    },
    {
      id: "raw-materials-stall",
      kind: "market-stall",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 4, y: 4 },
      tags: [
        "market",
        "market-stall",
        "trade",
        "raw-materials"
      ]
    },
    {
      id: "food-stall",
      kind: "market-stall",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 12, y: 3 },
      tags: [
        "market",
        "market-stall",
        "trade",
        "food"
      ]
    },
    {
      id: "iron-goods-stall",
      kind: "market-stall",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 20, y: 4 },
      tags: [
        "market",
        "market-stall",
        "trade",
        "iron-goods"
      ]
    },
    {
      id: "textiles-stall",
      kind: "market-stall",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 5, y: 14 },
      tags: [
        "market",
        "market-stall",
        "trade",
        "textiles"
      ]
    },
    {
      id: "miscellaneous-stall",
      kind: "market-stall",
      layerId: "market",
      spaceId: "market-square",
      position: { x: 19, y: 14 },
      tags: [
        "market",
        "market-stall",
        "trade",
        "miscellaneous"
      ]
    }
  ]
} satisfies PlaceDefinitionInput;

export const marketplaceDefinition =
  compilePlace(blueprint);
