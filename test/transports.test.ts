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
