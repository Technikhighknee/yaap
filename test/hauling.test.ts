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

  mineStorage.add("iron-ore", 5);
  foundryStorage.add("iron-ore", 80);

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
        manifest: [
          {
            itemId: "iron-ore",
            amount: 5
          }
        ]
      }),
    /target lacks requested manifest capacity/
  );

  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    cargo.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    simulation.world
      .getEntity(cart.id)
      ?.journey ??
      null,
    null
  );
  assert.equal(
    simulation.hauling.jobs.has(
      cart.id
    ),
    false
  );
});

test("hauling fails cleanly and keeps cargo when its operator entity disappears", () => {
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

  mineStorage.add("iron-ore", 5);

  const job =
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

  assert.equal(
    cargo.quantityOf("iron-ore"),
    5
  );
  assert.ok(
    simulation.world
      .getEntity(cart.id)
      ?.journey
  );

  assert.equal(
    simulation.world.removeEntity(
      "hauler"
    ),
    true
  );
  assert.equal(
    simulation.transports
      .get(cart.id)
      ?.operatorEntityId,
    null
  );

  const stoppedPosition = {
    ...simulation.world
      .getEntity(cart.id)!
      .position
  };

  stepSimulation(
    simulation,
    0.25
  );

  assert.equal(
    job.phase,
    "failed"
  );
  assert.equal(
    job.failureReason,
    "transport lost operator"
  );
  assert.equal(
    cargo.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    foundryStorage.quantityOf("iron-ore"),
    0
  );
  assert.deepEqual(
    simulation.world
      .getEntity(cart.id)
      ?.position,
    stoppedPosition
  );
});

test("hauling rolls cargo back when the route cannot start after loading", () => {
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
  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );

  assert.ok(navigation);

  mineStorage.add("iron-ore", 5);

  for (
    const roadId
    of navigation.roads.keys()
  ) {
    simulation.navigation
      .setDomainRoadEffect(
        "default",
        "hauling-route-block",
        roadId,
        { blocked: true }
      );
  }

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
        manifest: [
          {
            itemId: "iron-ore",
            amount: 5
          }
        ]
      }),
    /hauling route could not start/
  );

  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    cargo.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    foundryStorage.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    simulation.hauling.jobs.has(
      cart.id
    ),
    false
  );
  assert.equal(
    simulation.world
      .getEntity(cart.id)
      ?.journey ??
      null,
    null
  );
});

test("hauling never partially unloads a manifest whose cargo changed in transit", () => {
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

  mineStorage.add("iron-ore", 5);

  const job =
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

  cargo.remove("iron-ore", 1);

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
    "hauling job should reach a terminal state"
  );
  assert.equal(
    job.phase,
    "failed"
  );
  assert.equal(
    job.failureReason,
    "hauling cargo changed during transit"
  );
  assert.equal(
    cargo.quantityOf("iron-ore"),
    4
  );
  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    foundryStorage.quantityOf("iron-ore"),
    0,
    "an incomplete manifest must not be partially unloaded"
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

  mineStorage.add("iron-ore", 5);

  const job =
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

  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    0
  );
  assert.equal(
    cargo.quantityOf("iron-ore"),
    5
  );

  foundryStorage.add("iron-ore", 80);

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
    cargo.quantityOf("iron-ore"),
    5,
    "failed unloading must leave the complete load on the transport"
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron-ore"
    ),
    80
  );
});


test("hauling moves a mixed manifest in one trip", () => {
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

  const endpoint =
    simulation.transfers.get(
      SMALL_TOWN_IDS.mine
    );
  assert.ok(endpoint);

  simulation.world.addEntity({
    id: "mixed-hauler",
    kind: "person",
    domainId: endpoint.domainId,
    position: endpoint.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const cart =
    simulation.transports.create({
      id: "mixed-cart",
      definitionId: "ox-cart",
      domainId: endpoint.domainId,
      position: endpoint.position,
      operatorEntityId:
        "mixed-hauler"
    });

  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  mineStorage.add("iron-ore", 5);
  mineStorage.add("silver-ore", 5);
  mineStorage.add("gold-ore", 5);

  const job =
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
        },
        {
          itemId: "silver-ore",
          amount: 5
        },
        {
          itemId: "gold-ore",
          amount: 5
        }
      ]
    });

  assert.equal(
    cargo.quantityOf("iron-ore"),
    5
  );
  assert.equal(
    cargo.quantityOf("silver-ore"),
    5
  );
  assert.equal(
    cargo.quantityOf("gold-ore"),
    5
  );

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
    "mixed hauling job should complete"
  );
  assert.equal(
    job.phase,
    "complete",
    job.failureReason ??
      undefined
  );

  for (
    const itemId
    of ["iron-ore", "silver-ore", "gold-ore"]
  ) {
    assert.equal(
      cargo.quantityOf(itemId),
      0
    );
    assert.equal(
      foundryStorage.quantityOf(
        itemId
      ),
      5
    );
  }
});

test("hauling rejects a manifest that cannot fit across cargo slots without mutation", () => {
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

  assert.ok(mineStorage);

  const { cart } =
    createMineCart(simulation);
  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  mineStorage.add("iron-ore", 1);
  mineStorage.add("silver-ore", 1);
  mineStorage.add("gold-ore", 1);

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
        manifest: [
          {
            itemId: "iron-ore",
            amount: 1
          },
          {
            itemId: "silver-ore",
            amount: 1
          },
          {
            itemId: "gold-ore",
            amount: 1
          }
        ]
      }),
    /cargo lacks requested manifest capacity/
  );

  assert.equal(
    cargo.slots.every(
      (slot) =>
        slot.itemId === null
    ),
    true
  );
  assert.equal(
    mineStorage.quantityOf("iron-ore"),
    1
  );
  assert.equal(
    mineStorage.quantityOf("silver-ore"),
    1
  );
  assert.equal(
    mineStorage.quantityOf("gold-ore"),
    1
  );
});
