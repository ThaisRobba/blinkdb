import { BlinkKey, Table } from "../core";
import { PrimaryKeyIndexable, PrimaryKeyProps } from "../query/types";
import {
  Hook,
  HookAction,
  HookContext,
  HookMethods,
  HookParams,
  HookReturn,
} from "./types";

/**
 * Execute all hooks.
 *
 * @param hooks the list of hooks to execute. The first item in the list will be executed first.
 * @param context the context to supply to the hooks.
 * @param impl the implementation that will be called if the last hook calls `next()`.
 */
export function middleware<
  T extends PrimaryKeyIndexable<T> = any,
  P extends PrimaryKeyProps<T> = PrimaryKeyProps<T>,
  A extends HookAction = HookAction
>(
  hooks: Hook<T, P, A>[],
  context: Omit<HookContext<T, P, A>, "next">,
  impl: (
    ...params: HookParams<T, P, A>
  ) => ReturnType<HookMethods<T, P>[A]> | Awaited<ReturnType<HookMethods<T, P>[A]>>
): HookReturn<T, P, A> | Promise<HookReturn<T, P, A>>;

/**
 * Execute all hooks for a given table (and its database).
 * Hooks will be loaded from the database of the table + the table itself.
 *
 * @param table the table to execute hooks for.
 * @param context the context to supply to the hooks.
 * @param impl the implementation that will be called if the last hook calls `next()`.
 */
export function middleware<
  T extends PrimaryKeyIndexable<T> = any,
  P extends PrimaryKeyProps<T> = PrimaryKeyProps<T>,
  A extends HookAction = HookAction
>(
  table: Table<T, P>,
  context: Omit<HookContext<T, P, A>, "next" | "table">,
  impl: (...params: HookParams<T, P, A>) => ReturnType<HookMethods<T, P>[A]>
): HookReturn<T, P, A> | Promise<HookReturn<T, P, A>>;

export function middleware<
  T extends PrimaryKeyIndexable<T> = any,
  P extends PrimaryKeyProps<T> = PrimaryKeyProps<T>,
  A extends HookAction = HookAction
>(
  hooksOrTable: Hook<T, P, A>[] | Table<T, P>,
  context: Omit<HookContext<T, P, A>, "next" | "table"> & { table?: string },
  impl: (
    ...params: HookParams<T, P, A>
  ) => ReturnType<HookMethods<T, P>[A]> | Awaited<ReturnType<HookMethods<T, P>[A]>>
): HookReturn<T, P, A> | Promise<HookReturn<T, P, A>> {
  let contextTable = context.table;
  let hooks: Hook<T, P, A>[];
  if (Array.isArray(hooksOrTable)) {
    hooks = hooksOrTable;
  } else {
    const table = hooksOrTable;
    const dbHooks = table[BlinkKey].db[BlinkKey].hooks;
    const tableHooks = table[BlinkKey].hooks;
    hooks = [...dbHooks, ...tableHooks];
    contextTable = table[BlinkKey].tableName;
  }

  return executeHook(hooks, { ...context, table: contextTable! }, impl);
}

function executeHook<
  T extends PrimaryKeyIndexable<T> = any,
  P extends PrimaryKeyProps<T> = PrimaryKeyProps<T>,
  A extends HookAction = HookAction
>(
  hooks: Hook<T, P, A>[],
  context: Omit<HookContext<T, P, A>, "next">,
  impl: (...params: HookParams<T, P, A>) => ReturnType<HookMethods<T, P>[A]>
): HookReturn<T, P, A> | Promise<HookReturn<T, P, A>> {
  const [step, ...next] = hooks;
  return step
    ? step({
        ...context,
        next: (...args: HookParams<T, P, A>) =>
          executeHook(next, { ...context, params: args }, impl),
      })
    : (impl(...context.params) as any);
}
