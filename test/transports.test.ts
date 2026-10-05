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

test("handcart carries foundry goods to the marketplace with its operator", () => {
  const simulation =
    createSmallTownScenario();

  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );
  assert.ok(navigation);

  const foundryStreet =
    navigation.nodes.get(
      "foundry-street"
    );
  const marketCenter =
    navigation.nodes.get(
      "market-center"
    );

  assert.ok(foundryStreet);
  assert.ok(marketCenter);

  simulation.world.addEntity({
    id: "carter",
    kind: "person",
    domainId: "default",
    position:
      foundryStreet.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const cart =
    simulation.transports.create({
      id: "foundry-handcart",
      definitionId: "handcart",
      domainId: "default",
      position:
        foundryStreet.position,
      operatorEntityId: "carter"
    });

  const cargo =
    simulation.transports.cargo(
      cart.id
    );
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
  assert.equal(
    cargo.slotCount,
    2
  );
  assert.equal(
    cargo.slotCapacity,
    20
  );

  storage.add("iron", 30);

  assert.deepEqual(
    storage.transferTo(
      cargo,
      "iron",
      25
    ),
    {
      requested: 25,
      moved: 25,
      remainder: 0
    }
  );

  assert.deepEqual(
    cargo.slots,
    [
      {
        itemId: "iron",
        quantity: 20
      },
      {
        itemId: "iron",
        quantity: 5
      }
    ]
  );

  assert.equal(
    simulation.transports
      .startJourney(
        cart.id,
        marketCenter.id
      ),
    true
  );

  const deltaSeconds = 0.25;
  const maxTicks = 2_000;
  let ticks = 0;

  while (
    simulation.world
      .getEntity(cart.id)
      ?.journey &&
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
    "handcart should reach the marketplace within the simulation limit"
  );

  const cartEntity =
    simulation.world
      .getEntity(cart.id);
  const operator =
    simulation.world
      .getEntity("carter");

  assert.ok(cartEntity);
  assert.ok(operator);

  assert.equal(
    cartEntity.domainId,
    "default"
  );
  assert.deepEqual(
    cartEntity.position,
    marketCenter.position
  );
  assert.equal(
    operator.domainId,
    cartEntity.domainId
  );
  assert.deepEqual(
    operator.position,
    cartEntity.position
  );

  assert.equal(
    cargo.quantityOf("iron"),
    25
  );
  assert.equal(
    storage.quantityOf("iron"),
    5
  );

  const operatorLocation =
    simulation.places
      .getEntityLocation(
        "carter"
      );

  assert.ok(operatorLocation);
  assert.deepEqual(
    operatorLocation.places,
    [SMALL_TOWN_IDS.marketplace]
  );

  simulation.transports
    .assertInternalConsistency();
  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
  simulation.world
    .assertInternalConsistency();
  simulation.navigation
    .assertInternalConsistency();
});

test("one entity cannot operate two transports", () => {
  const simulation =
    createSmallTownScenario();

  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );
  assert.ok(navigation);

  const node =
    navigation.nodes.get(
      "foundry-street"
    );
  assert.ok(node);

  simulation.world.addEntity({
    id: "carter",
    kind: "person",
    domainId: "default",
    position: node.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  simulation.transports.create({
    id: "cart-a",
    definitionId: "handcart",
    domainId: "default",
    position: node.position,
    operatorEntityId: "carter"
  });

  assert.throws(
    () =>
      simulation.transports.create({
        id: "cart-b",
        definitionId:
          "wheelbarrow",
        domainId: "default",
        position: node.position,
        operatorEntityId: "carter"
      }),
    /already operates transport/
  );

  assert.equal(
    simulation.transports
      .instances.size,
    1
  );
  assert.equal(
    simulation.world
      .getEntity("cart-b"),
    undefined
  );
});

test("a transport without an operator cannot start moving", () => {
  const simulation =
    createSmallTownScenario();

  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );
  assert.ok(navigation);

  const start =
    navigation.nodes.get(
      "foundry-street"
    );
  const destination =
    navigation.nodes.get(
      "market-center"
    );

  assert.ok(start);
  assert.ok(destination);

  const cart =
    simulation.transports.create({
      id: "idle-cart",
      definitionId: "ox-cart",
      domainId: "default",
      position: start.position
    });

  assert.equal(
    simulation.transports
      .cargo(cart.id)
      .slotCapacity,
    40
  );

  assert.throws(
    () =>
      simulation.transports
        .startJourney(
          cart.id,
          destination.id
        ),
    /has no operator/
  );
});


test("transport creation rejects prebound cargo before mutating the world", () => {
  const simulation =
    createSmallTownScenario();

  const navigation =
    simulation.navigation
      .navigationForDomain(
        "default"
      );
  assert.ok(navigation);

  const node =
    navigation.nodes.get(
      "foundry-street"
    );
  assert.ok(node);

  const standalone =
    simulation.inventories.create({
      id: "prebound-cargo",
      slotCount: 1,
      slotCapacity: 1
    });

  simulation.inventoryBindings.bind(
    {
      kind: "entity",
      id: "future-cart"
    },
    "cargo",
    standalone.id
  );

  assert.throws(
    () =>
      simulation.transports.create({
        id: "future-cart",
        definitionId: "handcart",
        domainId: "default",
        position: node.position
      }),
    /cargo channel already bound/
  );

  assert.equal(
    simulation.world
      .getEntity("future-cart"),
    undefined
  );
  assert.equal(
    simulation.transports
      .get("future-cart"),
    null
  );
});


test("iron moves from resource to mine to cart to foundry without entering the interior", () => {
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

  assert.ok(mineEndpoint);
  assert.ok(foundryEndpoint);
  assert.ok(mineStorage);
  assert.ok(foundryStorage);

  const gatheringJob =
    simulation.gathering.start({
      workerEntityId: "miner-01",
      resourceNodeId:
        SMALL_TOWN_RESOURCE_IDS.iron,
      depositPlaceId:
        SMALL_TOWN_IDS.mine
    });

  const deltaSeconds = 0.25;
  const maxTicks = 4_000;
  let gatheringTicks = 0;

  while (
    gatheringJob.phase !== "complete" &&
    gatheringJob.phase !== "failed" &&
    gatheringTicks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    gatheringTicks += 1;
  }

  assert.equal(
    gatheringJob.phase,
    "complete",
    gatheringJob.failureReason ??
      undefined
  );
  assert.equal(
    mineStorage.quantityOf("iron"),
    5
  );

  simulation.world.addEntity({
    id: "mine-carter",
    kind: "person",
    domainId: mineEndpoint.domainId,
    position: mineEndpoint.position,
    mobility:
      mobilityProfile("pedestrian")
  });

  const cart =
    simulation.transports.create({
      id: "mine-handcart",
      definitionId: "handcart",
      domainId: mineEndpoint.domainId,
      position: mineEndpoint.position,
      operatorEntityId: "mine-carter"
    });

  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        cart.id,
        SMALL_TOWN_IDS.mine
      ),
    true
  );

  assert.deepEqual(
    simulation.transfers
      .transferPlaceToEntity(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        SMALL_TOWN_IDS.mine,
        "storage",
        cart.id,
        "cargo",
        "iron",
        5
      ),
    {
      requested: 5,
      moved: 5,
      remainder: 0
    }
  );

  assert.equal(
    mineStorage.quantityOf("iron"),
    0
  );
  assert.equal(
    cargo.quantityOf("iron"),
    5
  );

  assert.equal(
    simulation.transports
      .startJourney(
        cart.id,
        foundryEndpoint
          .navigationNodeId
      ),
    true
  );

  let transportTicks = 0;

  while (
    simulation.world
      .getEntity(cart.id)
      ?.journey &&
    transportTicks < maxTicks
  ) {
    stepSimulation(
      simulation,
      deltaSeconds
    );
    transportTicks += 1;
  }

  assert.ok(
    transportTicks < maxTicks,
    "cart should reach the foundry"
  );

  const cartEntity =
    simulation.world
      .getEntity(cart.id);
  const operator =
    simulation.world
      .getEntity("mine-carter");

  assert.ok(cartEntity);
  assert.ok(operator);

  assert.equal(
    cartEntity.domainId,
    "default"
  );
  assert.equal(
    operator.domainId,
    "default"
  );
  assert.deepEqual(
    cartEntity.position,
    foundryEndpoint.position
  );
  assert.deepEqual(
    operator.position,
    foundryEndpoint.position
  );
  assert.ok(
    foundryEndpoint.position.y <
      115.5,
    "foundry loading target must remain outside the building footprint"
  );

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        cart.id,
        SMALL_TOWN_IDS.foundry
      ),
    true
  );

  assert.deepEqual(
    simulation.transfers
      .transferEntityToPlace(
        {
          world: simulation.world,
          inventoryBindings:
            simulation.inventoryBindings
        },
        cart.id,
        "cargo",
        SMALL_TOWN_IDS.foundry,
        "storage",
        "iron",
        5
      ),
    {
      requested: 5,
      moved: 5,
      remainder: 0
    }
  );

  assert.equal(
    cargo.quantityOf("iron"),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron"
    ),
    5
  );

  const foundry =
    simulation.places.getPlace(
      SMALL_TOWN_IDS.foundry
    );
  assert.ok(foundry);

  const foundryInteriorDomain =
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.foundry,
        "ground"
      );

  assert.notEqual(
    cartEntity.domainId,
    foundryInteriorDomain,
    "transport must remain outside the foundry interior while unloading"
  );
  assert.notEqual(
    operator.domainId,
    foundryInteriorDomain,
    "operator must not need to enter the foundry to unload the cart"
  );

  simulation.transports
    .assertInternalConsistency();
  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
});
