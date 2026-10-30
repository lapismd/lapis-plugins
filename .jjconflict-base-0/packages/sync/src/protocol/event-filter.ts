import type { NostrEventFilter, SignedNostrEvent } from "./types.js";
const strings = ["ids", "authors", "#d", "#p", "#v"] as const;
const fields = new Set<string>([...strings, "kinds", "since"]);

export function validateEventFilter(
  value: unknown,
): asserts value is NostrEventFilter {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid event filter");
  const filter = value as Record<string, unknown>;
  for (const name of Object.keys(filter)) {
    if (!fields.has(name)) throw new Error(`Unsupported event filter: ${name}`);
    const entry = filter[name];
    if (entry === undefined) continue;
    if (name === "since") {
      if (!Number.isSafeInteger(entry) || (entry as number) < 0)
        throw new Error("Invalid since filter");
    } else if (
      !Array.isArray(entry) ||
      entry.some((item) =>
        name === "kinds"
          ? !Number.isSafeInteger(item) || item < 0
          : typeof item !== "string",
      )
    )
      throw new Error(`Invalid event filter: ${name}`);
  }
}

export function matchesEventFilter(
  event: SignedNostrEvent,
  filter: NostrEventFilter,
): boolean {
  validateEventFilter(filter);
  if (filter.ids && !filter.ids.includes(event.id)) return false;
  if (filter.authors && !filter.authors.includes(event.pubkey)) return false;
  if (filter.kinds && !filter.kinds.includes(event.kind)) return false;
  if (
    filter["#d"] &&
    !filter["#d"].includes(event.tags.find((tag) => tag[0] === "d")?.[1] ?? "")
  )
    return false;
  for (const name of ["p", "v"] as const) {
    const values = filter[`#${name}`];
    if (
      values &&
      !event.tags.some(
        (tag) => tag[0] === name && values.includes(tag[1] ?? ""),
      )
    )
      return false;
  }
  return filter.since === undefined || event.created_at >= filter.since;
}

export function matchesEventFilters(
  event: SignedNostrEvent,
  filters: readonly NostrEventFilter[],
): boolean {
  // Validate all branches before OR short-circuiting could hide an invalid one.
  for (const filter of filters) validateEventFilter(filter);
  return filters.some((filter) => matchesEventFilter(event, filter));
}
