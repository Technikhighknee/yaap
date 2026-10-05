import type {
  InventoryChannel
} from "../inventory/bindings.js";

import type {
  Simulation
} from "../simulation.js";

export interface PlaceTransferEndpoint {
  readonly placeId: string;
  readonly domainId: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly navigationNodeId: string;
  readonly range: number;
}

function distanceSquared(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export class PlaceTransferRegistry {
  private readonly endpoints =
    new Map<
      string,
      PlaceTransferEndpoint
    >();

  register(
    endpoint: PlaceTransferEndpoint
  ): void {
    if (
      endpoint.placeId.length === 0 ||
      endpoint.domainId.length === 0 ||
      endpoint.navigationNodeId.length === 0 ||
      !Number.isFinite(
        endpoint.position.x
      ) ||
      !Number.isFinite(
        endpoint.position.y
      ) ||
      !Number.isFinite(
        endpoint.range
      ) ||
      endpoint.range < 0
    ) {
      throw new TypeError(
        "invalid place transfer endpoint"
      );
    }

    if (
      this.endpoints.has(
        endpoint.placeId
      )
    ) {
      throw new Error(
        `place transfer endpoint already registered: ${endpoint.placeId}`
      );
    }

    this.endpoints.set(
      endpoint.placeId,
      Object.freeze({
        placeId:
          endpoint.placeId,
        domainId:
          endpoint.domainId,
        position:
          Object.freeze({
            x: endpoint.position.x,
            y: endpoint.position.y
          }),
        navigationNodeId:
          endpoint.navigationNodeId,
        range: endpoint.range
      })
    );
  }

  get(
    placeId: string
  ): PlaceTransferEndpoint | null {
    return (
      this.endpoints.get(placeId) ??
      null
    );
  }

  canEntityTransfer(
    simulation: Simulation,
    entityId: string,
    placeId: string
  ): boolean {
    const entity =
      simulation.world
        .getEntity(entityId);
    const endpoint =
      this.endpoints.get(placeId);

    if (
      !entity ||
      !endpoint ||
      entity.domainId !==
        endpoint.domainId
    ) {
      return false;
    }

    return (
      distanceSquared(
        entity.position,
        endpoint.position
      ) <=
      endpoint.range *
        endpoint.range
    );
  }

  transferEntityToPlace(
    simulation: Simulation,
    entityId: string,
    entityChannel:
      InventoryChannel,
    placeId: string,
    placeChannel:
      InventoryChannel,
    itemId: string,
    amount: number
  ) {
    if (
      !this.canEntityTransfer(
        simulation,
        entityId,
        placeId
      )
    ) {
      throw new Error(
        `entity is outside transfer range: ${entityId} -> ${placeId}`
      );
    }

    const source =
      simulation.inventoryBindings
        .getInventory(
          {
            kind: "entity",
            id: entityId
          },
          entityChannel
        );
    const target =
      simulation.inventoryBindings
        .getInventory(
          {
            kind: "place",
            id: placeId
          },
          placeChannel
        );

    if (!source || !target) {
      throw new Error(
        "missing inventory for transfer"
      );
    }

    return source.transferTo(
      target,
      itemId,
      amount
    );
  }
}
