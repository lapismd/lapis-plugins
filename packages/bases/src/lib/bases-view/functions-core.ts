import { startCase, toLower } from "lodash-es";
import { DateTime, Duration } from "luxon";
import { Decimal, isNull, parseDuration } from "peaql";

export function isEmpty(obj: unknown) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === "string") {
    return obj.length == 0;
  } else if (Array.isArray(obj)) {
    return obj.length == 0;
  } else if (typeof obj === "number" || obj instanceof Decimal) {
    return false;
  } else if (
    typeof obj === "object" &&
    !(obj instanceof Date) &&
    !(obj instanceof DateTime) &&
    !(obj instanceof Duration)
  ) {
    return Object.keys(obj).length === 0;
  }
  return false;
}

export function isTruthy(value: unknown) {
  return Boolean(value instanceof Decimal ? value.number : value);
}

export function valueToString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function startsWith(source: string, value: string) {
  return source.startsWith(value);
}

export function endsWith(source: string, value: string) {
  return source.endsWith(value);
}

export function contains(source: string, value: string) {
  source = (source || "").toLowerCase();
  return source.includes(value.toLowerCase());
}

export function containsAnyOf(source: string, ...values: Array<string>) {
  source = (source || "").toLowerCase();
  return values.some((v) => source.includes(v.toLowerCase()));
}

export function containsAny(source: string, ...values: Array<string>) {
  return containsAnyOf(source, ...values);
}

export function containsAllOf(source: string, ...values: Array<string>) {
  source = (source || "").toLowerCase();
  return values.every((v) => source.includes(v.toLowerCase()));
}

export function containsAll(source: string, ...values: Array<string>) {
  return containsAllOf(source, ...values);
}

export function length(obj: unknown) {
  if (isNull(obj)) return 0;
  if (Array.isArray(obj)) {
    return obj.length;
  } else if (typeof obj === "string") {
    return obj.length;
  } else if (typeof obj === "object") {
    return Object.keys(obj as any).length;
  }
  return (obj as any).toString().length;
}

export function title(str: string) {
  return startCase(toLower(str));
}

export function trim(value: string) {
  return value.trim();
}

export function split(
  value: string,
  separator: string | RegExp,
  limit?: number
) {
  return value.split(separator, limit);
}

export function replace(value: string, search: string, replacement: string) {
  return value.replaceAll(search, replacement);
}

export function repeat(value: string, count: number) {
  return value.repeat(count);
}

export function reverseString(value: string) {
  return [...value].reverse().join("");
}

export function reverseList<T>(value: T[]) {
  return [...value].reverse();
}

export function sliceString(value: string, start: number, end?: number) {
  return value.slice(start, end);
}

export function sliceList<T>(value: T[], start: number, end?: number) {
  return value.slice(start, end);
}

export function ceil(value: number) {
  return Math.ceil(value);
}

export function floor(value: number) {
  return Math.floor(value);
}

export function list<T>(value: T[]): T[];
export function list<T>(...value: T[]): T[];
export function list(...value: unknown[]): unknown[] {
  return value.length === 1 && Array.isArray(value[0]) ? value[0] : value;
}

export function number(value: unknown) {
  if (value instanceof DateTime) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type Resolvable = {
  resolve(context: any): any;
};
export function max(...value: number[]) {
  return Math.max(...value);
}

export function min(...value: number[]) {
  return Math.min(...value);
}

export function random() {
  return Math.random();
}

export function flat<T>(value: T[]) {
  return value.flat();
}

export function join(value: unknown[], separator = ",") {
  return value.join(separator);
}

export function sortList<T>(value: T[]) {
  return [...value].sort((left, right) => {
    if (typeof left === "number" && typeof right === "number") {
      return left - right;
    }
    return String(left).localeCompare(String(right));
  });
}

export function unique<T>(value: T[]) {
  return [...new Set(value)];
}

export function escapeHTML(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function date(value: string | number | Date | DateTime) {
  if (value instanceof DateTime) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === "number") return DateTime.fromMillis(value);
  const iso = DateTime.fromISO(value);
  return iso.isValid ? iso : DateTime.fromSQL(value);
}

export function duration(value: string | number | Duration) {
  if (value instanceof Duration) return value;
  if (typeof value === "number") return Duration.fromMillis(value);
  const iso = Duration.fromISO(value);
  if (iso.isValid) return iso;
  // Preserve ISO durations while keeping Bases' case-sensitive M (month)
  // distinct from m (minute) in the native interval parser.
  return parseDuration(
    value
      .replace(/(\d)\s*M(?=$|[^a-zA-Z])/g, "$1 months")
      .replace(/(\d)\s*w(?=$|[^a-zA-Z])/g, "$1 weeks")
  );
}

export function html(value: string) {
  return value;
}

export function image(value: string) {
  return value;
}

export function link(value: string) {
  return value;
}

export function isType(value: unknown, type: string) {
  switch (type.toLowerCase()) {
    case "null":
      return value === null || value === undefined;
    case "list":
      return Array.isArray(value);
    case "date":
      return value instanceof DateTime || value instanceof Date;
    case "duration":
      return value instanceof Duration;
    case "regexp":
      return value instanceof RegExp;
    case "number":
    case "string":
    case "boolean":
      return typeof value === type.toLowerCase();
    case "object":
      return !!value && typeof value === "object" && !Array.isArray(value);
    default:
      return false;
  }
}

function normalizeFileLike(value: string | { path: string }) {
  const path = typeof value === "string" ? value : value.path;
  return path.replaceAll(/^\[\[|\]\]$/g, "");
}

export function file(value: string | { path: string }) {
  return normalizeFileLike(value);
}

export function asFile(value: string | { path: string }) {
  return file(value);
}

export function asLink(value: string | { path: string }) {
  return `[[${normalizeFileLike(value)}]]`;
}

export function linksTo(
  value: string | { path: string },
  target: string | { path: string }
) {
  return normalizeFileLike(value) === normalizeFileLike(target);
}

export function ifValue<TTruthy, TFalsy = null>(
  condition: unknown,
  truthy: TTruthy,
  falsy?: TFalsy
) {
  return condition ? truthy : falsy ?? null;
}

export function mapItems(obj: any, items: Resolvable, expr: Resolvable) {
  let values: any = items.resolve(obj);
  if (isNull(values)) return null;
  if (!Array.isArray(values)) {
    values = [values];
  }
  return values.map((value: any, index: number) =>
    expr.resolve({ ...(obj || {}), value, index })
  );
}

export function filterItems(obj: any, items: Resolvable, expr: Resolvable) {
  let values: any = items.resolve(obj);
  if (isNull(values)) return null;
  if (!Array.isArray(values)) {
    values = [values];
  }
  return values.filter(
    (value: any, index: number) =>
      !!expr.resolve({ ...(obj || {}), value, index })
  );
}

export function reduceItems(
  obj: any,
  items: Resolvable,
  initial: Resolvable,
  expr: Resolvable
) {
  let values: any = items.resolve(obj);
  if (isNull(values)) return null;
  if (!Array.isArray(values)) {
    values = [values];
  }
  let accumulator = initial.resolve(obj);
  values.forEach((value: any, index: number) => {
    accumulator = expr.resolve({ ...(obj || {}), accumulator, value, index });
  });
  return accumulator;
}

export function keys(value: Record<string, unknown>) {
  return Object.keys(value || {});
}

export function values(value: Record<string, unknown>) {
  return Object.values(value || {});
}

export function matches(value: string, pattern: string | RegExp) {
  const expression = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  return expression.test(value);
}

export function relative(date: DateTime | Date) {
  if (date instanceof Date) {
    return relative(DateTime.fromJSDate(date));
  }
  if (!(date instanceof DateTime)) return;
  return date.toRelative();
}

export function time(date: DateTime | Date) {
  if (date instanceof Date) {
    return relative(DateTime.fromJSDate(date));
  }
  if (!(date instanceof DateTime)) return;
  return date.toISOTime();
}
