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
  const woodcutterEndpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.woodcutterCamp
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
  const woodcutterStorage =
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
  const charcoalKiln =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.woodcutterCamp,
      "charcoal-kiln"
    );
  const forge =
    simulation.places.resolveAnchor(
      SMALL_TOWN_IDS.foundry,
      "forge"
    );

  assert.ok(mineEndpoint);
  assert.ok(foundryEndpoint);
  assert.ok(woodcutterEndpoint);
  assert.ok(mineStorage);
  assert.ok(foundryStorage);
  assert.ok(woodcutterStorage);
  assert.ok(charcoalKiln);
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

  simulation.world.addEntity({
    id: "woodcutter",
    kind: "person",
    domainId:
      woodcutterEndpoint.domainId,
    position:
      woodcutterEndpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  createOwnerInventory(
    simulation,
    {
      kind: "entity",
      id: "woodcutter"
    },
    "carried",
    {
      slotCount: 1,
      slotCapacity: 10
    }
  );

  const woodGathering =
    simulation.gathering.start({
      workerEntityId: "woodcutter",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS
          .pinewood,
      depositPlaceId:
        SMALL_TOWN_IDS
          .woodcutterCamp
    });

  runUntil(
    simulation,
    () =>
      woodGathering.phase ===
        "complete" ||
      woodGathering.phase ===
        "failed",
    "wood gathering"
  );

  assert.equal(
    woodGathering.phase,
    "complete",
    woodGathering.failureReason ??
      undefined
  );
  assert.equal(
    woodcutterStorage.quantityOf(
      "pinewood"
    ),
    5
  );

  simulation.world.addEntity({
    id: "charcoal-burner",
    kind: "person",
    domainId:
      woodcutterEndpoint.domainId,
    position:
      woodcutterEndpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const charcoalProduction =
    simulation.production.start({
      workerEntityId:
        "charcoal-burner",
      placeId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      recipeId: "burn-pine-charcoal"
    });

  runUntil(
    simulation,
    () =>
      charcoalProduction.phase ===
        "complete" ||
      charcoalProduction.phase ===
        "failed",
    "charcoal production"
  );

  assert.equal(
    charcoalProduction.phase,
    "complete",
    charcoalProduction
      .failureReason ??
      undefined
  );
  assert.equal(
    woodcutterStorage.quantityOf(
      "pinewood"
    ),
    0
  );
  assert.equal(
    woodcutterStorage.quantityOf(
      "charcoal"
    ),
    2
  );

  const charcoalBurner =
    simulation.world.getEntity(
      "charcoal-burner"
    );
  assert.ok(charcoalBurner);
  assert.equal(
    charcoalBurner.domainId,
    charcoalKiln.domainId
  );
  assert.deepEqual(
    charcoalBurner.position,
    charcoalKiln.position
  );

  simulation.world.addEntity({
    id: "charcoal-carter",
    kind: "person",
    domainId:
      woodcutterEndpoint.domainId,
    position:
      woodcutterEndpoint.position,
    mobility:
      mobilityProfile(
        "pedestrian"
      )
  });

  const charcoalCart =
    simulation.transports.create({
      id: "charcoal-cart",
      definitionId: "handcart",
      domainId:
        woodcutterEndpoint.domainId,
      position:
        woodcutterEndpoint.position,
      operatorEntityId:
        "charcoal-carter"
    });

  const charcoalHauling =
    simulation.hauling.start({
      transportId:
        charcoalCart.id,
      sourcePlaceId:
        SMALL_TOWN_IDS
          .woodcutterCamp,
      sourceChannel: "storage",
      targetPlaceId:
        SMALL_TOWN_IDS.foundry,
      targetChannel: "storage",
      manifest: [
        {
          itemId: "charcoal",
          amount: 2
        }
      ]
    });

  runUntil(
    simulation,
    () =>
      charcoalHauling.phase ===
        "complete" ||
      charcoalHauling.phase ===
        "failed",
    "charcoal hauling"
  );

  assert.equal(
    charcoalHauling.phase,
    "complete",
    charcoalHauling.failureReason ??
      undefined
  );
  assert.equal(
    woodcutterStorage.quantityOf(
      "charcoal"
    ),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "charcoal"
    ),
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

  simulation.production
    .assertInternalConsistency();
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
