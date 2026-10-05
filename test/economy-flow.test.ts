import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  SMALL_TOWN_IDS,
  SMALL_TOWN_RESOURCE_IDS,
  createSmallTownScenario
} from "../src/scenarios/small-town.js";

import {
  stepSimulation
} from "../src/simulation.js";

function runUntil(
  simulation:
    ReturnType<
      typeof createSmallTownScenario
    >,
  done: () => boolean,
  label: string
): void {
  const deltaSeconds = 0.25;
  const maxTicks = 8_000;

  for (
    let tick = 0;
    tick < maxTicks;
    tick += 1
  ) {
    if (done()) {
      return;
    }

    stepSimulation(
      simulation,
      deltaSeconds
    );
  }

  assert.fail(
    `${label} did not finish within the simulation limit`
  );
}

test("iron resource becomes processed iron through gathering, hauling, and interior production", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

  const mineEndpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );
  const foundryEndpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.foundry
    );
  const mineStorage =
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "place",
          id: SMALL_TOWN_IDS.mine
        },
        "storage"
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
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(mineEndpoint);
  assert.ok(foundryEndpoint);
  assert.ok(mineStorage);
  assert.ok(foundryStorage);
  assert.ok(forge);

  const gathering =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  runUntil(
    simulation,
    () =>
      gathering.phase ===
        "complete" ||
      gathering.phase ===
        "failed",
    "gathering"
  );

  assert.equal(
    gathering.phase,
    "complete",
    gathering.failureReason ??
      undefined
  );
  assert.equal(
    mineStorage.quantityOf(
      "iron-ore"
    ),
    5
  );

  simulation.world.addEntity({
    id: "ore-carter",
    kind: "person",
    domainId:
      mineEndpoint.domainId,
    position:
      mineEndpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const cart =
    simulation.transports.create({
      id: "ore-cart",
      definitionId: "handcart",
      domainId:
        mineEndpoint.domainId,
      position:
        mineEndpoint.position,
      operatorEntityId:
        "ore-carter"
    });

  const hauling =
    simulation.hauling.start({
      transportId: cart.id,
      sourcePlaceId:
        SMALL_TOWN_IDS.mine,
      sourceChannel: "storage",
      targetPlaceId:
        SMALL_TOWN_IDS.foundry,
      targetChannel: "storage",
      manifest: [
        {
          itemId: "iron-ore",
          amount: 5
        }
      ]
    });

  runUntil(
    simulation,
    () =>
      hauling.phase ===
        "complete" ||
      hauling.phase ===
        "failed",
    "hauling"
  );

  assert.equal(
    hauling.phase,
    "complete",
    hauling.failureReason ??
      undefined
  );
  assert.equal(
    mineStorage.quantityOf(
      "iron-ore"
    ),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron-ore"
    ),
    5
  );

  foundryStorage.add(
    "charcoal",
    2
  );

  simulation.world.addEntity({
    id: "foundry-smith",
    kind: "person",
    domainId:
      foundryEndpoint.domainId,
    position:
      foundryEndpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const production =
    simulation.production.start({
      workerEntityId:
        "foundry-smith",
      placeId:
        SMALL_TOWN_IDS.foundry,
      recipeId: "smelt-iron"
    });

  runUntil(
    simulation,
    () =>
      production.phase ===
        "complete" ||
      production.phase ===
        "failed",
    "production"
  );

  assert.equal(
    production.phase,
    "complete",
    production.failureReason ??
      undefined
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron-ore"
    ),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "charcoal"
    ),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron"
    ),
    5
  );

  const smith =
    simulation.world.getEntity(
      "foundry-smith"
    );
  assert.ok(smith);

  assert.equal(
    smith.domainId,
    forge.domainId
  );
  assert.deepEqual(
    smith.position,
    forge.position
  );

  const smithLocation =
    simulation.places
      .locateEntity(smith);

  assert.equal(
    smithLocation.semanticPlaces
      .includes(
        SMALL_TOWN_IDS.foundry
      ),
    true
  );

  simulation.resources
    .assertInternalConsistency();
  simulation.transports
    .assertInternalConsistency();
  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
  simulation.places
    .assertInternalConsistency();
  simulation.world
    .assertInternalConsistency();
});
