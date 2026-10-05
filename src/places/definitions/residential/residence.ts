import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "residence",
  kind: "building",
  tags: ["building", "residential", "residence"],
  defaultAnchorId: "home-entry",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 10,
    maxY: 10
  },

  layers: [
    {
      spatialMode: "owned",
      id: "ground",
      kind: "floor",
      navigation: {
        nodes: [
          { id: "front-door", x: 3.5, y: 0.5 },
          { id: "living-center", x: 3.5, y: 3 },

          { id: "bedroom-door-living", x: 2, y: 5.75 },
          { id: "bedroom-door-bedroom", x: 2, y: 6.25 },
          { id: "bedroom-center", x: 2, y: 8 },

          { id: "study-door-living", x: 5.5, y: 5.75 },
          { id: "study-door-study", x: 5.5, y: 6.25 },
          { id: "study-center", x: 5.5, y: 8 },

          { id: "salon-door-living", x: 6.75, y: 3 },
          { id: "salon-door-salon", x: 7.25, y: 3 },
          { id: "salon-center", x: 8.5, y: 2.5 },

          { id: "backroom-door-living", x: 6.75, y: 5.5 },
          { id: "backroom-door-backroom", x: 7.25, y: 5.5 },
          { id: "backroom-center", x: 8.5, y: 7.5 }
        ],
        roads: [
          {
            id: "front-to-living",
            from: "front-door",
            to: "living-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "living-to-bedroom-door",
            from: "living-center",
            to: "bedroom-door-living",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "bedroom-threshold",
            from: "bedroom-door-living",
            to: "bedroom-door-bedroom",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "bedroom-inside",
            from: "bedroom-door-bedroom",
            to: "bedroom-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "living-to-study-door",
            from: "living-center",
            to: "study-door-living",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "study-threshold",
            from: "study-door-living",
            to: "study-door-study",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "study-inside",
            from: "study-door-study",
            to: "study-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "living-to-salon-door",
            from: "living-center",
            to: "salon-door-living",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "salon-threshold",
            from: "salon-door-living",
            to: "salon-door-salon",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "salon-inside",
            from: "salon-door-salon",
            to: "salon-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "living-to-backroom-door",
            from: "living-center",
            to: "backroom-door-living",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "backroom-threshold",
            from: "backroom-door-living",
            to: "backroom-door-backroom",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "backroom-inside",
            from: "backroom-door-backroom",
            to: "backroom-center",
            width: 1.2,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "living-room",
      layerId: "ground",
      kind: "room",
      tags: ["living"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 7,
        maxY: 6
      },
      defaultAnchorId: "living-room-center"
    },
    {
      id: "bedroom",
      layerId: "ground",
      kind: "room",
      tags: ["sleeping"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 6,
        maxX: 4,
        maxY: 10
      },
      defaultAnchorId: "bed"
    },
    {
      id: "study",
      layerId: "ground",
      kind: "room",
      tags: ["study", "private"],
      geometry: {
        type: "aabb",
        minX: 4,
        minY: 6,
        maxX: 7,
        maxY: 10
      },
      defaultAnchorId: "study-desk",
      enabled: false
    },
    {
      id: "salon",
      layerId: "ground",
      kind: "room",
      tags: ["social", "representative"],
      geometry: {
        type: "aabb",
        minX: 7,
        minY: 0,
        maxX: 10,
        maxY: 5
      },
      defaultAnchorId: "salon-center",
      enabled: false
    },
    {
      id: "backroom",
      layerId: "ground",
      kind: "room",
      tags: ["private"],
      geometry: {
        type: "aabb",
        minX: 7,
        minY: 5,
        maxX: 10,
        maxY: 10
      },
      defaultAnchorId: "backroom-center",
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
        spaceId: "living-room",
        position: { x: 3.5, y: 0.5 },
        nodeId: "front-door"
      },
      blocksWhenClosed: true
    },
    {
      id: "bedroom-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "living-room",
        position: { x: 2, y: 5.75 },
        nodeId: "bedroom-door-living"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "bedroom",
        position: { x: 2, y: 6.25 },
        nodeId: "bedroom-door-bedroom"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "bedroom-threshold"
        }
      ]
    },
    {
      id: "study-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "living-room",
        position: { x: 5.5, y: 5.75 },
        nodeId: "study-door-living"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "study",
        position: { x: 5.5, y: 6.25 },
        nodeId: "study-door-study"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "study-threshold"
        }
      ]
    },
    {
      id: "salon-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "living-room",
        position: { x: 6.75, y: 3 },
        nodeId: "salon-door-living"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "salon",
        position: { x: 7.25, y: 3 },
        nodeId: "salon-door-salon"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "salon-threshold"
        }
      ]
    },
    {
      id: "backroom-door",
      kind: "door",
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "living-room",
        position: { x: 6.75, y: 5.5 },
        nodeId: "backroom-door-living"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "backroom",
        position: { x: 7.25, y: 5.5 },
        nodeId: "backroom-door-backroom"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "backroom-threshold"
        }
      ]
    }
  ],

  anchors: [
    {
      id: "home-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "living-room",
      position: { x: 3.5, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance", "home-entry"]
    },
    {
      id: "living-room-center",
      layerId: "ground",
      spaceId: "living-room",
      position: { x: 3.5, y: 3 },
      nodeId: "living-center",
      tags: ["living"]
    },
    {
      id: "bed",
      kind: "bed",
      layerId: "ground",
      spaceId: "bedroom",
      position: { x: 2, y: 8 },
      nodeId: "bedroom-center",
      tags: ["sleep", "bed"]
    },
    {
      id: "study-desk",
      kind: "desk",
      layerId: "ground",
      spaceId: "study",
      position: { x: 5.5, y: 8 },
      nodeId: "study-center",
      tags: ["study", "workstation"]
    },
    {
      id: "salon-center",
      layerId: "ground",
      spaceId: "salon",
      position: { x: 8.5, y: 2.5 },
      nodeId: "salon-center",
      tags: ["social", "representative"]
    },
    {
      id: "backroom-center",
      layerId: "ground",
      spaceId: "backroom",
      position: { x: 8.5, y: 7.5 },
      nodeId: "backroom-center",
      tags: ["private"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const residenceDefinition = compilePlace(blueprint);
