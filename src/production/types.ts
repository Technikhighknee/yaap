export interface ProductionQuantity {
  readonly itemId: string;
  readonly amount: number;
}

export interface ProductionRecipeDefinition {
  readonly id: string;
  readonly inputs:
    readonly ProductionQuantity[];
  readonly outputs:
    readonly ProductionQuantity[];
  readonly workSeconds: number;
  readonly workstationAnchorId:
    string;
}

export type ProductionPhase =
  | "travelling-to-workstation"
  | "working"
  | "awaiting-output"
  | "refund-pending"
  | "complete"
  | "failed";

export interface ProductionJob {
  readonly workerEntityId: string;
  readonly placeId: string;
  readonly recipe:
    Readonly<ProductionRecipeDefinition>;
  phase: ProductionPhase;
  workRemainingSeconds: number;
  reservedInputs:
    readonly Readonly<ProductionQuantity>[];
  failureReason: string | null;
}
