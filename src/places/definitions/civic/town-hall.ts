import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "town-hall",
  kind: "building",
  tags: ["building", "civic", "government"],
  defaultAnchorId: "town-hall-entry",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 10,
    maxY: 8
  },

  layers: [
    {
      id: "ground",
      kind: "floor",
      navigation: {
        nodes: [
          { id: "front-door", x: 5, y: 0.5 },
          { id: "entrance-hall-center", x: 5, y: 2 },
          { id: "clerk-desk", x: 2.5, y: 2 },
          { id: "council-door-hall", x: 5, y: 3.25 },
          { id: "council-door-chamber", x: 5, y: 3.75 },
          { id: "council-chamber-center", x: 5, y: 6 },
          { id: "council-table", x: 5, y: 6.75 }
        ],
        roads: [
          {
            id: "front-to-entrance-hall",
            from: "front-door",
            to: "entrance-hall-center",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "entrance-hall-to-clerk-desk",
            from: "entrance-hall-center",
            to: "clerk-desk",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "entrance-hall-to-council-door",
            from: "entrance-hall-center",
            to: "council-door-hall",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "council-door-threshold",
            from: "council-door-hall",
            to: "council-door-chamber",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "council-chamber-inside",
            from: "council-door-chamber",
            to: "council-chamber-center",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "council-chamber-to-table",
            from: "council-chamber-center",
            to: "council-table",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "entrance-hall",
      layerId: "ground",
      kind: "room",
      tags: ["public", "administration"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 3.5
      },
      defaultAnchorId: "entrance-hall-center"
    },
    {
      id: "council-chamber",
      layerId: "ground",
      kind: "room",
      tags: ["council", "assembly", "court"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 3.5,
        maxX: 10,
        maxY: 8
      },
      defaultAnchorId: "council-chamber-center"
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
        spaceId: "entrance-hall",
        position: { x: 5, y: 0.5 },
        nodeId: "front-door"
      },
      blocksWhenClosed: true
    },
    {
      id: "council-chamber-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 5, y: 3.25 },
        nodeId: "council-door-hall"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "council-chamber",
        position: { x: 5, y: 3.75 },
        nodeId: "council-door-chamber"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "council-door-threshold"
        }
      ]
    }
  ],

  anchors: [
    {
      id: "town-hall-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "entrance-hall",
      position: { x: 5, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance"]
    },
    {
      id: "entrance-hall-center",
      layerId: "ground",
      spaceId: "entrance-hall",
      position: { x: 5, y: 2 },
      nodeId: "entrance-hall-center",
      tags: ["public", "administration"]
    },
    {
      id: "clerk-desk",
      kind: "clerk-desk",
      layerId: "ground",
      spaceId: "entrance-hall",
      position: { x: 2.5, y: 2 },
      nodeId: "clerk-desk",
      tags: ["administration", "clerk", "service"]
    },
    {
      id: "council-chamber-center",
      layerId: "ground",
      spaceId: "council-chamber",
      position: { x: 5, y: 6 },
      nodeId: "council-chamber-center",
      tags: ["council", "assembly", "court"]
    },
    {
      id: "council-table",
      kind: "council-table",
      layerId: "ground",
      spaceId: "council-chamber",
      position: { x: 5, y: 6.75 },
      nodeId: "council-table",
      tags: ["council", "assembly", "meeting"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const townHallDefinition = compilePlace(blueprint);
