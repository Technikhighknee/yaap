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

export type PlaceTransferEndpointSource =
  | {
      readonly kind: "anchor";
      readonly anchorId: string;
    }
  | {
      readonly kind: "attachment";
      readonly slot: string;
    };

export interface PlaceTransferEndpointRegistration {
  readonly placeId: string;
  readonly source:
    PlaceTransferEndpointSource;
  readonly range: number;
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
  extends PlaceTransferEndpointRegistration {
  readonly source:
    PlaceTransferEndpointSource;
}

interface ResolvedPlaceTransferEndpoint
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
    endpoint:
      PlaceTransferEndpointRegistration
  ): void {
    if (
      endpoint.placeId.length === 0 ||
      !Number.isFinite(
        endpoint.range
      ) ||
      endpoint.range < 0 ||
      (
        endpoint.source.kind ===
          "anchor" &&
        endpoint.source.anchorId
          .length === 0
      ) ||
      (
        endpoint.source.kind ===
          "attachment" &&
        endpoint.source.slot.length ===
          0
      )
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

    const registered:
      RegisteredPlaceTransferEndpoint =
        Object.freeze({
          placeId:
            endpoint.placeId,
          source:
            Object.freeze({
              ...endpoint.source
            }),
          range:
            endpoint.range
        });

    if (
      !this.resolveEndpoint(
        registered
      )
    ) {
      throw new Error(
        `place transfer endpoint source is unresolved: ${endpoint.placeId}`
      );
    }

    this.endpoints.set(
      endpoint.placeId,
      registered
    );
  }

  get(
    placeId: string
  ): PlaceTransferEndpoint | null {
    const registered =
      this.endpoints.get(placeId);

    if (!registered) {
      return null;
    }

    const resolved =
      this.resolveEndpoint(
        registered
      );

    if (!resolved) {
      return null;
    }

    return Object.freeze({
      placeId:
        resolved.placeId,
      domainId:
        resolved.domainId,
      position:
        Object.freeze({
          x: resolved.position.x,
          y: resolved.position.y
        }),
      navigationNodeId:
        resolved.navigationNodeId,
      range:
        resolved.range
    });
  }

  canEntityTransfer(
    environment: TransferEnvironment,
    entityId: string,
    placeId: string
  ): boolean {
    const entity =
      environment.world
        .getEntity(entityId);

    if (!entity) {
      return false;
    }

    if (
      entity.kind === "person"
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

    const registered =
      this.endpoints.get(placeId);
    const endpoint =
      registered
        ? this.resolveEndpoint(
            registered
          )
        : null;

    if (
      !endpoint ||
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

  private resolveEndpoint(
    registered:
      RegisteredPlaceTransferEndpoint
  ): ResolvedPlaceTransferEndpoint | null {
    const place =
      this.places.getPlace(
        registered.placeId
      );

    if (!place) {
      return null;
    }

    const definition =
      this.places.getDefinition(
        place.definitionId
      );
    const placement =
      this.places
        .getResolvedPlacement(
          registered.placeId
        );

    if (
      !definition?.footprint ||
      !placement
    ) {
      return null;
    }

    const source =
      registered.source.kind ===
        "anchor"
        ? this.places.resolveAnchor(
            registered.placeId,
            registered.source.anchorId
          )
        : place.attachments.get(
            registered.source.slot
          ) ?? null;

    if (
      !source ||
      !source.nodeId ||
      source.domainId !==
        placement.domainId
    ) {
      return null;
    }

    return {
      placeId:
        registered.placeId,
      domainId:
        source.domainId,
      position:
        source.position,
      navigationNodeId:
        source.nodeId,
      range:
        registered.range,
      footprint:
        definition.footprint,
      transform:
        placement.transform
    };
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
