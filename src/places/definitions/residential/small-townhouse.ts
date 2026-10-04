import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "small-townhouse",
  kind: "building",
  tags: ["building", "residential", "house", "townhouse", "small"],
  defaultAnchorId: "home-entry",
  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 8,
    maxY: 12
  },

  layers: [
    {
      id: "ground",
      kind: "floor",
      tags: ["ground-floor"],
      navigation: {
        nodes: [
          { id: "g-front", x: 4, y: 0.75 },
          { id: "g-hall-front", x: 4, y: 3.5 },
          { id: "g-hall-rear", x: 4, y: 9.5 },

          { id: "g-living-door-hall", x: 3.25, y: 3.5 },
          { id: "g-living-door-room", x: 2.75, y: 3.5 },
          { id: "g-living-center", x: 1.5, y: 3.5 },

          { id: "g-kitchen-door-hall", x: 4.75, y: 3.5 },
          { id: "g-kitchen-door-room", x: 5.25, y: 3.5 },
          { id: "g-kitchen-center", x: 6.5, y: 3.5 },

          { id: "g-pantry-door-hall", x: 3.25, y: 9.5 },
          { id: "g-pantry-door-room", x: 2.75, y: 9.5 },
          { id: "g-pantry-center", x: 1.5, y: 9.5 },

          { id: "g-stair-door-hall", x: 4.75, y: 9.5 },
          { id: "g-stair-door-room", x: 5.25, y: 9.5 },
          { id: "g-stairs-up", x: 6.25, y: 8.5 },
          { id: "g-stairs-down", x: 6.75, y: 10.5 }
        ],
        roads: [
          { id: "g-front-hall", from: "g-front", to: "g-hall-front", width: 1.2, surface: "floor" },
          { id: "g-hall-main", from: "g-hall-front", to: "g-hall-rear", width: 1.2, surface: "floor" },

          { id: "g-hall-living-approach", from: "g-hall-front", to: "g-living-door-hall", width: 1, surface: "floor" },
          { id: "g-door-living", from: "g-living-door-hall", to: "g-living-door-room", width: 0.9, surface: "floor" },
          { id: "g-living-inside", from: "g-living-door-room", to: "g-living-center", width: 1.2, surface: "floor" },

          { id: "g-hall-kitchen-approach", from: "g-hall-front", to: "g-kitchen-door-hall", width: 1, surface: "floor" },
          { id: "g-door-kitchen", from: "g-kitchen-door-hall", to: "g-kitchen-door-room", width: 0.9, surface: "floor" },
          { id: "g-kitchen-inside", from: "g-kitchen-door-room", to: "g-kitchen-center", width: 1.2, surface: "floor" },

          { id: "g-hall-pantry-approach", from: "g-hall-rear", to: "g-pantry-door-hall", width: 1, surface: "floor" },
          { id: "g-door-pantry", from: "g-pantry-door-hall", to: "g-pantry-door-room", width: 0.9, surface: "floor" },
          { id: "g-pantry-inside", from: "g-pantry-door-room", to: "g-pantry-center", width: 1.2, surface: "floor" },

          { id: "g-hall-stair-approach", from: "g-hall-rear", to: "g-stair-door-hall", width: 1, surface: "floor" },
          { id: "g-door-stairwell", from: "g-stair-door-hall", to: "g-stair-door-room", width: 0.9, surface: "floor" },
          { id: "g-stair-up-approach", from: "g-stair-door-room", to: "g-stairs-up", width: 1.2, surface: "floor" },
          { id: "g-stair-down-approach", from: "g-stair-door-room", to: "g-stairs-down", width: 1.2, surface: "floor" }
        ]
      }
    },
    {
      id: "upper",
      kind: "floor",
      tags: ["upper-floor"],
      navigation: {
        nodes: [
          { id: "u-landing-front", x: 4, y: 3 },
          { id: "u-landing-rear", x: 4, y: 9 },

          { id: "u-front-bedroom-door-landing", x: 3.25, y: 3 },
          { id: "u-front-bedroom-door-room", x: 2.75, y: 3 },
          { id: "u-front-bedroom-center", x: 1.5, y: 3 },

          { id: "u-middle-bedroom-door-landing", x: 4.75, y: 3 },
          { id: "u-middle-bedroom-door-room", x: 5.25, y: 3 },
          { id: "u-middle-bedroom-center", x: 6.5, y: 3 },

          { id: "u-rear-bedroom-door-landing", x: 3.25, y: 9 },
          { id: "u-rear-bedroom-door-room", x: 2.75, y: 9 },
          { id: "u-rear-bedroom-center", x: 1.5, y: 9 },

          { id: "u-stair-door-landing", x: 4.75, y: 9 },
          { id: "u-stair-door-room", x: 5.25, y: 9 },
          { id: "u-stairs", x: 6.5, y: 8.5 }
        ],
        roads: [
          { id: "u-landing-main", from: "u-landing-front", to: "u-landing-rear", width: 1.2, surface: "floor" },

          { id: "u-front-bedroom-approach", from: "u-landing-front", to: "u-front-bedroom-door-landing", width: 1, surface: "floor" },
          { id: "u-door-front-bedroom", from: "u-front-bedroom-door-landing", to: "u-front-bedroom-door-room", width: 0.9, surface: "floor" },
          { id: "u-front-bedroom-inside", from: "u-front-bedroom-door-room", to: "u-front-bedroom-center", width: 1.2, surface: "floor" },

          { id: "u-middle-bedroom-approach", from: "u-landing-front", to: "u-middle-bedroom-door-landing", width: 1, surface: "floor" },
          { id: "u-door-middle-bedroom", from: "u-middle-bedroom-door-landing", to: "u-middle-bedroom-door-room", width: 0.9, surface: "floor" },
          { id: "u-middle-bedroom-inside", from: "u-middle-bedroom-door-room", to: "u-middle-bedroom-center", width: 1.2, surface: "floor" },

          { id: "u-rear-bedroom-approach", from: "u-landing-rear", to: "u-rear-bedroom-door-landing", width: 1, surface: "floor" },
          { id: "u-door-rear-bedroom", from: "u-rear-bedroom-door-landing", to: "u-rear-bedroom-door-room", width: 0.9, surface: "floor" },
          { id: "u-rear-bedroom-inside", from: "u-rear-bedroom-door-room", to: "u-rear-bedroom-center", width: 1.2, surface: "floor" },

          { id: "u-stair-approach", from: "u-landing-rear", to: "u-stair-door-landing", width: 1, surface: "floor" },
          { id: "u-door-stairwell", from: "u-stair-door-landing", to: "u-stair-door-room", width: 0.9, surface: "floor" },
          { id: "u-stair-inside", from: "u-stair-door-room", to: "u-stairs", width: 1.2, surface: "floor" }
        ]
      }
    },
    {
      id: "cellar",
      kind: "floor",
      tags: ["cellar"],
      navigation: {
        nodes: [
          { id: "c-stairs", x: 6.5, y: 9 },
          { id: "c-storage", x: 4, y: 4 }
        ],
        roads: [
          { id: "c-main", from: "c-stairs", to: "c-storage", width: 1.2, surface: "floor" }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "ground-floor",
      layerId: "ground",
      kind: "floor",
      geometry: { type: "aabb", minX: 0, minY: 0, maxX: 8, maxY: 12 },
      defaultAnchorId: "home-entry"
    },
    {
      id: "entrance-hall",
      layerId: "ground",
      kind: "hall",
      parentSpaceId: "ground-floor",
      geometry: { type: "aabb", minX: 3, minY: 0, maxX: 5, maxY: 12 },
      defaultAnchorId: "home-entry"
    },
    {
      id: "living-room",
      layerId: "ground",
      kind: "room",
      tags: ["living"],
      parentSpaceId: "ground-floor",
      geometry: { type: "aabb", minX: 0, minY: 0, maxX: 3, maxY: 7 },
      defaultAnchorId: "living-center"
    },
    {
      id: "kitchen",
      layerId: "ground",
      kind: "room",
      tags: ["kitchen"],
      parentSpaceId: "ground-floor",
      geometry: { type: "aabb", minX: 5, minY: 0, maxX: 8, maxY: 7 },
      defaultAnchorId: "hearth"
    },
    {
      id: "pantry",
      layerId: "ground",
      kind: "storage",
      tags: ["food-storage"],
      parentSpaceId: "ground-floor",
      geometry: { type: "aabb", minX: 0, minY: 7, maxX: 3, maxY: 12 },
      defaultAnchorId: "pantry-storage"
    },
    {
      id: "ground-stairwell",
      layerId: "ground",
      kind: "stairwell",
      parentSpaceId: "ground-floor",
      geometry: { type: "aabb", minX: 5, minY: 7, maxX: 8, maxY: 12 }
    },

    {
      id: "upper-floor",
      layerId: "upper",
      kind: "floor",
      geometry: { type: "aabb", minX: 0, minY: 0, maxX: 8, maxY: 12 },
      defaultAnchorId: "upper-landing"
    },
    {
      id: "upper-landing",
      layerId: "upper",
      kind: "hall",
      parentSpaceId: "upper-floor",
      geometry: { type: "aabb", minX: 3, minY: 0, maxX: 5, maxY: 12 },
      defaultAnchorId: "upper-landing"
    },
    {
      id: "bedroom-front",
      layerId: "upper",
      kind: "bedroom",
      tags: ["sleep"],
      parentSpaceId: "upper-floor",
      geometry: { type: "aabb", minX: 0, minY: 0, maxX: 3, maxY: 6 },
      defaultAnchorId: "bed-front"
    },
    {
      id: "bedroom-middle",
      layerId: "upper",
      kind: "bedroom",
      tags: ["sleep"],
      parentSpaceId: "upper-floor",
      geometry: { type: "aabb", minX: 5, minY: 0, maxX: 8, maxY: 6 },
      defaultAnchorId: "bed-middle"
    },
    {
      id: "bedroom-rear",
      layerId: "upper",
      kind: "bedroom",
      tags: ["sleep"],
      parentSpaceId: "upper-floor",
      geometry: { type: "aabb", minX: 0, minY: 6, maxX: 3, maxY: 12 },
      defaultAnchorId: "bed-rear"
    },
    {
      id: "upper-stairwell",
      layerId: "upper",
      kind: "stairwell",
      parentSpaceId: "upper-floor",
      geometry: { type: "aabb", minX: 5, minY: 6, maxX: 8, maxY: 12 }
    },

    {
      id: "cellar",
      layerId: "cellar",
      kind: "cellar",
      tags: ["storage"],
      geometry: { type: "aabb", minX: 0, minY: 0, maxX: 8, maxY: 12 },
      defaultAnchorId: "cellar-storage"
    }
  ],

  boundaries: [
    { id: "g-wall-front-left", layerId: "ground", a: { x: 0, y: 0 }, b: { x: 3.5, y: 0 } },
    { id: "g-wall-front-right", layerId: "ground", a: { x: 4.5, y: 0 }, b: { x: 8, y: 0 } },
    { id: "g-wall-left", layerId: "ground", a: { x: 0, y: 0 }, b: { x: 0, y: 12 } },
    { id: "g-wall-right", layerId: "ground", a: { x: 8, y: 0 }, b: { x: 8, y: 12 } },
    { id: "g-wall-rear", layerId: "ground", a: { x: 0, y: 12 }, b: { x: 8, y: 12 } },

    { id: "g-partition-left-front", layerId: "ground", a: { x: 3, y: 0 }, b: { x: 3, y: 3 } },
    { id: "g-partition-left-middle", layerId: "ground", a: { x: 3, y: 4 }, b: { x: 3, y: 9 } },
    { id: "g-partition-left-rear", layerId: "ground", a: { x: 3, y: 10 }, b: { x: 3, y: 12 } },
    { id: "g-partition-right-front", layerId: "ground", a: { x: 5, y: 0 }, b: { x: 5, y: 3 } },
    { id: "g-partition-right-middle", layerId: "ground", a: { x: 5, y: 4 }, b: { x: 5, y: 9 } },
    { id: "g-partition-right-rear", layerId: "ground", a: { x: 5, y: 10 }, b: { x: 5, y: 12 } },
    { id: "g-partition-left-cross", layerId: "ground", a: { x: 0, y: 7 }, b: { x: 3, y: 7 } },
    { id: "g-partition-right-cross", layerId: "ground", a: { x: 5, y: 7 }, b: { x: 8, y: 7 } },

    { id: "u-wall-front", layerId: "upper", a: { x: 0, y: 0 }, b: { x: 8, y: 0 } },
    { id: "u-wall-left", layerId: "upper", a: { x: 0, y: 0 }, b: { x: 0, y: 12 } },
    { id: "u-wall-right", layerId: "upper", a: { x: 8, y: 0 }, b: { x: 8, y: 12 } },
    { id: "u-wall-rear", layerId: "upper", a: { x: 0, y: 12 }, b: { x: 8, y: 12 } },
    { id: "u-partition-left-front", layerId: "upper", a: { x: 3, y: 0 }, b: { x: 3, y: 2.5 } },
    { id: "u-partition-left-middle", layerId: "upper", a: { x: 3, y: 3.5 }, b: { x: 3, y: 8.5 } },
    { id: "u-partition-left-rear", layerId: "upper", a: { x: 3, y: 9.5 }, b: { x: 3, y: 12 } },
    { id: "u-partition-right-front", layerId: "upper", a: { x: 5, y: 0 }, b: { x: 5, y: 2.5 } },
    { id: "u-partition-right-middle", layerId: "upper", a: { x: 5, y: 3.5 }, b: { x: 5, y: 8.5 } },
    { id: "u-partition-right-rear", layerId: "upper", a: { x: 5, y: 9.5 }, b: { x: 5, y: 12 } },
    { id: "u-partition-left-cross", layerId: "upper", a: { x: 0, y: 6 }, b: { x: 3, y: 6 } },
    { id: "u-partition-right-cross", layerId: "upper", a: { x: 5, y: 6 }, b: { x: 8, y: 6 } },

    { id: "c-wall-front", layerId: "cellar", a: { x: 0, y: 0 }, b: { x: 8, y: 0 } },
    { id: "c-wall-left", layerId: "cellar", a: { x: 0, y: 0 }, b: { x: 0, y: 12 } },
    { id: "c-wall-right", layerId: "cellar", a: { x: 8, y: 0 }, b: { x: 8, y: 12 } },
    { id: "c-wall-rear", layerId: "cellar", a: { x: 0, y: 12 }, b: { x: 8, y: 12 } }
  ],

  portals: [
    {
      id: "front-door",
      kind: "door",
      tags: ["entrance"],
      a: { kind: "external", slot: "street" },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 4, y: 0.75 },
        nodeId: "g-front"
      },
      blocksWhenClosed: true
    },

    {
      id: "living-room-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 3.25, y: 3.5 },
        nodeId: "g-living-door-hall"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "living-room",
        position: { x: 2.75, y: 3.5 },
        nodeId: "g-living-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "ground", roadId: "g-door-living" }]
    },
    {
      id: "kitchen-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 4.75, y: 3.5 },
        nodeId: "g-kitchen-door-hall"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "kitchen",
        position: { x: 5.25, y: 3.5 },
        nodeId: "g-kitchen-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "ground", roadId: "g-door-kitchen" }]
    },
    {
      id: "pantry-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 3.25, y: 9.5 },
        nodeId: "g-pantry-door-hall"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "pantry",
        position: { x: 2.75, y: 9.5 },
        nodeId: "g-pantry-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "ground", roadId: "g-door-pantry" }]
    },
    {
      id: "ground-stairwell-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "entrance-hall",
        position: { x: 4.75, y: 9.5 },
        nodeId: "g-stair-door-hall"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "ground-stairwell",
        position: { x: 5.25, y: 9.5 },
        nodeId: "g-stair-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "ground", roadId: "g-door-stairwell" }]
    },

    {
      id: "upper-front-bedroom-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-landing",
        position: { x: 3.25, y: 3 },
        nodeId: "u-front-bedroom-door-landing"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "bedroom-front",
        position: { x: 2.75, y: 3 },
        nodeId: "u-front-bedroom-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "upper", roadId: "u-door-front-bedroom" }]
    },
    {
      id: "upper-middle-bedroom-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-landing",
        position: { x: 4.75, y: 3 },
        nodeId: "u-middle-bedroom-door-landing"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "bedroom-middle",
        position: { x: 5.25, y: 3 },
        nodeId: "u-middle-bedroom-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "upper", roadId: "u-door-middle-bedroom" }]
    },
    {
      id: "upper-rear-bedroom-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-landing",
        position: { x: 3.25, y: 9 },
        nodeId: "u-rear-bedroom-door-landing"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "bedroom-rear",
        position: { x: 2.75, y: 9 },
        nodeId: "u-rear-bedroom-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "upper", roadId: "u-door-rear-bedroom" }]
    },
    {
      id: "upper-stairwell-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-landing",
        position: { x: 4.75, y: 9 },
        nodeId: "u-stair-door-landing"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-stairwell",
        position: { x: 5.25, y: 9 },
        nodeId: "u-stair-door-room"
      },
      blocksWhenClosed: true,
      roadBindings: [{ layerId: "upper", roadId: "u-door-stairwell" }]
    },

    {
      id: "stairs-to-upper",
      kind: "stairs",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "ground-stairwell",
        position: { x: 6.25, y: 8.5 },
        nodeId: "g-stairs-up"
      },
      b: {
        kind: "local",
        layerId: "upper",
        spaceId: "upper-stairwell",
        position: { x: 6.5, y: 8.5 },
        nodeId: "u-stairs"
      },
      transitionCost: 2
    },
    {
      id: "stairs-to-cellar",
      kind: "stairs",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "ground-stairwell",
        position: { x: 6.75, y: 10.5 },
        nodeId: "g-stairs-down"
      },
      b: {
        kind: "local",
        layerId: "cellar",
        spaceId: "cellar",
        position: { x: 6.5, y: 9 },
        nodeId: "c-stairs"
      },
      transitionCost: 2
    }
  ],

  anchors: [
    {
      id: "home-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "entrance-hall",
      position: { x: 4, y: 0.75 },
      nodeId: "g-front",
      tags: ["entrance", "home-entry"]
    },
    {
      id: "living-center",
      layerId: "ground",
      spaceId: "living-room",
      position: { x: 1.5, y: 3.5 },
      nodeId: "g-living-center",
      tags: ["living"]
    },
    {
      id: "hearth",
      kind: "hearth",
      layerId: "ground",
      spaceId: "kitchen",
      position: { x: 6.5, y: 3.5 },
      nodeId: "g-kitchen-center",
      tags: ["cooking", "hearth"]
    },
    {
      id: "pantry-storage",
      kind: "storage",
      layerId: "ground",
      spaceId: "pantry",
      position: { x: 1.5, y: 9.5 },
      nodeId: "g-pantry-center",
      tags: ["storage", "food-storage"]
    },
    {
      id: "upper-landing",
      layerId: "upper",
      spaceId: "upper-landing",
      position: { x: 4, y: 9 },
      nodeId: "u-landing-rear",
      tags: ["circulation"]
    },
    {
      id: "bed-front",
      kind: "bed",
      layerId: "upper",
      spaceId: "bedroom-front",
      position: { x: 1.5, y: 3 },
      nodeId: "u-front-bedroom-center",
      tags: ["sleep", "bed"]
    },
    {
      id: "bed-middle",
      kind: "bed",
      layerId: "upper",
      spaceId: "bedroom-middle",
      position: { x: 6.5, y: 3 },
      nodeId: "u-middle-bedroom-center",
      tags: ["sleep", "bed"]
    },
    {
      id: "bed-rear",
      kind: "bed",
      layerId: "upper",
      spaceId: "bedroom-rear",
      position: { x: 1.5, y: 9 },
      nodeId: "u-rear-bedroom-center",
      tags: ["sleep", "bed"]
    },
    {
      id: "cellar-storage",
      kind: "storage",
      layerId: "cellar",
      spaceId: "cellar",
      position: { x: 4, y: 4 },
      nodeId: "c-storage",
      tags: ["storage", "cellar"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const smallTownhouseDefinition = compilePlace(blueprint);
