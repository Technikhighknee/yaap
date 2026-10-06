import {
  planTravel,
  startTravel
} from "place-core";

import type {
  PlaceRegistry
} from "place-core";

import type {
  World
} from "world-core";

import type {
  InventoryBindingRegistry
} from "../inventory/bindings.js";

import type {
  Inventory
} from "../inventory/inventory.js";

import type {
  ItemRegistry
} from "../items/registry.js";

import type {
  ProductionJob,
  ProductionQuantity,
  ProductionRecipeDefinition
} from "./types.js";

interface ProductionEnvironment {
  readonly world: World;
  readonly places: PlaceRegistry;
  readonly items: ItemRegistry;
  readonly inventoryBindings:
    InventoryBindingRegistry;
}

interface MutableSlot {
  itemId: string | null;
  quantity: number;
}

const POSITION_EPSILON_SQ = 1e-12;

function validateLines(
  items: ItemRegistry,
  lines:
    readonly ProductionQuantity[],
  label: string
): readonly Readonly<ProductionQuantity>[] {
  if (lines.length === 0) {
    throw new TypeError(
      `${label} must not be empty`
    );
  }

  const seen =
    new Set<string>();

  return Object.freeze(
    lines.map((line) => {
      if (
        line.itemId.length === 0 ||
        !Number.isSafeInteger(
          line.amount
        ) ||
        line.amount <= 0
      ) {
        throw new TypeError(
          `invalid ${label} line`
        );
      }

      items.require(
        line.itemId
      );

      if (seen.has(line.itemId)) {
        throw new Error(
          `${label} contains duplicate item: ${line.itemId}`
        );
      }
      seen.add(line.itemId);

      return Object.freeze({
        itemId: line.itemId,
        amount: line.amount
      });
    })
  );
}

function cloneSlots(
  inventory: Inventory
): MutableSlot[] {
  return inventory.slots.map(
    (slot) => ({
      itemId: slot.itemId,
      quantity: slot.quantity
    })
  );
}

function removeFromSlots(
  slots: MutableSlot[],
  itemId: string,
  amount: number
): boolean {
  let remaining = amount;

  for (
    let index = slots.length - 1;
    index >= 0;
    index -= 1
  ) {
    const slot =
      slots[index];

    if (
      !slot ||
      slot.itemId !== itemId
    ) {
      continue;
    }

    const removed =
      Math.min(
        remaining,
        slot.quantity
      );

    slot.quantity -= removed;
    remaining -= removed;

    if (slot.quantity === 0) {
      slot.itemId = null;
    }

    if (remaining === 0) {
      return true;
    }
  }

  return false;
}

function addToSlots(
  slots: MutableSlot[],
  slotCapacity: number,
  itemId: string,
  amount: number
): boolean {
  let remaining = amount;

  for (const slot of slots) {
    if (
      slot.itemId !== itemId
    ) {
      continue;
    }

    const added =
      Math.min(
        remaining,
        slotCapacity -
          slot.quantity
      );

    slot.quantity += added;
    remaining -= added;

    if (remaining === 0) {
      return true;
    }
  }

  for (const slot of slots) {
    if (slot.itemId !== null) {
      continue;
    }

    const added =
      Math.min(
        remaining,
        slotCapacity
      );

    slot.itemId = itemId;
    slot.quantity = added;
    remaining -= added;

    if (remaining === 0) {
      return true;
    }
  }

  return false;
}

function canTransformInventory(
  inventory: Inventory,
  inputs:
    readonly Readonly<ProductionQuantity>[],
  outputs:
    readonly Readonly<ProductionQuantity>[]
): boolean {
  const slots =
    cloneSlots(inventory);

  for (const input of inputs) {
    if (
      !removeFromSlots(
        slots,
        input.itemId,
        input.amount
      )
    ) {
      return false;
    }
  }

  for (const output of outputs) {
    if (
      !addToSlots(
        slots,
        inventory.slotCapacity,
        output.itemId,
        output.amount
      )
    ) {
      return false;
    }
  }

  return true;
}

function canAddManifest(
  inventory: Inventory,
  lines:
    readonly Readonly<ProductionQuantity>[]
): boolean {
  const slots =
    cloneSlots(inventory);

  for (const line of lines) {
    if (
      !addToSlots(
        slots,
        inventory.slotCapacity,
        line.itemId,
        line.amount
      )
    ) {
      return false;
    }
  }

  return true;
}

function removeManifest(
  inventory: Inventory,
  lines:
    readonly Readonly<ProductionQuantity>[]
): void {
  for (const line of lines) {
    if (
      inventory.quantityOf(
        line.itemId
      ) < line.amount
    ) {
      throw new Error(
        `production input unavailable: ${line.itemId}`
      );
    }
  }

  const removed:
    Readonly<ProductionQuantity>[] = [];

  for (const line of lines) {
    const result =
      inventory.remove(
        line.itemId,
        line.amount
      );

    if (
      result.moved ===
      line.amount
    ) {
      removed.push(line);
      continue;
    }

    if (result.moved > 0) {
      const rollback =
        inventory.add(
          line.itemId,
          result.moved
        );
      if (
        rollback.moved !==
        result.moved
      ) {
        throw new Error(
          "production input current-line rollback failed"
        );
      }
    }

    for (
      let index =
        removed.length - 1;
      index >= 0;
      index -= 1
    ) {
      const previous =
        removed[index];
      if (!previous) {
        continue;
      }

      const rollback =
        inventory.add(
          previous.itemId,
          previous.amount
        );
      if (
        rollback.moved !==
        previous.amount
      ) {
        throw new Error(
          "production input rollback failed"
        );
      }
    }

    throw new Error(
      "production input changed after validation"
    );
  }
}

function addManifest(
  inventory: Inventory,
  lines:
    readonly Readonly<ProductionQuantity>[]
): void {
  if (
    !canAddManifest(
      inventory,
      lines
    )
  ) {
    throw new Error(
      "production inventory lacks manifest capacity"
    );
  }

  const added:
    Readonly<ProductionQuantity>[] = [];

  for (const line of lines) {
    const result =
      inventory.add(
        line.itemId,
        line.amount
      );

    if (
      result.moved ===
      line.amount
    ) {
      added.push(line);
      continue;
    }

    if (result.moved > 0) {
      const rollback =
        inventory.remove(
          line.itemId,
          result.moved
        );
      if (
        rollback.moved !==
        result.moved
      ) {
        throw new Error(
          "production output current-line rollback failed"
        );
      }
    }

    for (
      let index =
        added.length - 1;
      index >= 0;
      index -= 1
    ) {
      const previous =
        added[index];
      if (!previous) {
        continue;
      }

      const rollback =
        inventory.remove(
          previous.itemId,
          previous.amount
        );
      if (
        rollback.moved !==
        previous.amount
      ) {
        throw new Error(
          "production output rollback failed"
        );
      }
    }

    throw new Error(
      "production output changed after validation"
    );
  }
}

export class ProductionSystem {
  readonly recipes =
    new Map<
      string,
      Readonly<ProductionRecipeDefinition>
    >();

  readonly jobs =
    new Map<string, ProductionJob>();

  private readonly workstationClaims =
    new Map<string, string>();

  constructor(
    private readonly environment:
      ProductionEnvironment
  ) {}

  registerRecipe(
    definition:
      ProductionRecipeDefinition
  ): void {
    if (
      definition.id.length === 0 ||
      definition.workstationTag
        .length === 0 ||
      !Number.isFinite(
        definition.workSeconds
      ) ||
      definition.workSeconds <= 0
    ) {
      throw new TypeError(
        "invalid production recipe"
      );
    }

    if (
      this.recipes.has(
        definition.id
      )
    ) {
      throw new Error(
        `production recipe already registered: ${definition.id}`
      );
    }

    const inputs =
      validateLines(
        this.environment.items,
        definition.inputs,
        "production inputs"
      );
    const outputs =
      validateLines(
        this.environment.items,
        definition.outputs,
        "production outputs"
      );

    this.recipes.set(
      definition.id,
      Object.freeze({
        id: definition.id,
        inputs,
        outputs,
        workSeconds:
          definition.workSeconds,
        workstationTag:
          definition.workstationTag
      })
    );
  }

  start(input: {
    workerEntityId: string;
    placeId: string;
    recipeId: string;
  }): ProductionJob {
    const existing =
      this.jobs.get(
        input.workerEntityId
      );

    if (
      existing &&
      existing.phase !== "complete" &&
      existing.phase !== "failed"
    ) {
      throw new Error(
        `worker already has production job: ${input.workerEntityId}`
      );
    }

    const recipe =
      this.recipes.get(
        input.recipeId
      );
    if (!recipe) {
      throw new Error(
        `unknown production recipe: ${input.recipeId}`
      );
    }

    const worker =
      this.environment.world
        .getEntity(
          input.workerEntityId
        );
    if (!worker) {
      throw new Error(
        `unknown production worker: ${input.workerEntityId}`
      );
    }
    if (
      worker.kind !== "person"
    ) {
      throw new Error(
        `production worker must be a person: ${input.workerEntityId}`
      );
    }
    if (
      worker.journey ||
      this.environment.places
        .activeTravels.has(
          input.workerEntityId
        )
    ) {
      throw new Error(
        `production worker is already travelling: ${input.workerEntityId}`
      );
    }

    const place =
      this.environment.places
        .getPlace(
          input.placeId
        );
    if (!place) {
      throw new Error(
        `unknown production place: ${input.placeId}`
      );
    }

    const workstations =
      this.environment.places
        .findAnchors({
          placeId: input.placeId,
          tag: recipe.workstationTag,
          enabledOnly: true
        });
    if (workstations.length === 0) {
      throw new Error(
        `production workstation is unavailable: ${input.placeId}:${recipe.workstationTag}`
      );
    }

    const storage =
      this.storage(
        input.placeId
      );

    if (
      !canTransformInventory(
        storage,
        recipe.inputs,
        recipe.outputs
      )
    ) {
      for (
        const recipeInput
        of recipe.inputs
      ) {
        if (
          storage.quantityOf(
            recipeInput.itemId
          ) <
          recipeInput.amount
        ) {
          throw new Error(
            `production input unavailable: ${recipeInput.itemId}`
          );
        }
      }

      throw new Error(
        "production output cannot fit after input reservation"
      );
    }

    removeManifest(
      storage,
      recipe.inputs
    );

    const job: ProductionJob = {
      workerEntityId:
        input.workerEntityId,
      placeId:
        input.placeId,
      recipe,
      workstationAnchorId: null,
      phase:
        "waiting-for-workstation",
      workRemainingSeconds:
        recipe.workSeconds,
      reservedInputs:
        recipe.inputs,
      failureReason: null
    };

    this.jobs.set(
      input.workerEntityId,
      job
    );

    try {
      this.tryAcquireWorkstation(
        job
      );
    } catch (error) {
      this.jobs.delete(
        input.workerEntityId
      );
      addManifest(
        storage,
        recipe.inputs
      );
      throw error;
    }

    return job;
  }

  step(
    deltaSeconds: number
  ): void {
    if (
      !Number.isFinite(
        deltaSeconds
      ) ||
      deltaSeconds <= 0
    ) {
      throw new TypeError(
        "production deltaSeconds must be positive and finite"
      );
    }

    for (
      const job
      of this.jobs.values()
    ) {
      if (
        job.phase === "complete" ||
        job.phase === "failed"
      ) {
        continue;
      }

      if (
        job.phase ===
        "refund-pending"
      ) {
        this.tryRefund(job);
        continue;
      }

      if (
        job.phase ===
        "awaiting-output"
      ) {
        this.tryDepositOutput(
          job
        );
        continue;
      }

      const worker =
        this.environment.world
          .getEntity(
            job.workerEntityId
          );

      if (!worker) {
        this.failAndRefund(
          job,
          "worker disappeared"
        );
        continue;
      }

      if (
        job.phase ===
        "waiting-for-workstation"
      ) {
        if (
          worker.journey ||
          this.environment.places
            .activeTravels.has(
              job.workerEntityId
            )
        ) {
          this.failAndRefund(
            job,
            "worker started travelling while waiting for production workstation"
          );
          continue;
        }

        if (
          !this.tryAcquireWorkstation(
            job
          )
        ) {
          continue;
        }
      }

      if (
        job.phase ===
        "travelling-to-workstation"
      ) {
        if (
          this.environment.places
            .activeTravels.has(
              job.workerEntityId
            )
        ) {
          continue;
        }

        if (
          !this.workerAtWorkstation(
            job,
            worker
          )
        ) {
          this.failAndRefund(
            job,
            "worker did not reach production workstation"
          );
          continue;
        }

        job.phase = "working";
      }

      if (
        job.phase !== "working"
      ) {
        continue;
      }

      if (
        worker.journey ||
        this.environment.places
          .activeTravels.has(
            job.workerEntityId
          ) ||
        !this.workerAtWorkstation(
          job,
          worker
        )
      ) {
        this.failAndRefund(
          job,
          "worker left production workstation"
        );
        continue;
      }

      job.workRemainingSeconds -=
        deltaSeconds;

      if (
        job.workRemainingSeconds > 0
      ) {
        continue;
      }

      this.releaseWorkstation(
        job
      );

      job.reservedInputs =
        Object.freeze([]);

      if (
        !this.tryDepositOutput(
          job
        )
      ) {
        job.phase =
          "awaiting-output";
      }
    }
  }

  private storage(
    placeId: string
  ): Inventory {
    const storage =
      this.environment
        .inventoryBindings
        .getInventory(
          {
            kind: "place",
            id: placeId
          },
          "storage"
        );

    if (!storage) {
      throw new Error(
        `production place has no storage: ${placeId}`
      );
    }

    return storage;
  }

  private workstationClaimKey(
    placeId: string,
    anchorId: string
  ): string {
    return JSON.stringify([
      placeId,
      anchorId
    ]);
  }

  private tryAcquireWorkstation(
    job: ProductionJob
  ): boolean {
    if (
      job.workstationAnchorId !== null
    ) {
      return true;
    }

    const availableWorkstations =
      this.environment.places
        .findAnchors({
          placeId: job.placeId,
          tag:
            job.recipe.workstationTag,
          enabledOnly: true
        })
        .filter(
          (anchor) =>
            !this.workstationClaims.has(
              this.workstationClaimKey(
                job.placeId,
                anchor.id
              )
            )
        );

    if (
      availableWorkstations.length === 0
    ) {
      return false;
    }

    const plan =
      planTravel(
        this.environment.places,
        job.workerEntityId,
        {
          kind: "nearest",
          tag:
            job.recipe.workstationTag,
          placeId:
            job.placeId
        },
        {
          anchorPredicate:
            (anchor) =>
              !this.workstationClaims.has(
                this.workstationClaimKey(
                  job.placeId,
                  anchor.id
                )
              )
        }
      );

    if (!plan) {
      return false;
    }

    const anchorId =
      plan.resolvedTarget.anchorId;

    if (!anchorId) {
      throw new Error(
        "production plan resolved without a workstation anchor"
      );
    }

    const claimKey =
      this.workstationClaimKey(
        job.placeId,
        anchorId
      );

    if (
      this.workstationClaims.has(
        claimKey
      )
    ) {
      return false;
    }

    this.workstationClaims.set(
      claimKey,
      job.workerEntityId
    );

    let travel;

    try {
      travel =
        startTravel(
          this.environment.places,
          job.workerEntityId,
          {
            placeId:
              job.placeId,
            anchorId
          }
        );
    } catch (error) {
      this.workstationClaims.delete(
        claimKey
      );
      throw error;
    }

    if (
      !travel ||
      (
        travel.status !== "active" &&
        travel.status !== "complete"
      )
    ) {
      this.workstationClaims.delete(
        claimKey
      );
      return false;
    }

    job.workstationAnchorId =
      anchorId;
    job.phase =
      travel.status === "complete"
        ? "working"
        : "travelling-to-workstation";

    return true;
  }

  private releaseWorkstation(
    job: ProductionJob
  ): void {
    if (
      job.workstationAnchorId === null
    ) {
      return;
    }

    const claimKey =
      this.workstationClaimKey(
        job.placeId,
        job.workstationAnchorId
      );
    const owner =
      this.workstationClaims.get(
        claimKey
      );

    if (owner === undefined) {
      return;
    }

    if (
      owner !==
      job.workerEntityId
    ) {
      throw new Error(
        `production workstation claim owner mismatch: ${job.placeId}:${job.workstationAnchorId}`
      );
    }

    this.workstationClaims.delete(
      claimKey
    );
  }

  private workerAtWorkstation(
    job: ProductionJob,
    worker: {
      readonly domainId?: string;
      readonly position: {
        readonly x: number;
        readonly y: number;
      };
    }
  ): boolean {
    if (
      job.workstationAnchorId === null
    ) {
      return false;
    }

    const workstation =
      this.environment.places
        .resolveAnchor(
          job.placeId,
          job.workstationAnchorId
        );

    if (
      !workstation ||
      worker.domainId !==
        workstation.domainId
    ) {
      return false;
    }

    const dx =
      worker.position.x -
      workstation.position.x;
    const dy =
      worker.position.y -
      workstation.position.y;

    return (
      dx * dx + dy * dy <=
      POSITION_EPSILON_SQ
    );
  }

  private tryDepositOutput(
    job: ProductionJob
  ): boolean {
    let storage: Inventory;

    try {
      storage =
        this.storage(
          job.placeId
        );
    } catch {
      job.phase =
        "awaiting-output";
      return false;
    }

    if (
      !canAddManifest(
        storage,
        job.recipe.outputs
      )
    ) {
      job.phase =
        "awaiting-output";
      return false;
    }

    addManifest(
      storage,
      job.recipe.outputs
    );

    job.phase = "complete";
    return true;
  }

  private failAndRefund(
    job: ProductionJob,
    reason: string
  ): void {
    this.releaseWorkstation(
      job
    );

    job.failureReason = reason;

    if (
      job.reservedInputs.length === 0
    ) {
      job.phase = "failed";
      return;
    }

    if (!this.tryRefund(job)) {
      job.phase =
        "refund-pending";
    }
  }

  private tryRefund(
    job: ProductionJob
  ): boolean {
    let storage: Inventory;

    try {
      storage =
        this.storage(
          job.placeId
        );
    } catch {
      job.phase =
        "refund-pending";
      return false;
    }

    if (
      !canAddManifest(
        storage,
        job.reservedInputs
      )
    ) {
      job.phase =
        "refund-pending";
      return false;
    }

    addManifest(
      storage,
      job.reservedInputs
    );

    job.reservedInputs =
      Object.freeze([]);
    job.phase = "failed";
    return true;
  }
}
