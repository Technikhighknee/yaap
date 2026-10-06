import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  createOwnerInventory
} from "../src/inventory/owners.js";

import {
  SMALL_TOWN_IDS,
  SMALL_TOWN_RESOURCE_IDS,
  createSmallTownScenario
} from "../src/scenarios/small-town.js";

import {
  stepSimulation
} from "../src/simulation.js";

test("miner walks to iron, works, returns, and deposits into exterior mine storage", () => {
  const simulation =
    createSmallTownScenario();

  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );
  const carried =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "entity",
          id: "miner-01"
        },
        "carried"
      );
  const ironNode =
    simulation.resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.iron
    );

  assert.ok(storage);
  assert.ok(carried);
  assert.ok(ironNode);
  assert.equal(
    storage.quantityOf("iron-ore"),
    0
  );

  const job =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  const seen =
    new Set<string>();
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
    seen.add(job.phase);

    if (
      job.phase === "working"
    ) {
      const miner =
        simulation.world
          .getEntity("miner-01");
      assert.ok(miner);
      assert.equal(
        miner.domainId,
        ironNode.location.domainId
      );
      assert.deepEqual(
        miner.position,
        ironNode.location.position
      );
    }

    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "gathering loop should complete"
  );
  assert.equal(
    job.phase,
    "complete",
    job.failureReason ?? undefined
  );
  assert.ok(seen.has("working"));
  assert.ok(seen.has("returning"));

  assert.equal(
    carried.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    5
  );

  const secondJob =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  let secondTicks = 0;
  while (
    secondJob.phase !== "complete" &&
    secondJob.phase !== "failed" &&
    secondTicks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    secondTicks += 1;
  }

  assert.equal(
    secondJob.phase,
    "complete",
    secondJob.failureReason ??
      undefined
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    10
  );

  const miner =
    simulation.world
      .getEntity("miner-01");
  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );

  assert.ok(miner);
  assert.ok(endpoint);
  assert.equal(
    miner.domainId,
    endpoint.domainId
  );
  assert.deepEqual(
    miner.position,
    endpoint.position
  );
  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        "miner-01",
        SMALL_TOWN_IDS.mine
      ),
    true
  );
});

test("interior building inventory is transferable from its exterior world endpoint", () => {
  const simulation =
    createSmallTownScenario();

  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.foundry
    );
  assert.ok(endpoint);
  assert.equal(
    endpoint.domainId,
    "default"
  );

  const courierPosition = {
    x: 98,
    y: 119.5
  };

  assert.ok(
    Math.hypot(
      courierPosition.x -
        endpoint.position.x,
      courierPosition.y -
        endpoint.position.y
    ) > endpoint.range,
    "test position must be outside the navigation-point radius"
  );

  simulation.world.addEntity({
    id: "courier",
    kind: "person",
    domainId: endpoint.domainId,
    position: courierPosition
  });

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        "courier",
        SMALL_TOWN_IDS.foundry
      ),
    true,
    "transfer range must be measured from the building footprint, not the navigation point"
  );

  const carried =
    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: "courier"
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );
  carried.add("iron-ore", 7);

  const result =
    simulation.transfers
      .transferEntityToPlace(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        "courier",
        "carried",
        SMALL_TOWN_IDS.foundry,
        "storage",
        "iron-ore",
        7
      );

  assert.equal(result.moved, 7);
  assert.equal(
    carried.quantityOf("iron-ore"),
    0
  );

  const foundryStorage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.foundry
        },
        "storage"
      );
  assert.ok(foundryStorage);
  assert.equal(
    foundryStorage.quantityOf(
      "iron-ore"
    ),
    7
  );

  const courier =
    simulation.world
      .getEntity("courier");
  assert.ok(courier);
  assert.equal(
    courier.domainId,
    "default",
    "transfer must not require entering the foundry interior domain"
  );
});

test("mine is an embedded outdoor place and has no owned interior domain", () => {
  const simulation =
    createSmallTownScenario();

  const mine =
    simulation.places.getPlace(
      SMALL_TOWN_IDS.mine
    );
  assert.ok(mine);

  assert.equal(
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.mine,
        "site"
      ),
    "default"
  );

  assert.equal(
    Array.from(
      simulation.places
        .domainBindings.values()
    ).some(
      (binding) =>
        binding.instanceId ===
        SMALL_TOWN_IDS.mine
    ),
    false
  );
});


test("gathering stops if the worker leaves the resource while working", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );
  const carried =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "entity",
          id: "miner-01"
        },
        "carried"
      );
  const ironNode =
    simulation.resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.iron
    );

  assert.ok(storage);
  assert.ok(carried);
  assert.ok(ironNode);

  const job =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  let ticks = 0;
  while (
    job.phase !== "working" &&
    job.phase !== "failed" &&
    ticks < 4_000
  ) {
    stepSimulation(
      simulation,
      0.25
    );
    ticks += 1;
  }

  assert.equal(
    job.phase,
    "working",
    job.failureReason ??
      undefined
  );

  simulation.world.setPosition(
    "miner-01",
    {
      x:
        ironNode.location
          .position.x + 1,
      y:
        ironNode.location
          .position.y
    }
  );

  simulation.gathering.step(
    0.25
  );

  assert.equal(
    job.phase,
    "failed"
  );
  assert.equal(
    job.failureReason,
    "worker left resource"
  );
  assert.equal(
    carried.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    0
  );
});

test("gathered output stays with the worker when the return route becomes unavailable", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );
  const carried =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "entity",
          id: "miner-01"
        },
        "carried"
      );

  assert.ok(storage);
  assert.ok(carried);

  const job =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  let ticks = 0;
  while (
    job.phase !== "working" &&
    job.phase !== "failed" &&
    ticks < 4_000
  ) {
    stepSimulation(
      simulation,
      0.25
    );
    ticks += 1;
  }

  assert.equal(
    job.phase,
    "working",
    job.failureReason ??
      undefined
  );

  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );
  assert.ok(navigation);

  for (
    const roadId
    of navigation.roads.keys()
  ) {
    simulation.navigation
      .setDomainRoadEffect(
        "default",
        "gathering-return-block",
        roadId,
        { blocked: true }
      );
  }

  let workTicks = 0;
  while (
    job.phase === "working" &&
    workTicks < 4_000
  ) {
    simulation.gathering.step(
      0.25
    );
    workTicks += 1;
  }

  assert.ok(
    workTicks < 4_000,
    "gathering work should reach a terminal state"
  );
  assert.equal(
    job.phase,
    "failed"
  );
  assert.equal(
    job.failureReason,
    "cannot route worker back to deposit"
  );
  assert.equal(
    carried.quantityOf("iron-ore"),
    5,
    "successfully gathered output must not disappear when return routing fails"
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    0
  );
});

test("gathering never partially deposits output when storage fills during the trip back", () => {
  const simulation =
    createSmallTownScenario();
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );
  const carried =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "entity",
          id: "miner-01"
        },
        "carried"
      );

  assert.ok(storage);
  assert.ok(carried);

  const job =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  let ticks = 0;
  while (
    job.phase !== "returning" &&
    job.phase !== "failed" &&
    ticks < 4_000
  ) {
    stepSimulation(
      simulation,
      0.25
    );
    ticks += 1;
  }

  assert.equal(
    job.phase,
    "returning",
    job.failureReason ??
      undefined
  );
  assert.equal(
    carried.quantityOf("iron-ore"),
    5
  );

  assert.equal(
    storage.add(
      "iron-ore",
      78
    ).moved,
    78
  );

  let returnTicks = 0;
  while (
    job.phase === "returning" &&
    returnTicks < 4_000
  ) {
    stepSimulation(
      simulation,
      0.25
    );
    returnTicks += 1;
  }

  assert.ok(
    returnTicks < 4_000,
    "gathering return should reach a terminal state"
  );
  assert.equal(
    job.phase,
    "failed"
  );
  assert.equal(
    job.failureReason,
    "deposit could not accept complete gathering output"
  );
  assert.equal(
    storage.quantityOf("iron-ore"),
    78,
    "deposit must remain unchanged when the full gathering output cannot fit"
  );
  assert.equal(
    carried.quantityOf("iron-ore"),
    5,
    "the complete gathering output must remain with the worker"
  );
});

test("multiple workers gather the same permanent resource node concurrently", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );
  const ironNode =
    simulation.resources.getNode(
      SMALL_TOWN_RESOURCE_IDS.iron
    );

  assert.ok(endpoint);
  assert.ok(storage);
  assert.ok(ironNode);

  const workerIds = Array.from(
    { length: 6 },
    (_, index) =>
      `parallel-miner-${index + 1}`
  );

  for (
    const workerId
    of workerIds
  ) {
    simulation.world.addEntity({
      id: workerId,
      kind: "person",
      domainId: endpoint.domainId,
      position: endpoint.position,
      mobility:
        mobilityProfile(
          "pedestrian"
        )
    });

    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: workerId
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );
  }

  const runWave = () => {
    const jobs = workerIds.map(
      (workerEntityId) =>
        simulation.gathering.start({
          workerEntityId,
          resourceNodeId:
            SMALL_TOWN_RESOURCE_IDS.iron,
          depositPlaceId:
            SMALL_TOWN_IDS.mine
        })
    );

    assert.equal(
      jobs.every(
        (job) =>
          job.phase ===
          "travelling-to-resource"
      ),
      true
    );

    const deltaSeconds = 0.25;
    const maxTicks = 4_000;
    let ticks = 0;
    let maxSimultaneousWorkers = 0;

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

      const workingNow =
        jobs.filter(
          (job) =>
            job.phase === "working"
        ).length;

      maxSimultaneousWorkers =
        Math.max(
          maxSimultaneousWorkers,
          workingNow
        );

      ticks += 1;
    }

    assert.ok(
      ticks < maxTicks,
      "all concurrent gathering jobs should complete"
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
      maxSimultaneousWorkers > 1,
      "multiple workers must be able to work on the same resource node concurrently"
    );

    for (
      const workerId
      of workerIds
    ) {
      const carried =
        simulation.inventoryBindings
          .getInventory(
            {
              kind: "entity",
              id: workerId
            },
            "carried"
          );

      assert.ok(carried);
      assert.equal(
        carried.quantityOf("iron-ore"),
        0
      );
    }
  };

  runWave();

  assert.equal(
    storage.quantityOf("iron-ore"),
    30
  );
  assert.equal(
    ironNode.resourceTypeId,
    "iron",
    "gathering must not deplete or change the resource node"
  );

  runWave();

  assert.equal(
    storage.quantityOf("iron-ore"),
    60
  );
  assert.equal(
    ironNode.resourceTypeId,
    "iron",
    "the same permanent node must remain gatherable after repeated concurrent use"
  );

  simulation.resources
    .assertInternalConsistency();
  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
  simulation.world
    .assertInternalConsistency();
});


test("mine gathers multiple permanent ore resources into shared storage", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );
  const storage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
      );

  assert.ok(endpoint);
  assert.ok(storage);

  const assignments = [
    {
      workerId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      resourceTypeId: "iron",
      itemId: "iron-ore"
    },
    {
      workerId: "silver-miner",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.silver,
      resourceTypeId: "silver",
      itemId: "silver-ore"
    },
    {
      workerId: "gold-miner",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.gold,
      resourceTypeId: "gold",
      itemId: "gold-ore"
    },
    {
      workerId: "gem-miner",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.gemstone,
      resourceTypeId: "gemstone",
      itemId: "gemstone"
    }
  ] as const;

  for (
    const assignment
    of assignments.slice(1)
  ) {
    simulation.world.addEntity({
      id: assignment.workerId,
      kind: "person",
      domainId: endpoint.domainId,
      position: endpoint.position,
      mobility:
        mobilityProfile(
          "pedestrian"
        )
    });

    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: assignment.workerId
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );
  }

  const jobs = assignments.map(
    (assignment) =>
      simulation.gathering.start({
        workerEntityId:
          assignment.workerId,
        resourceNodeId:
          assignment.resourceNodeId,
        depositPlaceId:
          SMALL_TOWN_IDS.mine
      })
  );

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

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
    ticks += 1;
  }

  assert.ok(
    ticks < maxTicks,
    "all ore gathering jobs should complete"
  );

  for (const job of jobs) {
    assert.equal(
      job.phase,
      "complete",
      job.failureReason ??
        undefined
    );
  }

  for (
    const assignment
    of assignments
  ) {
    assert.equal(
      storage.quantityOf(
        assignment.itemId
      ),
      5
    );

    const node =
      simulation.resources.getNode(
        assignment.resourceNodeId
      );

    assert.ok(node);
    assert.equal(
      node.resourceTypeId,
      assignment.resourceTypeId,
      "gathering must not mutate permanent ore nodes"
    );
  }

  assert.equal(
    storage.slots.filter(
      (slot) =>
        slot.itemId !== null
    ).length,
    4,
    "four ore types should occupy four independent inventory slots"
  );
});
