import { middleware } from "../events/Middleware";
import { EntityWithPk, PrimaryKeyProps } from "../types";
import { Table } from "./createTable";
import { internalUpsertMany } from "./upsertMany";

/**
 * Inserts an `entity` into `table`, or updates it if the given primary key already exists.
 *
 * @returns the primary key of the entity.
 *
 * @example
 * const db = createDB();
 * const userTable = createTable<User>(db, "users")();
 * const aliceId = await insert(userTable, { id: uuid(), name: "Alice", age: 23 });
 *
 * // This will update alice
 * await upsert(userTable, { id: aliceId, name: "Alice", age: 24 });
 * // This will create a new entity
 * await upsert(userTable, { id: uuid(), name: "Bob", age: 49 });
 */
export async function upsert<T extends EntityWithPk<T>, P extends PrimaryKeyProps<T>>(
  table: Table<T, P>,
  entity: T
): Promise<T[P]> {
  return middleware<T, P, "upsert">(
    table,
    { action: "upsert", params: [table, entity] },
    (table, entity) => internalUpsert(table, entity)
  );
}

export async function internalUpsert<
  T extends EntityWithPk<T>,
  P extends PrimaryKeyProps<T>
>(table: Table<T, P>, entity: T): Promise<T[P]> {
  const ids = await internalUpsertMany(table, [entity]);
  return ids[0];
}
