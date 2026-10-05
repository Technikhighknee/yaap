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

test("woodcutter camp is an exterior place with shared storage for both wood resources", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const camp =
    simulation.places.getPlace(
      SMALL_TOWN_IDS.woodcutterCamp
    );
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

  assert.ok(camp);
  assert.ok(endpoint);
  assert.ok(storage);

  assert.equal(
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.woodcutterCamp,
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
        SMALL_TOWN_IDS
          .woodcutterCamp
    ),
    false
  );

  const workers = [
    {
      id: "pine-cutter",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS
          .pinewood,
      itemId: "pinewood"
    },
    {
      id: "oak-cutter",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS
          .oakwood,
      itemId: "oakwood"
    }
  ] as const;

  for (const worker of workers) {
    simulation.world.addEntity({
      id: worker.id,
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
        id: worker.id
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );
  }

  const jobs = workers.map(
    (worker) =>
      simulation.gathering.start({
        workerEntityId: worker.id,
        resourceNodeId:
          worker.resourceNodeId,
        depositPlaceId:
          SMALL_TOWN_IDS
            .woodcutterCamp
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
    "both woodcutters should complete"
  );

  for (const job of jobs) {
    assert.equal(
      job.phase,
      "complete",
      job.failureReason ??
        undefined
    );
  }

  assert.equal(
    storage.quantityOf("pinewood"),
    5
  );
  assert.equal(
    storage.quantityOf("oakwood"),
    5
  );

  for (const worker of workers) {
    const carried =
      simulation.inventoryBindings
        .getInventory(
          {
            kind: "entity",
            id: worker.id
          },
          "carried"
        );

    assert.ok(carried);
    assert.equal(
      carried.quantityOf(
        worker.itemId
      ),
      0
    );
  }

  simulation.resources
    .assertInternalConsistency();
  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
  simulation.world
    .assertInternalConsistency();
});
