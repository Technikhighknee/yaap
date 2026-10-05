import assert from "node:assert/strict";
import test from "node:test";

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
    storage.quantityOf("iron"),
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
    carried.quantityOf("iron"),
    0
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
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

  simulation.world.addEntity({
    id: "courier",
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position
  });

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
  carried.add("iron", 7);

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
        "iron",
        7
      );

  assert.equal(result.moved, 7);
  assert.equal(
    carried.quantityOf("iron"),
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
      "iron"
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
