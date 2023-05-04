import { middleware } from "../events/Middleware";
import { EntityWithPk, PrimaryKeyProps } from "../types";
import { Table } from "./createTable";
import { internalInsertMany } from "./insertMany";

/**
 * Inserts a new entity into `table`.
 *
 * @returns the primary key of the inserted entity.
 *
 * @example
 * const db = createDB();
 * const userTable = createTable<User>(db, "users")();
 * const aliceId = await insert(userTable, { id: uuid(), name: "Alice", age: 23 });
 * const bobId = await insert(userTable, { id: uuid(), name: "Bob", age: 45 });
 * const charlieId = await insert(userTable, { id: uuid(), name: "Charlie", age: 34 });
 */
export async function insert<T extends EntityWithPk<T>, P extends PrimaryKeyProps<T>>(
  table: Table<T, P>,
  entity: T
): Promise<T[P]> {
  return middleware<T, P, "insert">(
    table,
    { action: "insert", params: [table, entity] },
    (table, entity) => internalInsert(table, entity)
  );
}

export async function internalInsert<
  T extends EntityWithPk<T>,
  P extends PrimaryKeyProps<T>
>(table: Table<T, P>, entity: T): Promise<T[P]> {
  const ids = await internalInsertMany(table, [entity]);
  return ids[0];
}
