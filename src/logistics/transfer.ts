import {
  inverseTransformPoint,
  pointInGeometry,
  squaredDistancePointToSegment
} from "place-core";

import type {
  Geometry,
  PlaceRegistry,
  Transform2D
} from "place-core";

import type {
  World
} from "world-core";

import type {
  InventoryBindingRegistry,
  InventoryChannel
} from "../inventory/bindings.js";

import type {
  Inventory
} from "../inventory/inventory.js";

export interface TransferEnvironment {
  readonly world: World;
  readonly inventoryBindings:
    InventoryBindingRegistry;
}

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

type ResolvedTransform =
  Required<
    Pick<
      Transform2D,
      "x" | "y" | "rotation" | "scale"
    >
  >;

interface RegisteredPlaceTransferEndpoint
  extends PlaceTransferEndpoint {
  readonly footprint: Geometry;
  readonly transform:
    ResolvedTransform;
}

function distanceToGeometry(
  point: {
    readonly x: number;
    readonly y: number;
  },
  geometry: Geometry
): number {
  if (
    pointInGeometry(
      point,
      geometry
    )
  ) {
    return 0;
  }

  if (
    geometry.type === "aabb"
  ) {
    const dx =
      Math.max(
        geometry.minX - point.x,
        0,
        point.x - geometry.maxX
      );
    const dy =
      Math.max(
        geometry.minY - point.y,
        0,
        point.y - geometry.maxY
      );

    return Math.hypot(
      dx,
      dy
    );
  }

  if (
    geometry.type === "circle"
  ) {
    return Math.max(
      0,
      Math.hypot(
        point.x -
          geometry.center.x,
        point.y -
          geometry.center.y
      ) -
        geometry.radius
    );
  }

  let minimumSquared =
    Infinity;

  for (
    let index = 0;
    index < geometry.points.length;
    index += 1
  ) {
    const a =
      geometry.points[index];
    const b =
      geometry.points[
        (index + 1) %
          geometry.points.length
      ];

    if (!a || !b) {
      throw new Error(
        "polygon transfer footprint is missing an edge endpoint"
      );
    }

    minimumSquared =
      Math.min(
        minimumSquared,
        squaredDistancePointToSegment(
          point,
          a,
          b
        )
      );
  }

  return Math.sqrt(
    minimumSquared
  );
}

export class PlaceTransferRegistry {
  private readonly endpoints =
    new Map<
      string,
      RegisteredPlaceTransferEndpoint
    >();

  constructor(
    private readonly places:
      PlaceRegistry
  ) {}

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

    const place =
      this.places.getPlace(
        endpoint.placeId
      );

    if (!place) {
      throw new Error(
        `unknown transfer place: ${endpoint.placeId}`
      );
    }

    const definition =
      this.places.getDefinition(
        place.definitionId
      );

    if (
      !definition?.footprint
    ) {
      throw new Error(
        `transfer place has no footprint: ${endpoint.placeId}`
      );
    }

    const placement =
      this.places
        .getResolvedPlacement(
          endpoint.placeId
        );

    if (!placement) {
      throw new Error(
        `transfer place has no resolved placement: ${endpoint.placeId}`
      );
    }

    if (
      placement.domainId !==
      endpoint.domainId
    ) {
      throw new Error(
        `transfer navigation domain does not match place placement: ${endpoint.placeId}`
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
        range: endpoint.range,
        footprint:
          definition.footprint,
        transform:
          placement.transform
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
    environment: TransferEnvironment,
    entityId: string,
    placeId: string
  ): boolean {
    const entity =
      environment.world
        .getEntity(entityId);
    const endpoint =
      this.endpoints.get(placeId);

    if (
      !entity ||
      !endpoint
    ) {
      return false;
    }

    if (
      entity.kind !== "transport"
    ) {
      const location =
        this.places.locateEntity(
          entity
        );

      if (
        location.semanticPlaces
          .includes(placeId)
      ) {
        return true;
      }
    }

    if (
      entity.domainId !==
        endpoint.domainId
    ) {
      return false;
    }

    const localPosition =
      inverseTransformPoint(
        entity.position,
        endpoint.transform
      );

    const localDistance =
      distanceToGeometry(
        localPosition,
        endpoint.footprint
      );

    const worldDistance =
      localDistance *
      endpoint.transform.scale;

    return (
      worldDistance <=
      endpoint.range
    );
  }

  transferEntityToPlace(
    environment: TransferEnvironment,
    entityId: string,
    entityChannel:
      InventoryChannel,
    placeId: string,
    placeChannel:
      InventoryChannel,
    itemId: string,
    amount: number
  ) {
    this.requireTransferRange(
      environment,
      entityId,
      placeId
    );

    const source =
      this.requireInventory(
        environment,
        {
          kind: "entity",
          id: entityId
        },
        entityChannel
      );

    const target =
      this.requireInventory(
        environment,
        {
          kind: "place",
          id: placeId
        },
        placeChannel
      );

    return source.transferTo(
      target,
      itemId,
      amount
    );
  }

  transferPlaceToEntity(
    environment: TransferEnvironment,
    placeId: string,
    placeChannel:
      InventoryChannel,
    entityId: string,
    entityChannel:
      InventoryChannel,
    itemId: string,
    amount: number
  ) {
    this.requireTransferRange(
      environment,
      entityId,
      placeId
    );

    const source =
      this.requireInventory(
        environment,
        {
          kind: "place",
          id: placeId
        },
        placeChannel
      );

    const target =
      this.requireInventory(
        environment,
        {
          kind: "entity",
          id: entityId
        },
        entityChannel
      );

    return source.transferTo(
      target,
      itemId,
      amount
    );
  }

  private requireTransferRange(
    environment: TransferEnvironment,
    entityId: string,
    placeId: string
  ): void {
    if (
      !this.canEntityTransfer(
        environment,
        entityId,
        placeId
      )
    ) {
      throw new Error(
        `entity is outside transfer range: ${entityId} -> ${placeId}`
      );
    }
  }

  private requireInventory(
    environment: TransferEnvironment,
    owner:
      | {
          readonly kind: "entity";
          readonly id: string;
        }
      | {
          readonly kind: "place";
          readonly id: string;
        },
    channel: InventoryChannel
  ): Inventory {
    const inventory =
      environment.inventoryBindings
        .getInventory(
          owner,
          channel
        );

    if (!inventory) {
      throw new Error(
        `missing inventory for transfer: ${owner.kind}:${owner.id}:${channel}`
      );
    }

    return inventory;
  }
}
