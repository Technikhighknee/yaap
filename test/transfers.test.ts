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

  const smith =
    simulation.world.getEntity(
      "inside-smith"
    );
  assert.ok(smith);

  const liveLocation =
    simulation.places
      .locateEntity(
        smith
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

test("interior character transfer does not require an exterior endpoint", () => {
  const simulation =
    createSmallTownScenario();

  const residenceDomain =
    simulation.places
      .getLayerDomain(
        SMALL_TOWN_IDS.residence,
        "ground"
      );

  assert.ok(residenceDomain);
  assert.equal(
    simulation.transfers.get(
      SMALL_TOWN_IDS.residence
    ),
    null
  );

  const residenceStorage =
    createOwnerInventory(
      simulation,
      {
        kind: "place",
        id: SMALL_TOWN_IDS.residence
      },
      "storage",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );

  simulation.world.addEntity({
    id: "resident-with-goods",
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
        id: "resident-with-goods"
      },
      "carried",
      {
        slotCount: 1,
        slotCapacity: 10
      }
    );

  carried.add("iron", 2);

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        transferEnvironment(
          simulation
        ),
        "resident-with-goods",
        SMALL_TOWN_IDS.residence
      ),
    true
  );

  const moved =
    simulation.transfers
      .transferEntityToPlace(
        transferEnvironment(
          simulation
        ),
        "resident-with-goods",
        "carried",
        SMALL_TOWN_IDS.residence,
        "storage",
        "iron",
        2
      );

  assert.equal(
    moved.moved,
    2
  );
  assert.equal(
    carried.quantityOf("iron"),
    0
  );
  assert.equal(
    residenceStorage.quantityOf(
      "iron"
    ),
    2
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

test("place transfer endpoints follow live placement and attachment changes", () => {
  const simulation =
    createSmallTownScenario();

  const original =
    simulation.transfers.get(
      SMALL_TOWN_IDS.foundry
    );

  assert.ok(original);
  assert.equal(
    original.navigationNodeId,
    "foundry-loading"
  );
  assert.deepEqual(
    original.position,
    { x: 88, y: 112 }
  );

  const cart =
    simulation.transports.create({
      id: "moving-place-cart",
      definitionId: "handcart",
      domainId: "default",
      position: original.position
    });

  assert.equal(
    simulation.transfers
      .canEntityTransfer(
        transferEnvironment(
          simulation
        ),
        cart.id,
        SMALL_TOWN_IDS.foundry
      ),
    true
  );

  simulation.places.setPlacement(
    SMALL_TOWN_IDS.foundry,
    {
      domainId: "default",
      containment: "footprint",
      transform: {
        x: 131,
        y: 115.5,
        rotation: 0,
        scale: 1
      }
    }
  );
  simulation.places.setAttachment(
    SMALL_TOWN_IDS.foundry,
    "loading",
    {
      domainId: "default",
      position: {
        x: 136,
        y: 116
      },
      nodeId: "town-hall-street"
    }
  );

  const moved =
    simulation.transfers.get(
      SMALL_TOWN_IDS.foundry
    );

  assert.ok(moved);
  assert.equal(
    moved.navigationNodeId,
    "town-hall-street"
  );
  assert.deepEqual(
    moved.position,
    { x: 136, y: 116 }
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
    false,
    "the old foundry transfer area must not survive a placement change"
  );

  simulation.world.setPosition(
    cart.id,
    moved.position
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
    true,
    "the transfer area must use the foundry's current placement"
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

  const cartEntity =
    simulation.world
      .getEntity(cart.id);
  assert.ok(cartEntity);

  assert.equal(
    simulation.places
      .locateEntity(
        cartEntity
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
