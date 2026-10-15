import type { LocalEngineState, StoredRevision } from "./contracts.js";
import type {
  AuthorizedIncomingRecord,
  SyncAuthorityContext,
  SyncIncomingAuthority,
} from "./incoming-contracts.js";
import { unwrapDeviceTransportEvent } from "../protocol/revision.js";

export function revisionAuthorityRecord(
  revision: StoredRevision,
): AuthorizedIncomingRecord {
  const { deviceEvent, legacy } = unwrapDeviceTransportEvent(
    revision.event,
    78,
  );
  return {
    event: structuredClone(revision.event),
    payload: structuredClone(revision.payload),
    devicePublicKey: deviceEvent.pubkey,
    legacy,
  };
}

/** Only records already authenticated by the incoming reader enter this graph. */
export function historyAuthorityContext(
  state: LocalEngineState,
): SyncAuthorityContext {
  const parents = new Map(
    Object.entries(state.revisions).map(([id, record]) => [
      id,
      record.payload.parents.map((parent) => parent.eventId),
    ]),
  );
  return {
    isAncestorOrEqual(candidate, descendant) {
      if (!parents.has(candidate) || !parents.has(descendant)) return false;
      const pending = [descendant],
        seen = new Set<string>();
      while (pending.length) {
        const id = pending.pop()!;
        if (seen.has(id)) continue;
        if (id === candidate) return true;
        seen.add(id);
        if (seen.size > 100_000)
          throw new Error("Authority ancestry proof exceeds limit");
        pending.push(...(parents.get(id) ?? []));
      }
      return false;
    },
  };
}

/** A currently active tip cannot launder an ancestor now outside an approved cutoff. */
export async function revisionAncestryAuthorized(
  state: LocalEngineState,
  revisionId: string,
  policy: SyncIncomingAuthority,
  context = historyAuthorityContext(state),
): Promise<boolean> {
  const pending = [revisionId],
    checked = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (checked.has(id)) continue;
    checked.add(id);
    if (checked.size > 100_000)
      throw new Error("Authority ancestry traversal exceeds limit");
    const revision = state.revisions[id];
    if (
      !revision ||
      (await policy.authorize(revisionAuthorityRecord(revision), context)) !==
        true
    )
      return false;
    pending.push(...revision.payload.parents.map((parent) => parent.eventId));
  }
  return true;
}
