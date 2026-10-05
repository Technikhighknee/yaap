import assert from "node:assert/strict";
import test from "node:test";

import {
  mobilityProfile
} from "world-core";

import {
  createOwnerInventory,
  ownerInventoryId
} from "../src/inventory/owners.js";

import {
  createSmallTownScenario,
  SMALL_TOWN_IDS,
  SMALL_TOWN_INVENTORY_SPECS
} from "../src/scenarios/small-town.js";

test("small town foundry has separate storage and sales inventories", () => {
  const simulation =
    createSmallTownScenario();

  const owner = {
    kind: "place" as const,
    id: SMALL_TOWN_IDS.foundry
  };

  const storage =
    simulation.inventoryBindings
      .getInventory(
        owner,
        "storage"
      );
  const sales =
    simulation.inventoryBindings
      .getInventory(
        owner,
        "sales"
      );

  assert.ok(storage);
  assert.ok(sales);
  assert.notEqual(
    storage,
    sales
  );

  assert.equal(
    storage.id,
    ownerInventoryId(
      owner,
      "storage"
    )
  );
  assert.equal(
    sales.id,
    ownerInventoryId(
      owner,
      "sales"
    )
  );

  assert.equal(
    storage.slotCount,
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.storage.slotCount
  );
  assert.equal(
    storage.slotCapacity,
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.storage.slotCapacity
  );
  assert.equal(
    sales.slotCount,
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.sales.slotCount
  );
  assert.equal(
    sales.slotCapacity,
    SMALL_TOWN_INVENTORY_SPECS
      .foundry.sales.slotCapacity
  );

  storage.add(
    "iron",
    35
  );

  assert.deepEqual(
    storage.transferTo(
      sales,
      "iron",
      12
    ),
    {
      requested: 12,
      moved: 12,
      remainder: 0
    }
  );

  assert.equal(
    storage.quantityOf("iron"),
    23
  );
  assert.equal(
    sales.quantityOf("iron"),
    12
  );

  simulation.inventoryBindings
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
});

test("entity carried inventory is attached to a real world entity", () => {
  const simulation =
    createSmallTownScenario();

  simulation.world.addEntity({
    id: "worker",
    domainId: "default",
    position: {
      x: 88,
      y: 116
    },
    mobility:
      mobilityProfile("pedestrian")
  });

  const carried =
    createOwnerInventory(
      simulation,
      {
        kind: "entity",
        id: "worker"
      },
      "carried",
      {
        slotCount: 2,
        slotCapacity: 6
      }
    );

  assert.equal(
    carried.id,
    "entity:worker:carried"
  );

  carried.add(
    "iron",
    8
  );

  assert.deepEqual(
    carried.slots,
    [
      {
        itemId: "iron",
        quantity: 6
      },
      {
        itemId: "iron",
        quantity: 2
      }
    ]
  );

  assert.equal(
    simulation.inventoryBindings
      .getInventory(
        {
          kind: "entity",
          id: "worker"
        },
        "carried"
      ),
    carried
  );
});

test("owner inventory creation validates owners and channel uniqueness before allocation", () => {
  const simulation =
    createSmallTownScenario();

  const initialCount =
    simulation.inventories
      .inventories.size;

  assert.throws(
    () =>
      createOwnerInventory(
        simulation,
        {
          kind: "entity",
          id: "missing-worker"
        },
        "carried",
        {
          slotCount: 1,
          slotCapacity: 1
        }
      ),
    /unknown inventory entity owner/
  );

  assert.equal(
    simulation.inventories
      .inventories.size,
    initialCount
  );

  const owner = {
    kind: "place" as const,
    id: SMALL_TOWN_IDS.foundry
  };

  assert.throws(
    () =>
      createOwnerInventory(
        simulation,
        owner,
        "storage",
        {
          slotCount: 1,
          slotCapacity: 1
        }
      ),
    /inventory channel already bound/
  );

  assert.equal(
    simulation.inventories
      .inventories.size,
    initialCount
  );

  assert.throws(
    () =>
      simulation.inventoryBindings
        .bind(
          owner,
          "carried",
          "missing-inventory"
        ),
    /unknown inventory/
  );

  const beforeInvalidOwner =
    simulation.inventories
      .inventories.size;

  assert.throws(
    () =>
      simulation.inventoryBindings
        .createBoundInventory(
          {
            kind: "entity",
            id: ""
          },
          "carried",
          {
            id: "must-not-exist",
            slotCount: 1,
            slotCapacity: 1
          }
        ),
    /owner id must not be empty/
  );

  assert.equal(
    simulation.inventories
      .inventories.size,
    beforeInvalidOwner
  );

  const standalone =
    simulation.inventories.create({
      id: "standalone",
      slotCount: 1,
      slotCapacity: 1
    });

  simulation.inventoryBindings.bind(
    owner,
    "carried",
    standalone.id
  );

  assert.throws(
    () =>
      simulation.inventoryBindings
        .bind(
          {
            kind: "place",
            id: SMALL_TOWN_IDS.tavern
          },
          "storage",
          standalone.id
        ),
    /inventory already bound/
  );

  simulation.inventoryBindings
    .assertInternalConsistency();
});
