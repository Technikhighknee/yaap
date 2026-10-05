export type TransportDefinitionId = string;
export type TransportId = string;

export interface TransportDefinition {
  readonly id: TransportDefinitionId;
  readonly cargo: {
    readonly slotCount: number;
    readonly slotCapacity: number;
  };
  readonly mobilityProfile:
    "cart";
}

export interface CreateTransportInput {
  readonly id: TransportId;
  readonly definitionId:
    TransportDefinitionId;
  readonly domainId: string;
  readonly position: {
    readonly x: number;
    readonly y: number;
  };
  readonly operatorEntityId?:
    string | null;
}

export interface TransportInstance {
  readonly id: TransportId;
  readonly definitionId:
    TransportDefinitionId;
  readonly worldEntityId: string;
  readonly cargoInventoryId: string;
  operatorEntityId: string | null;
}
