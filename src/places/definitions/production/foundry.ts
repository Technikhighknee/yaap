import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "foundry",
  kind: "building",
  tags: ["building", "production", "crafting", "foundry"],
  defaultAnchorId: "foundry-entry",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 10,
    maxY: 8
  },

  layers: [
    {
      spatialMode: "owned",
      id: "ground",
      kind: "floor",
      navigation: {
        nodes: [
          { id: "front-door", x: 5, y: 0.5 },
          { id: "workshop-center", x: 5, y: 4 },
          { id: "forge", x: 2.25, y: 2.5 },
          { id: "anvil", x: 3, y: 5.75 },
          { id: "quench-tub", x: 7.5, y: 2.5 },
          { id: "workbench", x: 7.25, y: 5.75 }
        ],
        roads: [
          {
            id: "front-to-workshop",
            from: "front-door",
            to: "workshop-center",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "workshop-to-forge",
            from: "workshop-center",
            to: "forge",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "workshop-to-anvil",
            from: "workshop-center",
            to: "anvil",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "workshop-to-quench-tub",
            from: "workshop-center",
            to: "quench-tub",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "workshop-to-workbench",
            from: "workshop-center",
            to: "workbench",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "workshop",
      layerId: "ground",
      kind: "workshop",
      tags: ["production", "crafting", "smithing"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 8
      },
      defaultAnchorId: "workshop-center"
    }
  ],

  portals: [
    {
      id: "front-door",
      kind: "door",
      tags: ["entrance"],
      a: {
        kind: "external",
        slot: "street"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "workshop",
        position: { x: 5, y: 0.5 },
        nodeId: "front-door"
      },
      blocksWhenClosed: true
    }
  ],

  anchors: [
    {
      id: "foundry-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 5, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance"]
    },
    {
      id: "workshop-center",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 5, y: 4 },
      nodeId: "workshop-center",
      tags: ["workshop", "production"]
    },
    {
      id: "forge",
      kind: "forge",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 2.25, y: 2.5 },
      nodeId: "forge",
      tags: ["forge", "smithing", "production", "workstation"]
    },
    {
      id: "anvil",
      kind: "anvil",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 3, y: 5.75 },
      nodeId: "anvil",
      tags: ["anvil", "smithing", "production", "workstation"]
    },
    {
      id: "quench-tub",
      kind: "quench-tub",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 7.5, y: 2.5 },
      nodeId: "quench-tub",
      tags: ["quenching", "smithing", "production", "workstation"]
    },
    {
      id: "workbench",
      kind: "workbench",
      layerId: "ground",
      spaceId: "workshop",
      position: { x: 7.25, y: 5.75 },
      nodeId: "workbench",
      tags: ["workbench", "crafting", "production", "workstation"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const foundryDefinition = compilePlace(blueprint);
