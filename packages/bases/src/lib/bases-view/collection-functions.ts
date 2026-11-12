import { createFunction, findOperator, isEqual, VARARG } from "peaql";
import {
  contains,
  containsAll,
  containsAny,
  isTruthy,
  mapItems,
} from "./functions-core";

// Private Bases-dialect functions keep callback scopes and method spelling
// independent of the shared SQL function registry.
createFunction("bases_contains", [Object, Object], Boolean, (items, value) =>
  Array.isArray(items)
    ? items.some((item) => isEqual(item, value))
    : contains(items, value)
);
createFunction(
  "bases_containsAll",
  [Object, VARARG, Object],
  Boolean,
  (items, ...values) =>
    Array.isArray(items)
      ? values.every((value) => items.some((item) => isEqual(item, value)))
      : containsAll(items, ...values)
);
createFunction(
  "bases_containsAny",
  [Object, VARARG, Object],
  Boolean,
  (items, ...values) =>
    Array.isArray(items)
      ? values.some((value) => items.some((item) => isEqual(item, value)))
      : containsAny(items, ...values)
);

const columns = { bases_value: Object, bases_index: Number, bases_acc: Object };
type Resolvable = { resolve(context: unknown): any };

// Unlike list(existingList), a literal always constructs a new outer list.
// Expression-aware registration preserves null elements instead of applying
// SQL's scalar-function null propagation before the constructor runs.
createFunction(
  "bases_list",
  [VARARG, Object],
  [Object],
  (context, ...items: Resolvable[]) =>
    items.map((item) => item.resolve(context)),
  true,
  columns
);

createFunction(
  "bases_map",
  [Object, Object],
  [Object],
  (context, items: Resolvable, expression: Resolvable) =>
    mapItems(context, items, {
      resolve: (scope: any) =>
        expression.resolve({
          ...scope,
          bases_value: scope.value,
          bases_index: scope.index,
        }),
    }),
  true,
  columns
);

createFunction(
  "bases_filter",
  [Object, Object],
  [Object],
  (context, items: Resolvable, expression: Resolvable) => {
    const values = items.resolve(context);
    if (values == null) return null;
    return (Array.isArray(values) ? values : [values]).filter((value, index) =>
      isTruthy(
        expression.resolve({
          ...context,
          bases_value: value,
          bases_index: index,
        })
      )
    );
  },
  true,
  columns
);

createFunction(
  "bases_reduce",
  [Object, Object, Object],
  Object,
  (context, items: Resolvable, expression: Resolvable, initial: Resolvable) => {
    const values = items.resolve(context);
    if (values == null) return null;
    return (Array.isArray(values) ? values : [values]).reduce(
      (acc, value, index) =>
        expression.resolve({
          ...context,
          bases_value: value,
          bases_index: index,
          bases_acc: acc,
        }),
      initial.resolve(context)
    );
  },
  true,
  columns
);

for (const [name, operator] of [
  ["add", "+"],
  ["subtract", "-"],
  ["multiply", "*"],
  ["divide", "/"],
  ["modulo", "%"],
] as const) {
  createFunction(`bases_${name}`, [Object, Object], Object, (left, right) => {
    const operation = findOperator(operator, [left, right]);
    if (!operation)
      throw new Error(`Unsupported Bases callback operator: ${operator}`);
    return operation.operator(left, right);
  });
}
