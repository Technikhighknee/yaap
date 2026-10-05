import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "tavern",
  kind: "building",
  tags: ["building", "hospitality", "tavern"],
  defaultAnchorId: "tavern-entry",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 12,
    maxY: 10
  },

  layers: [
    {
      id: "ground",
      kind: "floor",
      navigation: {
        nodes: [
          { id: "front-door", x: 4.75, y: 0.5 },
          { id: "taproom-center", x: 4.75, y: 4.5 },
          { id: "table-a", x: 2.25, y: 2.75 },
          { id: "table-b", x: 5, y: 2.75 },
          { id: "table-c", x: 2.25, y: 6 },
          { id: "serving-counter", x: 7.25, y: 3.25 },
          { id: "dance-floor", x: 6.5, y: 6.25 },
          { id: "stairs-cellar-ground", x: 8, y: 8.25 },
          { id: "stairs-upper-ground", x: 1.5, y: 8.25 },

          { id: "bath-door-taproom", x: 9.25, y: 2.5 },
          { id: "bath-door-room", x: 9.75, y: 2.5 },
          { id: "bath-room-center", x: 10.75, y: 2.5 },
          { id: "bath-tub", x: 10.75, y: 3.75 }
        ],
        roads: [
          {
            id: "front-to-taproom",
            from: "front-door",
            to: "taproom-center",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "taproom-to-table-a",
            from: "taproom-center",
            to: "table-a",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-table-b",
            from: "taproom-center",
            to: "table-b",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-table-c",
            from: "taproom-center",
            to: "table-c",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-serving-counter",
            from: "taproom-center",
            to: "serving-counter",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-dance-floor",
            from: "taproom-center",
            to: "dance-floor",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "taproom-to-cellar-stairs",
            from: "taproom-center",
            to: "stairs-cellar-ground",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-upper-stairs",
            from: "taproom-center",
            to: "stairs-upper-ground",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "taproom-to-bath-door",
            from: "taproom-center",
            to: "bath-door-taproom",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "bath-threshold",
            from: "bath-door-taproom",
            to: "bath-door-room",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "bath-inside",
            from: "bath-door-room",
            to: "bath-room-center",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "bath-room-to-tub",
            from: "bath-room-center",
            to: "bath-tub",
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
          { id: "stairs-cellar", x: 8, y: 8.25 },
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
    },
    {
      id: "upper",
      kind: "floor",
      tags: ["lodging"],
      navigation: {
        nodes: [
          { id: "stairs-upper", x: 1.5, y: 8.25 },
          { id: "guest-room-center", x: 5, y: 5 },
          { id: "guest-bed", x: 7, y: 5 }
        ],
        roads: [
          {
            id: "stairs-to-guest-room",
            from: "stairs-upper",
            to: "guest-room-center",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "guest-room-to-bed",
            from: "guest-room-center",
            to: "guest-bed",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "taproom",
      layerId: "ground",
      kind: "taproom",
      tags: ["public", "dining", "drinking", "social"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 9.5,
        maxY: 10
      },
      defaultAnchorId: "taproom-center"
    },
    {
      id: "bath-room",
      layerId: "ground",
      kind: "bath-room",
      tags: ["bath", "private"],
      geometry: {
        type: "aabb",
        minX: 9.5,
        minY: 0,
        maxX: 12,
        maxY: 5
      },
      defaultAnchorId: "bath-tub",
      enabled: false
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
        maxX: 12,
        maxY: 10
      },
      defaultAnchorId: "brew-cellar-center"
    },
    {
      id: "guest-room",
      layerId: "upper",
      kind: "guest-room",
      tags: ["lodging", "sleeping"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 12,
        maxY: 10
      },
      defaultAnchorId: "guest-bed",
      enabled: false
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
        spaceId: "taproom",
        position: { x: 4.75, y: 0.5 },
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
        spaceId: "taproom",
        position: { x: 8, y: 8.25 },
        nodeId: "stairs-cellar-ground"
      },
      b: {
        kind: "local",
        layerId: "cellar",
        spaceId: "brew-cellar",
        position: { x: 8, y: 8.25 },
        nodeId: "stairs-cellar"
      },
      transitionCost: 2
    },
    {
      id: "bath-room-door",
      kind: "door",
      tags: ["bath-access"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "taproom",
        position: { x: 9.25, y: 2.5 },
        nodeId: "bath-door-taproom"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "bath-room",
        position: { x: 9.75, y: 2.5 },
        nodeId: "bath-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "bath-threshold"
        }
      ]
    },
    {
      id: "stairs-to-guest-room",
      kind: "stairs",
      tags: ["lodging-access"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "taproom",
        position: { x: 1.5, y: 8.25 },
        nodeId: "stairs-upper-ground"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "guest-room",
        position: { x: 1.5, y: 8.25 },
        nodeId: "stairs-upper"
      },
      transitionCost: 2
    }
  ],

  anchors: [
    {
      id: "tavern-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 4.75, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance"]
    },
    {
      id: "taproom-center",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 4.75, y: 4.5 },
      nodeId: "taproom-center",
      tags: ["dining", "drinking", "social"]
    },
    {
      id: "table-a",
      kind: "table",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 2.25, y: 2.75 },
      nodeId: "table-a",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "table-b",
      kind: "table",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 5, y: 2.75 },
      nodeId: "table-b",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "table-c",
      kind: "table",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 2.25, y: 6 },
      nodeId: "table-c",
      tags: ["table", "dining", "seating"]
    },
    {
      id: "serving-counter",
      kind: "serving-counter",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 7.25, y: 3.25 },
      nodeId: "serving-counter",
      tags: ["service", "serving", "counter"]
    },
    {
      id: "dance-floor",
      kind: "dance-floor",
      layerId: "ground",
      spaceId: "taproom",
      position: { x: 6.5, y: 6.25 },
      nodeId: "dance-floor",
      tags: ["dance", "social"]
    },
    {
      id: "bath-room-center",
      layerId: "ground",
      spaceId: "bath-room",
      position: { x: 10.75, y: 2.5 },
      nodeId: "bath-room-center",
      tags: ["bath", "private"]
    },
    {
      id: "bath-tub",
      kind: "bath-tub",
      layerId: "ground",
      spaceId: "bath-room",
      position: { x: 10.75, y: 3.75 },
      nodeId: "bath-tub",
      tags: ["bath"]
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
    },
    {
      id: "guest-room-center",
      layerId: "upper",
      spaceId: "guest-room",
      position: { x: 5, y: 5 },
      nodeId: "guest-room-center",
      tags: ["lodging", "sleeping"]
    },
    {
      id: "guest-bed",
      kind: "bed",
      layerId: "upper",
      spaceId: "guest-room",
      position: { x: 7, y: 5 },
      nodeId: "guest-bed",
      tags: ["lodging", "sleep", "bed"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const tavernDefinition = compilePlace(blueprint);
