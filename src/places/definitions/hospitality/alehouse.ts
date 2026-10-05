import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "alehouse",
  kind: "building",
  tags: ["building", "hospitality", "alehouse"],
  defaultAnchorId: "alehouse-entry",

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
          { id: "dining-room-center", x: 5, y: 4 },
          { id: "table-a", x: 2.25, y: 2.5 },
          { id: "table-b", x: 5, y: 2.5 },
          { id: "table-c", x: 2.25, y: 5.5 },
          { id: "serving-counter", x: 7.5, y: 3 },
          { id: "stairs-ground", x: 8.5, y: 6.5 }
        ],
        roads: [
          {
            id: "front-to-dining-room",
            from: "front-door",
            to: "dining-room-center",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "dining-room-to-table-a",
            from: "dining-room-center",
            to: "table-a",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "dining-room-to-table-b",
            from: "dining-room-center",
            to: "table-b",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "dining-room-to-table-c",
            from: "dining-room-center",
            to: "table-c",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "dining-room-to-serving-counter",
            from: "dining-room-center",
            to: "serving-counter",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "dining-room-to-stairs",
            from: "dining-room-center",
            to: "stairs-ground",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    },
    {
      id: "cellar",
      kind: "floor",
      tags: ["cellar"],
      navigation: {
        nodes: [
          { id: "stairs-cellar", x: 8.5, y: 6.5 },
          { id: "brew-cellar-center", x: 5, y: 4 },
          { id: "brew-vat-a", x: 3, y: 3 },
          { id: "brew-vat-b", x: 7, y: 3 }
        ],
        roads: [
          {
            id: "stairs-to-brew-cellar",
            from: "stairs-cellar",
            to: "brew-cellar-center",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "brew-cellar-to-vat-a",
            from: "brew-cellar-center",
            to: "brew-vat-a",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "brew-cellar-to-vat-b",
            from: "brew-cellar-center",
            to: "brew-vat-b",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "dining-room",
      layerId: "ground",
      kind: "dining-room",
      tags: ["public", "dining", "social"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 8
      },
      defaultAnchorId: "dining-room-center"
    },
    {
      id: "brew-cellar",
      layerId: "cellar",
      kind: "brew-cellar",
      tags: ["brewing", "cellar"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 8
      },
      defaultAnchorId: "brew-cellar-center"
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
        spaceId: "dining-room",
        position: { x: 5, y: 0.5 },
        nodeId: "front-door"
      },
      blocksWhenClosed: true
    },
    {
      id: "stairs-to-cellar",
      kind: "stairs",
      tags: ["cellar-access"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "dining-room",
        position: { x: 8.5, y: 6.5 },
        nodeId: "stairs-ground"
      },
      b: {
        kind: "local",
        layerId: "cellar",
        spaceId: "brew-cellar",
        position: { x: 8.5, y: 6.5 },
        nodeId: "stairs-cellar"
      },
      transitionCost: 2
    }
  ],

  anchors: [
    {
      id: "alehouse-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 5, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance"]
    },
    {
      id: "dining-room-center",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 5, y: 4 },
      nodeId: "dining-room-center",
      tags: ["dining", "social"]
    },
    {
      id: "table-a",
      kind: "table",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 2.25, y: 2.5 },
      nodeId: "table-a",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "table-b",
      kind: "table",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 5, y: 2.5 },
      nodeId: "table-b",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "table-c",
      kind: "table",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 2.25, y: 5.5 },
      nodeId: "table-c",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "serving-counter",
      kind: "serving-counter",
      layerId: "ground",
      spaceId: "dining-room",
      position: { x: 7.5, y: 3 },
      nodeId: "serving-counter",
      tags: ["service", "serving", "counter"]
    },
    {
      id: "brew-cellar-center",
      layerId: "cellar",
      spaceId: "brew-cellar",
      position: { x: 5, y: 4 },
      nodeId: "brew-cellar-center",
      tags: ["brewing"]
    },
    {
      id: "brew-vat-a",
      kind: "brew-vat",
      layerId: "cellar",
      spaceId: "brew-cellar",
      position: { x: 3, y: 3 },
      nodeId: "brew-vat-a",
      tags: ["brewing", "workstation"]
    },
    {
      id: "brew-vat-b",
      kind: "brew-vat",
      layerId: "cellar",
      spaceId: "brew-cellar",
      position: { x: 7, y: 3 },
      nodeId: "brew-vat-b",
      tags: ["brewing", "workstation"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const alehouseDefinition = compilePlace(blueprint);
