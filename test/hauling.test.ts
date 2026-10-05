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

function createMineCart(
  simulation:
    ReturnType<
      typeof createSmallTownScenario
    >
) {
  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );

  assert.ok(endpoint);

  simulation.world.addEntity({
    id: "hauler",
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const cart =
    simulation.transports.create({
      id: "haul-cart",
      definitionId: "handcart",
      domainId: endpoint.domainId,
      position: endpoint.position,
      operatorEntityId: "hauler"
    });

  return {
    cart,
    endpoint
  };
}

test("hauling start validation does not mutate inventories", () => {
  const simulation =
    createSmallTownScenario();
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

  assert.ok(mineStorage);
  assert.ok(foundryStorage);

  const { cart } =
    createMineCart(simulation);
  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  mineStorage.add("iron", 5);
  foundryStorage.add("iron", 80);

  assert.throws(
    () =>
      simulation.hauling.start({
        transportId: cart.id,
        sourcePlaceId:
          SMALL_TOWN_IDS.mine,
        sourceChannel: "storage",
        targetPlaceId:
          SMALL_TOWN_IDS.foundry,
        targetChannel: "storage",
        itemId: "iron",
        amount: 5
      }),
    /target lacks requested capacity/
  );

  assert.equal(
    mineStorage.quantityOf("iron"),
    5
  );
  assert.equal(
    cargo.quantityOf("iron"),
    0
  );
  assert.equal(
    simulation.world
      .getEntity(cart.id)
      ?.journey,
    null
  );
  assert.equal(
    simulation.hauling.jobs.has(
      cart.id
    ),
    false
  );
});

test("hauling keeps the full cargo when target capacity disappears in transit", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world
    .configureLocalSteering({
      enabled: true
    });

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

  assert.ok(mineStorage);
  assert.ok(foundryStorage);

  const { cart } =
    createMineCart(simulation);
  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  mineStorage.add("iron", 5);

  const job =
    simulation.hauling.start({
      transportId: cart.id,
      sourcePlaceId:
        SMALL_TOWN_IDS.mine,
      sourceChannel: "storage",
      targetPlaceId:
        SMALL_TOWN_IDS.foundry,
      targetChannel: "storage",
      itemId: "iron",
      amount: 5
    });

  assert.equal(
    mineStorage.quantityOf("iron"),
    0
  );
  assert.equal(
    cargo.quantityOf("iron"),
    5
  );

  foundryStorage.add("iron", 80);

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let ticks = 0;

  while (
    job.phase === "travelling" &&
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
    "hauling job should reach its target"
  );
  assert.equal(
    job.phase,
    "failed"
  );
  assert.match(
    job.failureReason ?? "",
    /no longer has capacity/
  );
  assert.equal(
    job.deliveredAmount,
    0
  );
  assert.equal(
    cargo.quantityOf("iron"),
    5,
    "failed unloading must leave the complete load on the transport"
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron"
    ),
    80
  );
});
