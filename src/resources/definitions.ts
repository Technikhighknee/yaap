import type {
  ResourceNodeDefinition,
  ResourceTypeDefinition
} from "./types.js";

import {
  ResourceRegistry
} from "./registry.js";

export const RESOURCE_TYPES = [
  { id: "iron" },
  { id: "silver" },
  { id: "gold" },
  { id: "gemstone" },
  { id: "pinewood" },
  { id: "oakwood" },
  { id: "water" },
  { id: "wheat" },
  { id: "hops" },
  { id: "cattle" },
  { id: "sheep" }
] as const satisfies
  readonly ResourceTypeDefinition[];

export const RESOURCE_NODE_DEFINITIONS = [
  {
    id: "iron-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "iron"
    }
  },
  {
    id: "silver-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "silver"
    }
  },
  {
    id: "gold-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "gold"
    }
  },
  {
    id: "gemstone-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "gemstone"
    }
  },
  {
    id: "pinewood-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "pinewood"
    }
  },
  {
    id: "oakwood-node",
    resource: {
      kind: "fixed",
      resourceTypeId: "oakwood"
    }
  },
  {
    id: "well",
    resource: {
      kind: "fixed",
      resourceTypeId: "water"
    }
  },
  {
    id: "field",
    resource: {
      kind: "assignable"
    }
  },
  {
    id: "pasture",
    resource: {
      kind: "assignable"
    }
  }
] as const satisfies
  readonly ResourceNodeDefinition[];

export function registerResourceDefinitions(
  registry: ResourceRegistry
): void {
  for (
    const definition
    of RESOURCE_TYPES
  ) {
    registry.registerResourceType(
      definition
    );
  }

  for (
    const definition
    of RESOURCE_NODE_DEFINITIONS
  ) {
    registry.registerNodeDefinition(
      definition
    );
  }
}
