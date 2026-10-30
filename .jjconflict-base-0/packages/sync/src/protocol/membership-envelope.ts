// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import { verifySignedEvent } from "./event-signatures.js";
import type { UnsignedSyncEvent } from "./crypto-types.js";
import { canonicalize } from "./canonical-json.js";
import type { SignedNostrEvent } from "./types.js";

export type RootAuthorityTransportEnvelope = {
  schemaVersion: 1;
  type: "lapis-sync-root-attestation";
  rootEvent: SignedNostrEvent;
};

export async function wrapRootAuthorityEvent(
  rootEvent: SignedNostrEvent,
  signTransportEvent: (event: UnsignedSyncEvent) => Promise<SignedNostrEvent>,
): Promise<SignedNostrEvent> {
  assertSigned(rootEvent);
  const envelope: RootAuthorityTransportEnvelope = {
    schemaVersion: 1,
    type: "lapis-sync-root-attestation",
    rootEvent,
  };
  return signTransportEvent({
    kind: rootEvent.kind,
    created_at: rootEvent.created_at,
    tags: rootEvent.tags.map((tag) => [...tag]),
    content: canonicalize(envelope),
  });
}

export function unwrapRootAuthorityEvent(transportEvent: SignedNostrEvent): {
  rootEvent: SignedNostrEvent;
  legacy: boolean;
} {
  assertSigned(transportEvent);
  if (!transportEvent.content.trimStart().startsWith("{")) {
    return { rootEvent: transportEvent, legacy: true };
  }
  let envelope: RootAuthorityTransportEnvelope;
  try {
    envelope = JSON.parse(
      transportEvent.content,
    ) as RootAuthorityTransportEnvelope;
  } catch {
    throw new Error("Membership transport envelope is invalid JSON");
  }
  if (
    envelope.schemaVersion !== 1 ||
    envelope.type !== "lapis-sync-root-attestation" ||
    !envelope.rootEvent
  ) {
    throw new Error("Unsupported membership transport envelope");
  }
  assertSigned(envelope.rootEvent);
  if (
    envelope.rootEvent.kind !== transportEvent.kind ||
    envelope.rootEvent.created_at !== transportEvent.created_at ||
    canonicalize(envelope.rootEvent.tags) !== canonicalize(transportEvent.tags)
  ) {
    throw new Error(
      "Membership transport and root attestation metadata do not match",
    );
  }
  return { rootEvent: envelope.rootEvent, legacy: false };
}

function assertSigned(event: SignedNostrEvent): void {
  verifySignedEvent(event);
}
