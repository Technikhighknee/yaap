import {
  mobilityProfile,
  startJourney
} from "world-core";

import type {
  NavigationRegistry,
  World
} from "world-core";

import type {
  PlaceRegistry
} from "place-core";

import type {
  Inventory
} from "../inventory/inventory.js";

import type {
  InventoryBindingRegistry
} from "../inventory/bindings.js";

import type {
  InventoryRegistry
} from "../inventory/registry.js";

import type {
  TransportDefinition,
  TransportDefinitionId,
  TransportId,
  TransportInstance,
  CreateTransportInput
} from "./types.js";

export interface TransportEnvironment {
  readonly world: World;
  readonly navigation:
    NavigationRegistry;
  readonly places: PlaceRegistry;
  readonly inventories:
    InventoryRegistry;
  readonly inventoryBindings:
    InventoryBindingRegistry;
}

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

function assertFinitePosition(
  position: {
    x: number;
    y: number;
  }
): void {
  if (
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y)
  ) {
    throw new TypeError(
      "transport position must contain finite coordinates"
    );
  }
}

export class TransportRegistry {
  readonly definitions =
    new Map<
      TransportDefinitionId,
      Readonly<TransportDefinition>
    >();

  readonly instances =
    new Map<
      TransportId,
      TransportInstance
    >();

  private readonly operatedBy =
    new Map<
      string,
      TransportId
    >();

  constructor(
    private readonly environment:
      TransportEnvironment
  ) {}

  registerDefinition(
    definition: TransportDefinition
  ): Readonly<TransportDefinition> {
    assertNonEmptyString(
      definition.id,
      "transport definition id"
    );

    if (
      this.definitions.has(
        definition.id
      )
    ) {
      throw new Error(
        `transport definition already registered: ${definition.id}`
      );
    }

    const slotCount =
      definition.cargo.slotCount;
    const slotCapacity =
      definition.cargo.slotCapacity;

    if (
      !Number.isSafeInteger(
        slotCount
      ) ||
      slotCount <= 0 ||
      !Number.isSafeInteger(
        slotCapacity
      ) ||
      slotCapacity <= 0
    ) {
      throw new TypeError(
        "transport cargo capacity must use positive safe integers"
      );
    }

    if (
      slotCount >
      Math.floor(
        Number.MAX_SAFE_INTEGER /
          slotCapacity
      )
    ) {
      throw new RangeError(
        "transport cargo total capacity must be a safe integer"
      );
    }

    const canonical =
      Object.freeze({
        id: definition.id,
        cargo: Object.freeze({
          slotCount,
          slotCapacity
        }),
        mobilityProfile:
          definition.mobilityProfile
      });

    this.definitions.set(
      canonical.id,
      canonical
    );

    return canonical;
  }

  getDefinition(
    id: TransportDefinitionId
  ): Readonly<TransportDefinition> | null {
    return (
      this.definitions.get(id) ??
      null
    );
  }

  get(
    id: TransportId
  ): TransportInstance | null {
    return (
      this.instances.get(id) ??
      null
    );
  }

  create(
    input: CreateTransportInput
  ): TransportInstance {
    assertNonEmptyString(
      input.id,
      "transport id"
    );
    assertNonEmptyString(
      input.domainId,
      "transport domainId"
    );
    assertFinitePosition(
      input.position
    );

    if (
      this.instances.has(input.id) ||
      this.environment.world
        .getEntity(input.id)
    ) {
      throw new Error(
        `transport id already exists in world: ${input.id}`
      );
    }

    const definition =
      this.requireDefinition(
        input.definitionId
      );

    if (
      !this.environment.navigation
        .navigationForDomain(
          input.domainId
        )
    ) {
      throw new Error(
        `transport domain is not navigable: ${input.domainId}`
      );
    }

    const cargoInventoryId =
      `entity:${input.id}:cargo`;

    if (
      this.environment.inventories
        .get(cargoInventoryId)
    ) {
      throw new Error(
        `transport cargo inventory already exists: ${cargoInventoryId}`
      );
    }

    const requestedOperator =
      input.operatorEntityId ??
      null;

    if (
      requestedOperator !== null
    ) {
      this.requireAvailableOperator(
        requestedOperator
      );
    }

    this.environment.world.addEntity({
      id: input.id,
      kind: "transport",
      domainId: input.domainId,
      position: {
        x: input.position.x,
        y: input.position.y
      },
      mobility:
        mobilityProfile(
          definition.mobilityProfile
        )
    });

    const cargo =
      this.environment
        .inventoryBindings
        .createBoundInventory(
          {
            kind: "entity",
            id: input.id
          },
          "cargo",
          {
            id: cargoInventoryId,
            slotCount:
              definition.cargo
                .slotCount,
            slotCapacity:
              definition.cargo
                .slotCapacity
          }
        );

    const instance:
      TransportInstance = {
        id: input.id,
        definitionId:
          definition.id,
        worldEntityId:
          input.id,
        cargoInventoryId:
          cargo.id,
        operatorEntityId: null
      };

    this.instances.set(
      instance.id,
      instance
    );

    if (
      requestedOperator !== null
    ) {
      this.assignOperator(
        instance.id,
        requestedOperator
      );
    }

    return instance;
  }

  cargo(
    id: TransportId
  ): Inventory {
    const transport =
      this.require(id);
    const inventory =
      this.environment.inventories
        .get(
          transport.cargoInventoryId
        );

    if (!inventory) {
      throw new Error(
        `transport cargo inventory missing: ${id}`
      );
    }

    return inventory;
  }

  assignOperator(
    id: TransportId,
    entityId: string
  ): TransportInstance {
    assertNonEmptyString(
      entityId,
      "transport operator entity id"
    );

    const transport =
      this.require(id);

    if (
      transport.operatorEntityId ===
      entityId
    ) {
      return transport;
    }

    this.requireAvailableOperator(
      entityId
    );

    if (
      transport.operatorEntityId !==
      null
    ) {
      this.operatedBy.delete(
        transport.operatorEntityId
      );
    }

    transport.operatorEntityId =
      entityId;
    this.operatedBy.set(
      entityId,
      transport.id
    );

    this.syncOperator(
      transport
    );

    return transport;
  }

  clearOperator(
    id: TransportId
  ): TransportInstance {
    const transport =
      this.require(id);

    if (
      transport.operatorEntityId !==
      null
    ) {
      this.operatedBy.delete(
        transport.operatorEntityId
      );
      transport.operatorEntityId =
        null;
    }

    return transport;
  }

  startJourney(
    id: TransportId,
    destinationNodeId: string
  ): boolean {
    const transport =
      this.require(id);

    if (
      transport.operatorEntityId ===
      null
    ) {
      throw new Error(
        `transport has no operator: ${id}`
      );
    }

    return startJourney(
      this.environment.world,
      this.environment.navigation,
      transport.worldEntityId,
      destinationNodeId
    );
  }

  step(): void {
    for (
      const transport
      of this.instances.values()
    ) {
      if (
        transport.operatorEntityId !==
        null
      ) {
        this.syncOperator(
          transport
        );
      }
    }
  }

  assertInternalConsistency(): {
    definitionCount: number;
    transportCount: number;
    operatedTransportCount: number;
  } {
    for (
      const transport
      of this.instances.values()
    ) {
      this.requireDefinition(
        transport.definitionId
      );

      const entity =
        this.environment.world
          .getEntity(
            transport.worldEntityId
          );

      if (
        !entity ||
        entity.kind !== "transport"
      ) {
        throw new Error(
          `transport world entity missing: ${transport.id}`
        );
      }

      const binding =
        this.environment
          .inventoryBindings
          .getBinding(
            {
              kind: "entity",
              id: transport.worldEntityId
            },
            "cargo"
          );

      if (
        !binding ||
        binding.inventoryId !==
          transport.cargoInventoryId
      ) {
        throw new Error(
          `transport cargo binding mismatch: ${transport.id}`
        );
      }

      this.cargo(transport.id)
        .assertInternalConsistency();

      if (
        transport.operatorEntityId !==
        null
      ) {
        if (
          this.operatedBy.get(
            transport.operatorEntityId
          ) !== transport.id
        ) {
          throw new Error(
            `transport operator reverse index mismatch: ${transport.id}`
          );
        }

        this.requireOperatorEntity(
          transport.operatorEntityId
        );
      }
    }

    if (
      this.operatedBy.size >
      this.instances.size
    ) {
      throw new Error(
        "transport operator index size mismatch"
      );
    }

    return {
      definitionCount:
        this.definitions.size,
      transportCount:
        this.instances.size,
      operatedTransportCount:
        this.operatedBy.size
    };
  }

  private require(
    id: TransportId
  ): TransportInstance {
    const transport =
      this.instances.get(id);

    if (!transport) {
      throw new Error(
        `unknown transport: ${id}`
      );
    }

    return transport;
  }

  private requireDefinition(
    id: TransportDefinitionId
  ): Readonly<TransportDefinition> {
    const definition =
      this.definitions.get(id);

    if (!definition) {
      throw new Error(
        `unknown transport definition: ${id}`
      );
    }

    return definition;
  }

  private requireOperatorEntity(
    entityId: string
  ) {
    const entity =
      this.environment.world
        .getEntity(entityId);

    if (!entity) {
      throw new Error(
        `unknown transport operator entity: ${entityId}`
      );
    }

    if (
      entity.kind === "transport"
    ) {
      throw new Error(
        "a transport cannot operate another transport"
      );
    }

    if (entity.journey) {
      throw new Error(
        `transport operator is already travelling: ${entityId}`
      );
    }

    return entity;
  }

  private requireAvailableOperator(
    entityId: string
  ) {
    const entity =
      this.requireOperatorEntity(
        entityId
      );

    const existing =
      this.operatedBy.get(
        entityId
      );

    if (existing) {
      throw new Error(
        `entity already operates transport: ${existing}`
      );
    }

    return entity;
  }

  private syncOperator(
    transport: TransportInstance
  ): void {
    const operatorId =
      transport.operatorEntityId;

    if (operatorId === null) {
      return;
    }

    const transportEntity =
      this.environment.world
        .getEntity(
          transport.worldEntityId
        );

    if (!transportEntity) {
      throw new Error(
        `transport world entity missing: ${transport.id}`
      );
    }

    const operator =
      this.requireOperatorEntity(
        operatorId
      );

    const domainId =
      transportEntity.domainId ??
      "default";

    if (
      operator.domainId !==
        domainId ||
      operator.position.x !==
        transportEntity.position.x ||
      operator.position.y !==
        transportEntity.position.y
    ) {
      this.environment.world
        .transferEntity(
          operatorId,
          {
            domainId,
            position:
              transportEntity.position
          }
        );
    }

    this.environment.places
      .updateEntityOccupancy(
        operator
      );
  }
}
