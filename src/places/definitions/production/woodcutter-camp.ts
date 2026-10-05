import {
  compilePlace,
  type PlaceDefinitionInput
} from "place-core";

const blueprint = {
  id: "woodcutter-camp",
  kind: "production-site",
  tags: [
    "production",
    "resource-extraction",
    "woodcutting",
    "outdoor"
  ],
  defaultAnchorId: "loading",

  footprint: {
    type: "aabb",
    minX: 0,
    minY: 0,
    maxX: 10,
    maxY: 8
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
      id: "camp-yard",
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
        maxX: 10,
        maxY: 8
      },
      defaultAnchorId: "loading"
    }
  ],

  anchors: [
    {
      id: "loading",
      kind: "loading",
      layerId: "site",
      spaceId: "camp-yard",
      position: {
        x: 5,
        y: 4
      },
      tags: [
        "loading",
        "transfer",
        "workplace"
      ]
    }
  ]
} satisfies PlaceDefinitionInput;

export const woodcutterCampDefinition =
  compilePlace(blueprint);
