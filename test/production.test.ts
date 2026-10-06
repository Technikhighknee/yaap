import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  SMALL_TOWN_IDS,
  createSmallTownScenario
} from "../src/scenarios/small-town.js";

import {
  stepSimulation
} from "../src/simulation.js";

function addFoundryWorker(
  simulation:
    ReturnType<
      typeof createSmallTownScenario
    >,
  id: string
) {
  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.foundry
    );

  assert.ok(endpoint);

  simulation.world.addEntity({
    id,
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  return endpoint;
}

test("foundry worker travels inside, works at the forge, and smelts reserved ore", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(storage);
  assert.ok(forge);

  storage.add("iron-ore", 5);
  storage.add("charcoal", 2);

  addFoundryWorker(
    simulation,
    "smith-01"
  );

  const job =
    simulation.production.start({
      workerEntityId: "smith-01",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    storage.quantityOf(
      "iron-ore"
    ),
    0
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    0
  );
  assert.equal(
    storage.quantityOf("iron"),
    0
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;
  let sawWorkingAtForge = false;

  while (
    job.phase !== "complete" &&
    job.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );

    if (
      job.phase === "working"
    ) {
      const worker =
        simulation.world.getEntity(
          "smith-01"
        );
      assert.ok(worker);

      assert.equal(
        worker.domainId,
        forge.domainId
      );
      assert.deepEqual(
        worker.position,
        forge.position
      );

      const location =
        simulation.places
          .locateEntity(worker);

      assert.equal(
        location.semanticPlaces
          .includes(
            SMALL_TOWN_IDS.foundry
          ),
        true
      );

      sawWorkingAtForge = true;
    }

    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "production job should finish"
  );
  assert.equal(
    job.phase,
    "complete",
    job.failureReason ??
      undefined
  );
  assert.equal(
    sawWorkingAtForge,
    true
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );
  assert.equal(
    job.reservedInputs.length,
    0
  );
});

test("one physical forge serializes production workers", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );

  assert.ok(storage);

  storage.add("iron-ore", 10);
  storage.add("charcoal", 4);

  const workerIds = [
    "smith-a",
    "smith-b"
  ];

  for (const workerId of workerIds) {
    addFoundryWorker(
      simulation,
      workerId
    );
  }

  const jobs =
    workerIds.map(
      (workerEntityId) =>
        simulation.production.start({
          workerEntityId,
          placeId:
            SMALL_TOWN_IDS.foundry,
          recipeId:
            "smelt-iron"
        })
    );

  assert.equal(
    storage.quantityOf(
      "iron-ore"
    ),
    0,
    "both committed jobs reserve their inputs"
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    0
  );
  assert.equal(
    jobs[1]?.workstationAnchorId,
    null
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .jobCount,
    2
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    1
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;
  let maxSimultaneousWorking = 0;
  let sawSecondWaiting = false;
  let sawSecondWorkAfterFirst =
    false;

  while (
    jobs.some(
      (job) =>
        job.phase !== "complete" &&
        job.phase !== "failed"
    ) &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );

    if (
      jobs[1]?.phase ===
      "waiting-for-workstation"
    ) {
      sawSecondWaiting = true;
    }

    if (
      jobs[0]?.phase === "complete" &&
      jobs[1]?.phase === "working"
    ) {
      sawSecondWorkAfterFirst =
        true;
    }

    maxSimultaneousWorking =
      Math.max(
        maxSimultaneousWorking,
        jobs.filter(
          (job) =>
            job.phase === "working"
        ).length
      );

    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "serialized production jobs should finish"
  );

  for (const job of jobs) {
    assert.equal(
      job.phase,
      "complete",
      job.failureReason ??
        undefined
    );
    assert.equal(
      job.workstationAnchorId,
      "forge"
    );
  }

  assert.equal(
    sawSecondWaiting,
    true
  );
  assert.equal(
    maxSimultaneousWorking,
    1,
    "one forge must never host two active workers"
  );
  assert.equal(
    sawSecondWorkAfterFirst,
    true,
    "the waiting worker should acquire the forge after it is released"
  );
  assert.equal(
    storage.quantityOf("iron"),
    10
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .jobCount,
    2
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    0
  );
});

test("deferred workstation acquisition failure is contained and refunded", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(storage);
  assert.ok(forge);

  storage.add("iron-ore", 10);
  storage.add("charcoal", 4);

  simulation.world.addEntity({
    id: "active-smith",
    kind: "person",
    domainId: forge.domainId,
    position: forge.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });
  addFoundryWorker(
    simulation,
    "waiting-smith"
  );

  const activeJob =
    simulation.production.start({
      workerEntityId:
        "active-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });
  const waitingJob =
    simulation.production.start({
      workerEntityId:
        "waiting-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    activeJob.phase,
    "working"
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    null
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    storage.quantityOf("charcoal"),
    0
  );

  const originalPlanLocalRoute =
    simulation.bridge.planLocalRoute;

  simulation.bridge.planLocalRoute =
    () => {
      throw new Error(
        "synthetic exact workstation route failure"
      );
    };

  try {
    assert.doesNotThrow(() => {
      simulation.production.step(20);
    });
  } finally {
    simulation.bridge.planLocalRoute =
      originalPlanLocalRoute;
  }

  assert.equal(
    activeJob.phase,
    "complete"
  );
  assert.equal(
    waitingJob.phase,
    "failed"
  );
  assert.equal(
    waitingJob.failureReason,
    "failed to acquire production workstation"
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    null
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    storage.quantityOf("charcoal"),
    2
  );
  assert.equal(
    waitingJob.reservedInputs.length,
    0
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    0
  );
});

test("different physical workstations can run concurrently", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const foundryStorage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  const woodStorage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id:
            SMALL_TOWN_IDS
              .woodcutterCamp
        },
        "storage"
      );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );
  const kiln =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.woodcutterCamp,
      "charcoal-kiln"
    );

  assert.ok(foundryStorage);
  assert.ok(woodStorage);
  assert.ok(forge);
  assert.ok(kiln);

  foundryStorage.add(
    "iron-ore",
    5
  );
  foundryStorage.add(
    "charcoal",
    2
  );
  woodStorage.add(
    "pinewood",
    5
  );

  simulation.world.addEntity({
    id: "parallel-smith",
    kind: "person",
    domainId: forge.domainId,
    position: forge.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  simulation.world.addEntity({
    id: "parallel-burner",
    kind: "person",
    domainId: kiln.domainId,
    position: kiln.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const smith =
    simulation.production.start({
      workerEntityId:
        "parallel-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });
  const burner =
    simulation.production.start({
      workerEntityId:
        "parallel-burner",
      placeId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      recipeId:
        "burn-pine-charcoal"
    });

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;
  let sawConcurrentWork =
    smith.phase === "working" &&
    burner.phase === "working";

  while (
    (
      smith.phase !== "complete" ||
      burner.phase !== "complete"
    ) &&
    smith.phase !== "failed" &&
    burner.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );

    if (
      smith.phase === "working" &&
      burner.phase === "working"
    ) {
      sawConcurrentWork = true;
    }

    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "independent workstation jobs should finish"
  );
  assert.equal(
    smith.phase,
    "complete",
    smith.failureReason ??
      undefined
  );
  assert.equal(
    burner.phase,
    "complete",
    burner.failureReason ??
      undefined
  );
  assert.equal(
    sawConcurrentWork,
    true,
    "workstation claims must not become a global production lock"
  );
});

test("blocked production output keeps the physical workstation reserved", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );

  assert.ok(storage);

  storage.add("iron-ore", 10);
  storage.add("charcoal", 4);

  addFoundryWorker(
    simulation,
    "blocked-smith"
  );
  addFoundryWorker(
    simulation,
    "waiting-smith"
  );

  const blockedJob =
    simulation.production.start({
      workerEntityId:
        "blocked-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });
  const waitingJob =
    simulation.production.start({
      workerEntityId:
        "waiting-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    waitingJob.workstationAnchorId,
    null
  );

  storage.add("gemstone", 20);
  storage.add("pinewood", 20);
  storage.add("oakwood", 20);
  storage.add("water", 20);

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    blockedJob.phase !==
      "awaiting-output" &&
    blockedJob.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "production should reach output blocking"
  );
  assert.equal(
    String(blockedJob.phase),
    "awaiting-output",
    blockedJob.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("iron"),
    0
  );
  assert.equal(
    blockedJob.reservedInputs.length,
    0,
    "inputs are consumed once work finishes"
  );
  assert.equal(
    blockedJob.workstationAnchorId,
    "forge"
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    null,
    "the waiting job must not acquire a forge with blocked output"
  );

  storage.remove("water", 20);

  stepSimulation(
    simulation,
    deltaSeconds
  );

  assert.equal(
    String(blockedJob.phase),
    "complete"
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    "forge",
    "the waiting job should acquire the forge after output clears"
  );

  let waitingTicks = 0;

  while (
    waitingJob.phase !== "complete" &&
    waitingJob.phase !== "failed" &&
    waitingTicks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    waitingTicks += 1;
  }

  assert.ok(
    waitingTicks < maxTicks,
    "the waiting production job should finish after the forge is released"
  );
  assert.equal(
    waitingJob.phase,
    "complete",
    waitingJob.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("iron"),
    10
  );
});

test("failed production releases the workstation to a waiting worker", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(storage);
  assert.ok(forge);

  storage.add("iron-ore", 10);
  storage.add("charcoal", 4);

  simulation.world.addEntity({
    id: "leaving-smith",
    kind: "person",
    domainId: forge.domainId,
    position: forge.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });
  addFoundryWorker(
    simulation,
    "waiting-after-failure"
  );

  const leavingJob =
    simulation.production.start({
      workerEntityId:
        "leaving-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });
  const waitingJob =
    simulation.production.start({
      workerEntityId:
        "waiting-after-failure",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    leavingJob.phase,
    "working"
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    null
  );
  assert.equal(
    storage.quantityOf(
      "iron-ore"
    ),
    0
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    0
  );

  simulation.world.setPosition(
    "leaving-smith",
    {
      x: 5,
      y: 4
    }
  );

  stepSimulation(
    simulation,
    0.25
  );

  assert.equal(
    leavingJob.phase,
    "failed"
  );
  assert.match(
    leavingJob.failureReason ?? "",
    /left production workstation/
  );
  assert.equal(
    leavingJob.reservedInputs.length,
    0
  );
  assert.equal(
    waitingJob.workstationAnchorId,
    "forge",
    "the waiting worker should claim the forge in the same production step"
  );
  assert.equal(
    storage.quantityOf(
      "iron-ore"
    ),
    5
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    2
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    1
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    waitingJob.phase !== "complete" &&
    waitingJob.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "the waiting worker should finish after the failed worker releases the forge"
  );
  assert.equal(
    waitingJob.phase,
    "complete",
    waitingJob.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );
  assert.equal(
    storage.quantityOf(
      "iron-ore"
    ),
    5
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    2
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    0
  );
});


test("disabling a workstation space fails and refunds active production", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(storage);
  assert.ok(forge);

  storage.add("iron-ore", 5);
  storage.add("charcoal", 2);

  simulation.world.addEntity({
    id: "disabled-space-smith",
    kind: "person",
    domainId: forge.domainId,
    position: forge.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const job =
    simulation.production.start({
      workerEntityId:
        "disabled-space-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    job.phase,
    "working"
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    1
  );

  simulation.places.setSpaceState(
    SMALL_TOWN_IDS.foundry,
    "workshop",
    { enabled: false }
  );

  simulation.production.step(0.25);

  assert.equal(
    job.phase,
    "failed"
  );
  assert.match(
    job.failureReason ?? "",
    /left production workstation/
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    storage.quantityOf("charcoal"),
    2
  );
  assert.equal(
    storage.quantityOf("iron"),
    0
  );
  assert.equal(
    job.reservedInputs.length,
    0
  );
  assert.equal(
    simulation.production
      .assertInternalConsistency()
      .workstationClaimCount,
    0
  );
});

test("woodcutter can burn gathered wood into charcoal at the camp kiln", () => {
  const simulation =
    createSmallTownScenario();
  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.woodcutterCamp
    );
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id:
            SMALL_TOWN_IDS
              .woodcutterCamp
        },
        "storage"
      );
  const kiln =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.woodcutterCamp,
      "charcoal-kiln"
    );

  assert.ok(endpoint);
  assert.ok(storage);
  assert.ok(kiln);

  storage.add("pinewood", 5);

  simulation.world.addEntity({
    id: "charcoal-burner",
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const job =
    simulation.production.start({
      workerEntityId:
        "charcoal-burner",
      placeId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      recipeId: "burn-pine-charcoal"
    });

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;
  let sawWorkingAtKiln = false;

  while (
    job.phase !== "complete" &&
    job.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );

    if (job.phase === "working") {
      const worker =
        simulation.world.getEntity(
          "charcoal-burner"
        );
      assert.ok(worker);
      assert.equal(
        worker.domainId,
        kiln.domainId
      );
      assert.deepEqual(
        worker.position,
        kiln.position
      );
      sawWorkingAtKiln = true;
    }

    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "charcoal production should finish"
  );
  assert.equal(
    job.phase,
    "complete",
    job.failureReason ??
      undefined
  );
  assert.equal(
    sawWorkingAtKiln,
    true
  );
  assert.equal(
    storage.quantityOf(
      "pinewood"
    ),
    0
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    2
  );
});


test("charcoal burner works at the exterior kiln without leaving the host domain", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.woodcutterCamp
    );
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id:
            SMALL_TOWN_IDS
              .woodcutterCamp
        },
        "storage"
      );
  const kiln =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.woodcutterCamp,
      "charcoal-kiln"
    );

  assert.ok(endpoint);
  assert.ok(storage);
  assert.ok(kiln);

  storage.add("pinewood", 5);

  simulation.world.addEntity({
    id: "charcoal-burner",
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const job =
    simulation.production.start({
      workerEntityId:
        "charcoal-burner",
      placeId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      recipeId: "burn-pine-charcoal"
    });

  assert.equal(
    storage.quantityOf("pinewood"),
    0
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    job.phase !== "complete" &&
    job.phase !== "failed" &&
    ticks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "charcoal production should finish"
  );
  assert.equal(
    job.phase,
    "complete",
    job.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("charcoal"),
    2
  );

  storage.add("oakwood", 5);

  const oakJob =
    simulation.production.start({
      workerEntityId:
        "charcoal-burner",
      placeId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      recipeId: "burn-oak-charcoal"
    });

  let oakTicks = 0;

  while (
    oakJob.phase !== "complete" &&
    oakJob.phase !== "failed" &&
    oakTicks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    oakTicks += 1;
  }

  assert.ok(
    oakTicks < maxTicks,
    "oak charcoal production should finish"
  );
  assert.equal(
    oakJob.phase,
    "complete",
    oakJob.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("oakwood"),
    0
  );
  assert.equal(
    storage.quantityOf("charcoal"),
    4
  );

  const worker =
    simulation.world.getEntity(
      "charcoal-burner"
    );

  assert.ok(worker);
  assert.equal(
    worker.domainId,
    "default"
  );
  assert.equal(
    worker.domainId,
    kiln.domainId
  );
  assert.deepEqual(
    worker.position,
    kiln.position
  );

  assert.equal(
    simulation.places
      .locateEntity(worker)
      .semanticPlaces
      .includes(
        SMALL_TOWN_IDS
          .woodcutterCamp
      ),
    true
  );
});
