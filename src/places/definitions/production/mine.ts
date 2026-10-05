import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "mine",
  kind: "production-site",
  tags: [
    "production",
    "resource-extraction",
    "mine",
    "outdoor"
  ],
  defaultAnchorId: "loading",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 14,
    maxY: 10
  },

  layers: [
    {
      id: "site",
      kind: "outdoor",
      spatialMode: "embedded",
      tags: [
        "outdoor",
        "workplace"
      ]
    }
  ],

  spaces: [
    {
      id: "mine-yard",
      layerId: "site",
      kind: "work-yard",
      tags: [
        "outdoor",
        "workplace",
        "loading"
      ],
      geometry: {
        type: "aabb",
        minX: 0,
        minY: 0,
        maxX: 14,
        maxY: 10
      },
      defaultAnchorId: "loading"
    }
  ],

  anchors: [
    {
      id: "loading",
      kind: "loading",
      layerId: "site",
      spaceId: "mine-yard",
      position: {
        x: 7,
        y: 5
      },
      tags: [
        "loading",
        "transfer",
        "workplace"
      ]
    }
  ]
} satisfies PlaceDefinitionInput;

export const mineDefinition =
  compilePlace(blueprint);
