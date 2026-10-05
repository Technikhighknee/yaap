import assert from "node:assert/strict";
import test from "node:test";

import {
  InventoryRegistry
} from "../src/inventory/registry.js";
import {
  ItemRegistry
} from "../src/items/registry.js";
import {
  createSimulation
} from "../src/simulation.js";

function createItems(): ItemRegistry {
  const items = new ItemRegistry();

  items.register({ id: "iron" });
  items.register({ id: "gold" });
  items.register({ id: "cattle" });

  return items;
}

test("items have identical inventory cost", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  const ironInventory =
    inventories.create({
      id: "iron-inventory",
      slotCount: 1,
      slotCapacity: 4
    });

  const cattleInventory =
    inventories.create({
      id: "cattle-inventory",
      slotCount: 1,
      slotCapacity: 4
    });

  assert.deepEqual(
    ironInventory.add(
      "iron",
      5
    ),
    {
      requested: 5,
      moved: 4,
      remainder: 1
    }
  );

  assert.deepEqual(
    cattleInventory.add(
      "cattle",
      5
    ),
    {
      requested: 5,
      moved: 4,
      remainder: 1
    }
  );

  assert.deepEqual(
    ironInventory.slots,
    [
      {
        itemId: "iron",
        quantity: 4
      }
    ]
  );

  assert.deepEqual(
    cattleInventory.slots,
    [
      {
        itemId: "cattle",
        quantity: 4
      }
    ]
  );
});

test("inventory fills existing stacks before opening a free slot", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  const inventory =
    inventories.create({
      id: "store",
      slotCount: 3,
      slotCapacity: 4
    });

  assert.equal(
    inventory.add(
      "iron",
      6
    ).moved,
    6
  );

  assert.deepEqual(
    inventory.slots,
    [
      {
        itemId: "iron",
        quantity: 4
      },
      {
        itemId: "iron",
        quantity: 2
      },
      {
        itemId: null,
        quantity: 0
      }
    ]
  );

  assert.equal(
    inventory.remainingCapacity(
      "iron"
    ),
    6
  );
  assert.equal(
    inventory.remainingCapacity(
      "gold"
    ),
    4
  );

  assert.equal(
    inventory.add(
      "iron",
      3
    ).moved,
    3
  );

  assert.deepEqual(
    inventory.slots,
    [
      {
        itemId: "iron",
        quantity: 4
      },
      {
        itemId: "iron",
        quantity: 4
      },
      {
        itemId: "iron",
        quantity: 1
      }
    ]
  );

  assert.equal(
    inventory.remainingCapacity(
      "gold"
    ),
    0
  );
});

test("removing items frees slots for another item type", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  const inventory =
    inventories.create({
      id: "store",
      slotCount: 2,
      slotCapacity: 4
    });

  inventory.add("iron", 6);

  assert.deepEqual(
    inventory.remove(
      "iron",
      2
    ),
    {
      requested: 2,
      moved: 2,
      remainder: 0
    }
  );

  assert.deepEqual(
    inventory.slots,
    [
      {
        itemId: "iron",
        quantity: 4
      },
      {
        itemId: null,
        quantity: 0
      }
    ]
  );

  assert.equal(
    inventory.add(
      "gold",
      3
    ).moved,
    3
  );

  assert.deepEqual(
    inventory.slots,
    [
      {
        itemId: "iron",
        quantity: 4
      },
      {
        itemId: "gold",
        quantity: 3
      }
    ]
  );
});

test("transfer moves only what the target can accept without losing items", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  const source =
    inventories.create({
      id: "source",
      slotCount: 2,
      slotCapacity: 4
    });

  const target =
    inventories.create({
      id: "target",
      slotCount: 1,
      slotCapacity: 2
    });

  source.add("iron", 6);

  assert.deepEqual(
    source.transferTo(
      target,
      "iron",
      5
    ),
    {
      requested: 5,
      moved: 2,
      remainder: 3
    }
  );

  assert.equal(
    source.quantityOf("iron"),
    4
  );
  assert.equal(
    target.quantityOf("iron"),
    2
  );

  assert.deepEqual(
    source.transferTo(
      target,
      "iron",
      4
    ),
    {
      requested: 4,
      moved: 0,
      remainder: 4
    }
  );

  assert.equal(
    source.quantityOf("iron"),
    4
  );
  assert.equal(
    target.quantityOf("iron"),
    2
  );

  inventories
    .assertInternalConsistency();
});

test("inventory rejects capacities whose total cannot be represented safely", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  assert.throws(
    () =>
      inventories.create({
        id: "impossible",
        slotCount:
          Number.MAX_SAFE_INTEGER,
        slotCapacity: 2
      }),
    /total capacity must be a safe integer/
  );
});

test("inventory rejects unknown items and invalid amounts", () => {
  const items = createItems();
  const inventories =
    new InventoryRegistry(items);

  const inventory =
    inventories.create({
      id: "store",
      slotCount: 2,
      slotCapacity: 4
    });

  assert.throws(
    () =>
      inventory.add(
        "unknown",
        1
      ),
    /unknown item definition/
  );

  assert.throws(
    () =>
      inventory.add(
        "iron",
        0
      ),
    /positive safe integer/
  );

  assert.throws(
    () =>
      inventory.remove(
        "iron",
        -1
      ),
    /positive safe integer/
  );

  assert.throws(
    () =>
      inventories.create({
        id: "store",
        slotCount: 1,
        slotCapacity: 1
      }),
    /already exists/
  );
});

test("simulation exposes item and inventory registries without conflating resources with items", () => {
  const simulation =
    createSimulation();

  assert.ok(
    simulation.items
      .definitions.size > 0
  );
  assert.ok(
    simulation.items.get("iron")
  );
  assert.ok(
    simulation.resources
      .resourceTypes.has("iron")
  );
  assert.notEqual(
    simulation.items.get("iron"),
    simulation.resources
      .resourceTypes.get("iron")
  );
  assert.equal(
    simulation.inventories
      .inventories.size,
    0
  );
  assert.ok(
    simulation.resources
      .resourceTypes.size > 0
  );

  simulation.items
    .assertInternalConsistency();
  simulation.inventories
    .assertInternalConsistency();
});
