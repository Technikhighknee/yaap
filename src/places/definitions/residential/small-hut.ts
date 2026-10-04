import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "small-hut",
  kind: "building",
  tags: ["building", "residential", "hut", "small"],
  defaultAnchorId: "home-entry",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 6,
    maxY: 8
  },

  layers: [
    {
      id: "ground",
      kind: "floor",
      navigation: {
        nodes: [
          { id: "front-door", x: 3, y: 0.5 },
          { id: "living-center", x: 3, y: 2.5 },
          { id: "bedroom-door-living", x: 3, y: 4.75 },
          { id: "bedroom-door-bedroom", x: 3, y: 5.25 },
          { id: "bedroom-center", x: 3, y: 6.5 }
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
        maxX: 6,
        maxY: 5
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
        minY: 5,
        maxX: 6,
        maxY: 8
      },
      defaultAnchorId: "bed"
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
        position: { x: 3, y: 0.5 },
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
        position: { x: 3, y: 4.75 },
        nodeId: "bedroom-door-living"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "bedroom",
        position: { x: 3, y: 5.25 },
        nodeId: "bedroom-door-bedroom"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "bedroom-threshold"
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
      position: { x: 3, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance", "home-entry"]
    },
    {
      id: "living-room-center",
      layerId: "ground",
      spaceId: "living-room",
      position: { x: 3, y: 2.5 },
      nodeId: "living-center",
      tags: ["living"]
    },
    {
      id: "bed",
      kind: "bed",
      layerId: "ground",
      spaceId: "bedroom",
      position: { x: 3, y: 6.5 },
      nodeId: "bedroom-center",
      tags: ["sleep", "bed"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const smallHutDefinition = compilePlace(blueprint);
