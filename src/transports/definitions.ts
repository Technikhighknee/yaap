import {
  TransportRegistry
} from "./registry.js";

import type {
  TransportDefinition
} from "./types.js";

export const TRANSPORT_DEFINITIONS = [
  {
    id: "wheelbarrow",
    cargo: {
      slotCount: 1,
      slotCapacity: 20
    },
    mobilityProfile: "cart"
  },
  {
    id: "handcart",
    cargo: {
      slotCount: 2,
      slotCapacity: 20
    },
    mobilityProfile: "cart"
  },
  {
    id: "ox-cart",
    cargo: {
      slotCount: 3,
      slotCapacity: 40
    },
    mobilityProfile: "cart"
  },
  {
    id: "horse-cart",
    cargo: {
      slotCount: 3,
      slotCapacity: 20
    },
    mobilityProfile: "cart"
  }
] as const satisfies
  readonly TransportDefinition[];

export function registerTransportDefinitions(
  registry: TransportRegistry
): void {
  for (
    const definition
    of TRANSPORT_DEFINITIONS
  ) {
    registry.registerDefinition(
      definition
    );
  }
}
