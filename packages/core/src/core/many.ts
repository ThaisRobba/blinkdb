import { filterWhereItems } from "../query/filter";
import { selectWhereFilterItems } from "../query/select";
import { Filter } from "../query/types";
import { SyncKey } from "./createDB";
import { SyncTable } from "./table";

/**
 * Retrieve all entities from `table`.
 *
 * @example
 * const db = createDB();
 * const userTable = table<User>(db, "users")();
 * const allUsers = many(userTable);
 */
export async function many<T, P extends keyof T>(
  table: SyncTable<T, P>
): Promise<T[]>;

/**
 * Retrieve all entities from `table` that match the given `filter`.
 *
 * @example
 * const db = createDB();
 * const userTable = table<User>(db, "users")();
 * // All users called 'Alice'
 * const allUsersNamedAlice = many(userTable, {
 *   where: {
 *     name: "Alice"
 *   }
 * });
 * // All users aged 25 and up
 * const allUsersOlderThan25 = many(userTable, {
 *   where: {
 *     age: gt(25)
 *   }
 * });
 */
export async function many<T, P extends keyof T>(
  table: SyncTable<T, P>,
  filter: Filter<T>
): Promise<T[]>;

export async function many<T, P extends keyof T>(
  table: SyncTable<T, P>,
  filter?: Filter<T>
): Promise<T[]> {
  if (!filter) {
    return table[SyncKey].storage.primary.valuesArray();
  }

  let items: T[] = [];

  if (filter.where) {
    // Select items from the db
    let possibleItems = await selectWhereFilterItems(table, filter.where);
    if(possibleItems) {
      // In case the where filter returned all items, success!
      items = possibleItems;
    } else {
      // In case null is returned, a full table scan is required
      items = table[SyncKey].storage.primary.valuesArray();
    }

    // Filter items
    items = filterWhereItems(items, filter.where);
  }

  return items;
}
