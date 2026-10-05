import type {
  ItemDefinition,
  ItemId
} from "./types.js";

function assertNonEmptyString(
  value: string,
  label: string
): void {
  if (value.length === 0) {
    throw new TypeError(
      `${label} must not be empty`
    );
  }
}

export class ItemRegistry {
  readonly definitions =
    new Map<
      ItemId,
      Readonly<ItemDefinition>
    >();

  register(
    definition: ItemDefinition
  ): Readonly<ItemDefinition> {
    assertNonEmptyString(
      definition.id,
      "item definition id"
    );

    if (
      this.definitions.has(
        definition.id
      )
    ) {
      throw new Error(
        `item definition already registered: ${definition.id}`
      );
    }

    const canonical =
      Object.freeze({
        id: definition.id
      });

    this.definitions.set(
      canonical.id,
      canonical
    );

    return canonical;
  }

  get(
    id: ItemId
  ): Readonly<ItemDefinition> | null {
    return (
      this.definitions.get(id) ??
      null
    );
  }

  require(
    id: ItemId
  ): Readonly<ItemDefinition> {
    const definition =
      this.definitions.get(id);

    if (!definition) {
      throw new Error(
        `unknown item definition: ${id}`
      );
    }

    return definition;
  }

  assertInternalConsistency(): {
    itemDefinitionCount: number;
  } {
    for (
      const [
        id,
        definition
      ] of this.definitions
    ) {
      if (
        id !== definition.id ||
        id.length === 0
      ) {
        throw new Error(
          `invalid item definition registry entry: ${id}`
        );
      }
    }

    return {
      itemDefinitionCount:
        this.definitions.size
    };
  }
}
