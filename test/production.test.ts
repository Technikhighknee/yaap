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

test("multiple workers can produce concurrently in the same foundry", () => {
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
    "both jobs must reserve distinct inputs"
  );
  assert.equal(
    storage.quantityOf(
      "charcoal"
    ),
    0
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;
  let maxSimultaneousWorking = 0;

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
    "parallel production jobs should finish"
  );

  for (const job of jobs) {
    assert.equal(
      job.phase,
      "complete",
      job.failureReason ??
        undefined
    );
  }

  assert.ok(
    maxSimultaneousWorking > 1,
    "the foundry must not impose a global production lock"
  );
  assert.equal(
    storage.quantityOf("iron"),
    10
  );
});

test("finished production waits atomically when output storage fills during work", () => {
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

  storage.add("iron-ore", 5);
  storage.add("charcoal", 2);

  addFoundryWorker(
    simulation,
    "blocked-smith"
  );

  const job =
    simulation.production.start({
      workerEntityId:
        "blocked-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  storage.add("gemstone", 20);
  storage.add("pinewood", 20);
  storage.add("oakwood", 20);
  storage.add("water", 20);

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    job.phase !==
      "awaiting-output" &&
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
    "production should reach output blocking"
  );
  assert.equal(
    job.phase,
    "awaiting-output",
    job.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("iron"),
    0
  );
  assert.equal(
    job.reservedInputs.length,
    0,
    "inputs are consumed once work finishes"
  );

  storage.remove("water", 20);

  stepSimulation(
    simulation,
    deltaSeconds
  );

  assert.equal(
    job.phase,
    "complete"
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );
});

test("production refunds reserved inputs when a worker leaves before finishing", () => {
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
    id: "leaving-smith",
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
        "leaving-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  assert.equal(
    job.phase,
    "working"
  );
  assert.equal(
    storage.quantityOf(
      "iron-ore"
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
    job.phase,
    "failed"
  );
  assert.match(
    job.failureReason ?? "",
    /left production workstation/
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
    storage.quantityOf("iron"),
    0
  );
  assert.equal(
    job.reservedInputs.length,
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
