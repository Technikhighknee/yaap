import assert from "node:assert/strict";
import test from "node:test";

import {
  createOwnerInventory
} from "../src/inventory/owners.js";

import {
  SMALL_TOWN_IDS,
  createSmallTownScenario
} from "../src/scenarios/small-town.js";

function transferEnvironment(
  simulation:
    ReturnType<
      typeof createSmallTownScenario
    >
) {
  return {
    world: simulation.world,
    inventoryBindings:
      simulation.inventoryBindings
  };
}

test("character inside a place interior can transfer with that place inventory", () => {
  const simulation =
    createSmallTownScenario();

  const foundryDomain =
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.foundry,
        "ground"
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

  assert.ok(foundryDomain);
  assert.ok(foundryStorage);

  simulation.world.addEntity({
    id: "inside-smith",
    kind: "person",
    domainId: foundryDomain,
    position: {
      x: 5,
      y: 4
    }
  });

  const carried =
    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: "inside-smith"
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 20
      }
    );

  carried.add("iron", 7);

  assert.equal(
    simulation.places
      .getEntityLocation(
        "inside-smith"
      ),
    null,
    "transfer must use the entity's live semantic location, not require a pre-populated occupancy cache"
  );

  const liveLocation =
    simulation.places
      .locateEntity(
        simulation.world
          .getEntity(
            "inside-smith"
          )
      );

  assert.equal(
    liveLocation.semanticPlaces
      .includes(
        SMALL_TOWN_IDS.foundry
      ),
    true
  );

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        transferEnvironment(
          simulation
        ),
        "inside-smith",
        SMALL_TOWN_IDS.foundry
      ),
    true
  );

  assert.deepEqual(
    simulation.transfers
      .transferEntityToPlace(
        transferEnvironment(
          simulation
        ),
        "inside-smith",
        "carried",
        SMALL_TOWN_IDS.foundry,
        "storage",
        "iron",
        7
      ),
    {
      requested: 7,
      moved: 7,
      remainder: 0
    }
  );

  assert.equal(
    carried.quantityOf("iron"),
    0
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron"
    ),
    7
  );

  assert.deepEqual(
    simulation.transfers
      .transferPlaceToEntity(
        transferEnvironment(
          simulation
        ),
        SMALL_TOWN_IDS.foundry,
        "storage",
        "inside-smith",
        "carried",
        "iron",
        3
      ),
    {
      requested: 3,
      moved: 3,
      remainder: 0
    }
  );

  assert.equal(
    carried.quantityOf("iron"),
    3
  );
  assert.equal(
    foundryStorage.quantityOf(
      "iron"
    ),
    4
  );
});

test("character inside another interior cannot transfer with the foundry", () => {
  const simulation =
    createSmallTownScenario();

  const residenceDomain =
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.residence,
        "ground"
      );

  assert.ok(residenceDomain);

  simulation.world.addEntity({
    id: "inside-resident",
    kind: "person",
    domainId: residenceDomain,
    position: {
      x: 3.5,
      y: 3
    }
  });

  const carried =
    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: "inside-resident"
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );

  carried.add("iron", 1);

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        transferEnvironment(
          simulation
        ),
        "inside-resident",
        SMALL_TOWN_IDS.foundry
      ),
    false
  );

  assert.throws(
    () =>
      simulation.transfers
        .transferEntityToPlace(
          transferEnvironment(
            simulation
          ),
          "inside-resident",
          "carried",
          SMALL_TOWN_IDS.foundry,
          "storage",
          "iron",
          1
        ),
    /outside transfer range/
  );

  assert.equal(
    carried.quantityOf("iron"),
    1
  );
});

test("transport inside an interior does not receive character interior transfer access", () => {
  const simulation =
    createSmallTownScenario();

  const foundryDomain =
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.foundry,
        "ground"
      );

  assert.ok(foundryDomain);

  const cart =
    simulation.transports.create({
      id: "interior-cart",
      definitionId: "handcart",
      domainId: foundryDomain,
      position: {
        x: 5,
        y: 4
      }
    });
  const cargo =
    simulation.transports.cargo(
      cart.id
    );

  cargo.add("iron", 1);

  assert.equal(
    simulation.places
      .locateEntity(
        simulation.world
          .getEntity(cart.id)
      )
      .semanticPlaces
      .includes(
        SMALL_TOWN_IDS.foundry
      ),
    true,
    "the negative transfer result must come from transport semantics, not failed place location"
  );

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        transferEnvironment(
          simulation
        ),
        cart.id,
        SMALL_TOWN_IDS.foundry
      ),
    false
  );

  assert.throws(
    () =>
      simulation.transfers
        .transferEntityToPlace(
          transferEnvironment(
            simulation
          ),
          cart.id,
          "cargo",
          SMALL_TOWN_IDS.foundry,
          "storage",
          "iron",
          1
        ),
    /outside transfer range/
  );

  assert.equal(
    cargo.quantityOf("iron"),
    1
  );
});
