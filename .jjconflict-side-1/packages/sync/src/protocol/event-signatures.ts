import { verifyEvent } from "nostr-tools/pure";
import type { SignedNostrEvent } from "./types.js";

/** Ignore library verification caches on caller-owned mutable objects. */
export function verifySignedEvent(event: SignedNostrEvent): void {
  try {
    if (
      !event ||
      !Number.isSafeInteger(event.created_at) ||
      event.created_at < 0 ||
      !Number.isSafeInteger(event.kind) ||
      event.kind < 0 ||
      typeof event.content !== "string" ||
      !/^[0-9a-f]{64}$/.test(event.id) ||
      !/^[0-9a-f]{64}$/.test(event.pubkey) ||
      !/^[0-9a-f]{128}$/.test(event.sig) ||
      !Array.isArray(event.tags) ||
      event.tags.some(
        (tag) =>
          !Array.isArray(tag) || tag.some((value) => typeof value !== "string"),
      )
    )
      throw new Error("Invalid event shape");
    const fresh = {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      kind: event.kind,
      tags: event.tags.map((tag) => [...tag]),
      content: event.content,
      sig: event.sig,
    };
    if (!verifyEvent(fresh)) throw new Error("Invalid signature");
  } catch {
    throw new Error("Invalid Nostr signature");
  }
}
