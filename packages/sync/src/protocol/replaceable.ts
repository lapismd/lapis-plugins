import type { SignedNostrEvent } from "./types.js";
export function replaceableEventAddress(event: SignedNostrEvent): string {
  if (event.kind !== 30078 && event.kind !== 30079)
    throw new Error("Not a sync replaceable event");
  return JSON.stringify([
    event.kind,
    event.pubkey,
    event.tags.find((tag) => tag[0] === "d")?.[1] ?? "",
  ]);
}

/** Sort only records sharing one address; never choose among device tips. */
export function compareReplaceableEvents(
  left: SignedNostrEvent,
  right: SignedNostrEvent,
): number {
  if (replaceableEventAddress(left) !== replaceableEventAddress(right))
    throw new Error("Replaceable event address mismatch");
  return (
    right.created_at - left.created_at ||
    (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  );
}
