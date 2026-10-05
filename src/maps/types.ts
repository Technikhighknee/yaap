import type {
  CreatePlaceInput
} from "place-core";

import type {
  ResourceNodeInstanceInput
} from "../resources/types.js";

export interface MapNavigationNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly junctionRadius?: number;
  readonly regionId?: string | null;
}

export interface MapRoad {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly width?: number;
  readonly surface?: string;
  readonly bidirectional?: boolean;
  readonly enabled?: boolean;
  readonly allowedProfiles?:
    readonly string[] | null;
  readonly blockedProfiles?:
    readonly string[];
  readonly tags?: readonly string[];
}

export interface MapNavigationTopology {
  readonly id: string;
  readonly nodes:
    readonly MapNavigationNode[];
  readonly roads:
    readonly MapRoad[];
}

export interface MapDomainBinding {
  readonly domainId: string;
  readonly topologyId: string;
}

export interface MapDefinition {
  readonly id: string;
  readonly navigation: {
    readonly topologies:
      readonly MapNavigationTopology[];
    readonly domains:
      readonly MapDomainBinding[];
  };
  readonly places:
    readonly CreatePlaceInput[];
  readonly resourceNodes:
    readonly ResourceNodeInstanceInput[];
}
