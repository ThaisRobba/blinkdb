import { OrdProps } from "../query/types";
import { clone } from "./clone";
import { BlinkKey } from "./createDB";
import { Table } from "./createTable";

/**
 * Saves updates of the given `entity` in `table`.
 *
 * @throws if the entity has not been inserted into the table before, e.g. if the primary key of the entity was not found.
 *
 * @example
 * const db = createDB();
 * const userTable = createTable<User>(db, "users")();
 * const userId = await insert(userTable, { id: uuid(), name: 'Alice', age: 15 });
 * // Increase the age of Alice
 * await update(userTable, { id: userId, age: 16 });
 */
export async function update<T extends object, P extends keyof T>(
  table: Table<T, P>,
  diff: Diff<T, P>
): Promise<void> {
  const primaryKeyProperty = table[BlinkKey].options.primary;
  const primaryKey = diff[primaryKeyProperty] as T[P] & OrdProps;

  if (primaryKey === undefined || primaryKey === null) {
    throw new Error(`"${primaryKey}" is an invalid primary key value.`);
  }

  const item = table[BlinkKey].storage.primary.get(primaryKey);

  if (item === undefined || item === null) {
    throw new Error(`Item with primary key "${primaryKey}" not found.`);
  }

  const oldItem = clone(item);

  let key: keyof Diff<T, P>;
  for (key in diff) {
    if (key !== primaryKeyProperty) {
      item[key] = diff[key];
      if (oldItem[key] !== item[key]) {
        const btree = table[BlinkKey].storage.indexes[key as keyof T];
        if (btree !== undefined) {
          let oldIndexItems = btree.get(oldItem[key] as T[typeof key] & OrdProps)!;
          const arrayIndex = oldIndexItems.indexOf(item);
          // This condition is only false if clone is disabled and the user changed the indexed property without calling update
          if (arrayIndex !== -1) {
            oldIndexItems.splice(arrayIndex, 1);
          }

          const newIndexItems = btree.get(item[key] as T[typeof key] & OrdProps);
          if (newIndexItems !== undefined) {
            newIndexItems.push(item);
          } else {
            btree.set(item[key] as T[typeof key] & OrdProps, [item]);
          }
        }
      }
    }
  }

  table[BlinkKey].events.onUpdate.dispatch([{ oldEntity: oldItem, newEntity: item }]);
}

export type Diff<T extends object, P extends keyof T> = Partial<T> & {
  [Key in P]-?: T[P];
};
