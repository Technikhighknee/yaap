import type {
  ResourceNodeDefinition,
  ResourceNodeId,
  ResourceNodeInstance,
  ResourceNodeInstanceInput,
  ResourceTypeDefinition,
  ResourceTypeId
} from "./types.js";

function assertNonEmptyString(
  value: string,
  label: string
): void {
  if (value.length === 0) {
    throw new TypeError(
      `${label} must not be empty`
    );
  }
}

function cloneLocation(
  input: ResourceNodeInstanceInput["location"]
): ResourceNodeInstance["location"] {
  assertNonEmptyString(
    input.domainId,
    "resource node domainId"
  );
  assertNonEmptyString(
    input.navigationNodeId,
    "resource node navigationNodeId"
  );

  if (
    !Number.isFinite(input.position.x) ||
    !Number.isFinite(input.position.y)
  ) {
    throw new TypeError(
      "resource node position must contain finite coordinates"
    );
  }

  return Object.freeze({
    domainId: input.domainId,
    navigationNodeId:
      input.navigationNodeId,
    position: Object.freeze({
      x: input.position.x,
      y: input.position.y
    })
  });
}

export class ResourceRegistry {
  readonly resourceTypes =
    new Map<
      ResourceTypeId,
      Readonly<ResourceTypeDefinition>
    >();

  readonly nodeDefinitions =
    new Map<
      string,
      Readonly<ResourceNodeDefinition>
    >();

  readonly nodes =
    new Map<
      ResourceNodeId,
      ResourceNodeInstance
    >();

  registerResourceType(
    definition: ResourceTypeDefinition
  ): Readonly<ResourceTypeDefinition> {
    assertNonEmptyString(
      definition.id,
      "resource type id"
    );

    if (
      this.resourceTypes.has(
        definition.id
      )
    ) {
      throw new Error(
        `resource type already registered: ${definition.id}`
      );
    }

    const canonical = Object.freeze({
      id: definition.id
    });

    this.resourceTypes.set(
      canonical.id,
      canonical
    );

    return canonical;
  }

  registerNodeDefinition(
    definition: ResourceNodeDefinition
  ): Readonly<ResourceNodeDefinition> {
    assertNonEmptyString(
      definition.id,
      "resource node definition id"
    );

    if (
      this.nodeDefinitions.has(
        definition.id
      )
    ) {
      throw new Error(
        `resource node definition already registered: ${definition.id}`
      );
    }

    if (
      definition.resource.kind ===
      "fixed"
    ) {
      this.requireResourceType(
        definition.resource.resourceTypeId
      );
    }

    const resource =
      definition.resource.kind ===
      "fixed"
        ? Object.freeze({
            kind: "fixed" as const,
            resourceTypeId:
              definition.resource
                .resourceTypeId
          })
        : Object.freeze({
            kind: "assignable" as const
          });

    const canonical = Object.freeze({
      id: definition.id,
      resource
    });

    this.nodeDefinitions.set(
      canonical.id,
      canonical
    );

    return canonical;
  }

  createNode(
    input: ResourceNodeInstanceInput
  ): ResourceNodeInstance {
    assertNonEmptyString(
      input.id,
      "resource node id"
    );

    if (this.nodes.has(input.id)) {
      throw new Error(
        `resource node already exists: ${input.id}`
      );
    }

    const definition =
      this.requireNodeDefinition(
        input.definitionId
      );

    let resourceTypeId:
      ResourceTypeId | null;

    if (
      definition.resource.kind ===
      "fixed"
    ) {
      if (
        input.resourceTypeId !==
          undefined &&
        input.resourceTypeId !== null &&
        input.resourceTypeId !==
          definition.resource
            .resourceTypeId
      ) {
        throw new Error(
          `resource node ${input.id} cannot override fixed resource type ${definition.resource.resourceTypeId}`
        );
      }

      resourceTypeId =
        definition.resource.resourceTypeId;
    } else {
      resourceTypeId =
        input.resourceTypeId ?? null;

      if (resourceTypeId !== null) {
        this.requireResourceType(
          resourceTypeId
        );
      }
    }

    const node: ResourceNodeInstance = {
      id: input.id,
      definitionId:
        definition.id,
      location:
        cloneLocation(input),
      resourceTypeId
    };

    this.nodes.set(node.id, node);
    return node;
  }

  removeNode(
    id: ResourceNodeId
  ): boolean {
    return this.nodes.delete(id);
  }

  getNode(
    id: ResourceNodeId
  ): ResourceNodeInstance | null {
    return this.nodes.get(id) ?? null;
  }

  getNodeDefinition(
    id: string
  ): Readonly<ResourceNodeDefinition> | null {
    return (
      this.nodeDefinitions.get(id) ??
      null
    );
  }

  setNodeResourceType(
    id: ResourceNodeId,
    resourceTypeId:
      ResourceTypeId | null
  ): ResourceNodeInstance {
    const node =
      this.requireNode(id);
    const definition =
      this.requireNodeDefinition(
        node.definitionId
      );

    if (
      definition.resource.kind ===
      "fixed"
    ) {
      throw new Error(
        `resource node ${id} has fixed resource type ${definition.resource.resourceTypeId}`
      );
    }

    if (resourceTypeId !== null) {
      this.requireResourceType(
        resourceTypeId
      );
    }

    node.resourceTypeId =
      resourceTypeId;

    return node;
  }

  nodesByResourceType(
    resourceTypeId: ResourceTypeId
  ): ResourceNodeInstance[] {
    this.requireResourceType(
      resourceTypeId
    );

    return Array.from(
      this.nodes.values()
    ).filter(
      (node) =>
        node.resourceTypeId ===
        resourceTypeId
    );
  }

  assertInternalConsistency(): {
    resourceTypeCount: number;
    nodeDefinitionCount: number;
    nodeCount: number;
  } {
    for (
      const definition
      of this.nodeDefinitions.values()
    ) {
      if (
        definition.resource.kind ===
        "fixed"
      ) {
        this.requireResourceType(
          definition.resource
            .resourceTypeId
        );
      }
    }

    for (
      const node
      of this.nodes.values()
    ) {
      const definition =
        this.requireNodeDefinition(
          node.definitionId
        );

      if (
        definition.resource.kind ===
        "fixed"
      ) {
        if (
          node.resourceTypeId !==
          definition.resource
            .resourceTypeId
        ) {
          throw new Error(
            `resource node ${node.id} violates its fixed resource definition`
          );
        }
      } else if (
        node.resourceTypeId !== null
      ) {
        this.requireResourceType(
          node.resourceTypeId
        );
      }
    }

    return {
      resourceTypeCount:
        this.resourceTypes.size,
      nodeDefinitionCount:
        this.nodeDefinitions.size,
      nodeCount:
        this.nodes.size
    };
  }

  private requireResourceType(
    id: ResourceTypeId
  ): Readonly<ResourceTypeDefinition> {
    const definition =
      this.resourceTypes.get(id);

    if (!definition) {
      throw new Error(
        `unknown resource type: ${id}`
      );
    }

    return definition;
  }

  private requireNodeDefinition(
    id: string
  ): Readonly<ResourceNodeDefinition> {
    const definition =
      this.nodeDefinitions.get(id);

    if (!definition) {
      throw new Error(
        `unknown resource node definition: ${id}`
      );
    }

    return definition;
  }

  private requireNode(
    id: ResourceNodeId
  ): ResourceNodeInstance {
    const node = this.nodes.get(id);

    if (!node) {
      throw new Error(
        `unknown resource node: ${id}`
      );
    }

    return node;
  }
}
