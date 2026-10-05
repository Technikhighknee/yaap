export type ResourceTypeId = string;
export type ResourceNodeDefinitionId = string;
export type ResourceNodeId = string;

export interface ResourceTypeDefinition {
  readonly id: ResourceTypeId;
}

export type ResourceNodeResource =
  | {
      readonly kind: "fixed";
      readonly resourceTypeId:
        ResourceTypeId;
    }
  | {
      readonly kind: "assignable";
    };

export interface ResourceNodeDefinition {
  readonly id: ResourceNodeDefinitionId;
  readonly resource: ResourceNodeResource;
}

export interface ResourceNodeLocation {
  readonly domainId: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly navigationNodeId: string;
}

export interface ResourceNodeInstanceInput {
  readonly id: ResourceNodeId;
  readonly definitionId:
    ResourceNodeDefinitionId;
  readonly location: ResourceNodeLocation;
  readonly resourceTypeId?:
    ResourceTypeId | null;
}

export interface ResourceNodeInstance {
  readonly id: ResourceNodeId;
  readonly definitionId:
    ResourceNodeDefinitionId;
  readonly location: ResourceNodeLocation;
  resourceTypeId: ResourceTypeId | null;
}
