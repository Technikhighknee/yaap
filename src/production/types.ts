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
  readonly workstationTag:
    string;
}

export type ProductionPhase =
  | "waiting-for-workstation"
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
  workstationAnchorId: string | null;
  phase: ProductionPhase;
  workRemainingSeconds: number;
  reservedInputs:
    readonly Readonly<ProductionQuantity>[];
  failureReason: string | null;
}
