import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "prison",
  kind: "building",
  tags: ["building", "civic", "justice", "prison"],
  defaultAnchorId: "prison-entry",

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
      tags: ["cell-level"],
      navigation: {
        nodes: [
          { id: "front-door", x: 6, y: 0.5 },
          { id: "cell-block-south", x: 6, y: 2.5 },
          { id: "cell-block-north", x: 6, y: 7.5 },
          { id: "stairs-ground", x: 6, y: 9.25 },

          { id: "cell-a-door-block", x: 4.25, y: 2.5 },
          { id: "cell-a-door-cell", x: 3.75, y: 2.5 },
          { id: "cell-a-center", x: 2, y: 2.5 },

          { id: "cell-b-door-block", x: 7.75, y: 2.5 },
          { id: "cell-b-door-cell", x: 8.25, y: 2.5 },
          { id: "cell-b-center", x: 10, y: 2.5 },

          { id: "cell-c-door-block", x: 4.25, y: 7.5 },
          { id: "cell-c-door-cell", x: 3.75, y: 7.5 },
          { id: "cell-c-center", x: 2, y: 7.5 },

          { id: "cell-d-door-block", x: 7.75, y: 7.5 },
          { id: "cell-d-door-cell", x: 8.25, y: 7.5 },
          { id: "cell-d-center", x: 10, y: 7.5 }
        ],
        roads: [
          {
            id: "front-to-cell-block",
            from: "front-door",
            to: "cell-block-south",
            width: 1.5,
            surface: "floor"
          },
          {
            id: "cell-block-main",
            from: "cell-block-south",
            to: "cell-block-north",
            width: 2,
            surface: "floor"
          },
          {
            id: "cell-block-to-stairs",
            from: "cell-block-north",
            to: "stairs-ground",
            width: 1.5,
            surface: "floor"
          },

          {
            id: "cell-a-approach",
            from: "cell-block-south",
            to: "cell-a-door-block",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "cell-a-threshold",
            from: "cell-a-door-block",
            to: "cell-a-door-cell",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "cell-a-inside",
            from: "cell-a-door-cell",
            to: "cell-a-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "cell-b-approach",
            from: "cell-block-south",
            to: "cell-b-door-block",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "cell-b-threshold",
            from: "cell-b-door-block",
            to: "cell-b-door-cell",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "cell-b-inside",
            from: "cell-b-door-cell",
            to: "cell-b-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "cell-c-approach",
            from: "cell-block-north",
            to: "cell-c-door-block",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "cell-c-threshold",
            from: "cell-c-door-block",
            to: "cell-c-door-cell",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "cell-c-inside",
            from: "cell-c-door-cell",
            to: "cell-c-center",
            width: 1.2,
            surface: "floor"
          },

          {
            id: "cell-d-approach",
            from: "cell-block-north",
            to: "cell-d-door-block",
            width: 1.2,
            surface: "floor"
          },
          {
            id: "cell-d-threshold",
            from: "cell-d-door-block",
            to: "cell-d-door-cell",
            width: 0.9,
            surface: "floor"
          },
          {
            id: "cell-d-inside",
            from: "cell-d-door-cell",
            to: "cell-d-center",
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
          { id: "stairs-cellar", x: 6, y: 9.25 },
          { id: "torture-chamber-center", x: 6, y: 5 }
        ],
        roads: [
          {
            id: "stairs-to-torture-chamber",
            from: "stairs-cellar",
            to: "torture-chamber-center",
            width: 1.5,
            surface: "floor"
          }
        ]
      }
    }
  ],

  spaces: [
    {
      id: "cell-block",
      layerId: "ground",
      kind: "cell-block",
      tags: ["circulation", "guard-access"],
      geometry: {
        type: "aabb",
        minX: 4,
        minY: 0,
        maxX: 8,
        maxY: 10
      },
      defaultAnchorId: "cell-block-center"
    },
    {
      id: "cell-a",
      layerId: "ground",
      kind: "prison-cell",
      tags: ["detention", "cell"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 4,
        maxY: 5
      },
      defaultAnchorId: "cell-a-center"
    },
    {
      id: "cell-b",
      layerId: "ground",
      kind: "prison-cell",
      tags: ["detention", "cell"],
      geometry: {
        type: "aabb",
        minX: 8,
        minY: 0,
        maxX: 12,
        maxY: 5
      },
      defaultAnchorId: "cell-b-center"
    },
    {
      id: "cell-c",
      layerId: "ground",
      kind: "prison-cell",
      tags: ["detention", "cell"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 5,
        maxX: 4,
        maxY: 10
      },
      defaultAnchorId: "cell-c-center"
    },
    {
      id: "cell-d",
      layerId: "ground",
      kind: "prison-cell",
      tags: ["detention", "cell"],
      geometry: {
        type: "aabb",
        minX: 8,
        minY: 5,
        maxX: 12,
        maxY: 10
      },
      defaultAnchorId: "cell-d-center"
    },
    {
      id: "torture-chamber",
      layerId: "cellar",
      kind: "torture-chamber",
      tags: ["torture"],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 12,
        maxY: 10
      },
      defaultAnchorId: "torture-chamber-center"
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
        spaceId: "cell-block",
        position: { x: 6, y: 0.5 },
        nodeId: "front-door"
      },
      blocksWhenClosed: true
    },

    {
      id: "cell-a-door",
      kind: "cell-door",
      tags: ["cell", "lockable"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-block",
        position: { x: 4.25, y: 2.5 },
        nodeId: "cell-a-door-block"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-a",
        position: { x: 3.75, y: 2.5 },
        nodeId: "cell-a-door-cell"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "cell-a-threshold"
        }
      ]
    },
    {
      id: "cell-b-door",
      kind: "cell-door",
      tags: ["cell", "lockable"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-block",
        position: { x: 7.75, y: 2.5 },
        nodeId: "cell-b-door-block"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-b",
        position: { x: 8.25, y: 2.5 },
        nodeId: "cell-b-door-cell"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "cell-b-threshold"
        }
      ]
    },
    {
      id: "cell-c-door",
      kind: "cell-door",
      tags: ["cell", "lockable"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-block",
        position: { x: 4.25, y: 7.5 },
        nodeId: "cell-c-door-block"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-c",
        position: { x: 3.75, y: 7.5 },
        nodeId: "cell-c-door-cell"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "cell-c-threshold"
        }
      ]
    },
    {
      id: "cell-d-door",
      kind: "cell-door",
      tags: ["cell", "lockable"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-block",
        position: { x: 7.75, y: 7.5 },
        nodeId: "cell-d-door-block"
      },
      b: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-d",
        position: { x: 8.25, y: 7.5 },
        nodeId: "cell-d-door-cell"
      },
      blocksWhenClosed: true,
      roadBindings: [
        {
          layerId: "ground",
          roadId: "cell-d-threshold"
        }
      ]
    },

    {
      id: "stairs-to-cellar",
      kind: "stairs",
      tags: ["cellar-access"],
      a: {
        kind: "local",
        layerId: "ground",
        spaceId: "cell-block",
        position: { x: 6, y: 9.25 },
        nodeId: "stairs-ground"
      },
      b: {
        kind: "local",
        layerId: "cellar",
        spaceId: "torture-chamber",
        position: { x: 6, y: 9.25 },
        nodeId: "stairs-cellar"
      },
      transitionCost: 2
    }
  ],

  anchors: [
    {
      id: "prison-entry",
      kind: "entrance",
      layerId: "ground",
      spaceId: "cell-block",
      position: { x: 6, y: 0.5 },
      nodeId: "front-door",
      tags: ["entrance"]
    },
    {
      id: "cell-block-center",
      layerId: "ground",
      spaceId: "cell-block",
      position: { x: 6, y: 5 },
      nodeId: "cell-block-north",
      tags: ["cell-block"]
    },

    {
      id: "cell-a-center",
      layerId: "ground",
      spaceId: "cell-a",
      position: { x: 2, y: 2.5 },
      nodeId: "cell-a-center",
      tags: ["detention", "cell"]
    },
    {
      id: "cell-b-center",
      layerId: "ground",
      spaceId: "cell-b",
      position: { x: 10, y: 2.5 },
      nodeId: "cell-b-center",
      tags: ["detention", "cell"]
    },
    {
      id: "cell-c-center",
      layerId: "ground",
      spaceId: "cell-c",
      position: { x: 2, y: 7.5 },
      nodeId: "cell-c-center",
      tags: ["detention", "cell"]
    },
    {
      id: "cell-d-center",
      layerId: "ground",
      spaceId: "cell-d",
      position: { x: 10, y: 7.5 },
      nodeId: "cell-d-center",
      tags: ["detention", "cell"]
    },

    {
      id: "torture-chamber-center",
      layerId: "cellar",
      spaceId: "torture-chamber",
      position: { x: 6, y: 5 },
      nodeId: "torture-chamber-center",
      tags: ["torture"]
    }
  ]
} satisfies PlaceDefinitionInput;

export const prisonDefinition = compilePlace(blueprint);
