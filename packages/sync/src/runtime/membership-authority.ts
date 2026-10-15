// SPDX-License-Identifier: Apache-2.0
// Authority rules adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import { unwrapDeviceTransportEvent } from "../protocol/revision.js";
import type { SyncIncomingAuthority } from "./incoming-contracts.js";

/** Public projection of an enrolled host's verified, owner-authorized membership. */
export interface HistoryMembership {
  schemaVersion: 1 | 2;
  vaultId: string;
  ownerPublicKey: string;
  generation: number;
  currentEpoch: number;
  devices: Array<{
    publicKey: string;
    state: "active" | "revoked";
    cutoffHead?: string;
  }>;
  syncIdentity?: {
    publicKey: string;
    generation: number;
    history: Array<{
      publicKey: string;
      generation: number;
      activatedMembershipGeneration: number;
      retiredMembershipGeneration?: number;
      cutoffHeads?: Record<string, string>;
    }>;
  };
  legacyTransportCutoffHeads?: Record<string, string>;
}

export interface MembershipHistoryAuthorityOptions {
  vaultId: string;
  ownerPublicKey: string;
  /** Must come from the host's enrollment/membership capability, never provider JSON. */
  membership(): Promise<HistoryMembership | null>;
  /** The host retains key custody; only installed epoch numbers cross this boundary. */
  keyEpochs(): Promise<readonly number[]>;
}

const HASH = /^[0-9a-f]{64}$/u;
const integer = (value: number, minimum: number) =>
  Number.isSafeInteger(value) && value >= minimum;
const own = (values: Record<string, string> | undefined, key: string) =>
  values && Object.hasOwn(values, key) ? values[key] : undefined;

/** Historical authorization only. New publication additionally needs current endpoint authority. */
export function createMembershipHistoryAuthority(
  options: MembershipHistoryAuthorityOptions,
): SyncIncomingAuthority {
  if (!options.vaultId || !HASH.test(options.ownerPublicKey))
    throw new Error("History authority requires an enrolled vault and owner");
  const snapshot = async () => {
    const membership = structuredClone(await options.membership());
    if (
      !membership ||
      membership.vaultId !== options.vaultId ||
      membership.ownerPublicKey !== options.ownerPublicKey ||
      ![1, 2].includes(membership.schemaVersion) ||
      !integer(membership.generation, 0) ||
      !integer(membership.currentEpoch, 1) ||
      !Array.isArray(membership.devices) ||
      membership.devices.some(
        (device) =>
          !device ||
          !HASH.test(device.publicKey) ||
          !["active", "revoked"].includes(device.state) ||
          (device.cutoffHead !== undefined && !HASH.test(device.cutoffHead)),
      ) ||
      new Set(membership.devices.map((device) => device.publicKey)).size !==
        membership.devices.length
    )
      throw new Error(
        "Enrolled owner-authorized membership is unavailable or invalid",
      );
    const identity = membership.syncIdentity;
    if (identity) {
      if (
        !HASH.test(identity.publicKey) ||
        !integer(identity.generation, 1) ||
        !Array.isArray(identity.history) ||
        identity.history.some(
          (entry) =>
            !entry ||
            !HASH.test(entry.publicKey) ||
            !integer(entry.generation, 1) ||
            !integer(entry.activatedMembershipGeneration, 0) ||
            entry.activatedMembershipGeneration > membership.generation ||
            (entry.retiredMembershipGeneration !== undefined &&
              (!integer(
                entry.retiredMembershipGeneration,
                entry.activatedMembershipGeneration + 1,
              ) ||
                entry.retiredMembershipGeneration > membership.generation)),
        ) ||
        new Set(identity.history.map((entry) => entry.publicKey)).size !==
          identity.history.length ||
        new Set(identity.history.map((entry) => entry.generation)).size !==
          identity.history.length
      )
        throw new Error("Enrolled membership Sync Identity lineage is invalid");
      const active = identity.history.filter(
        (entry) => entry.retiredMembershipGeneration === undefined,
      );
      if (
        active.length !== 1 ||
        active[0].publicKey !== identity.publicKey ||
        active[0].generation !== identity.generation
      )
        throw new Error(
          "Enrolled membership has no unique active Sync Identity",
        );
    }
    return membership;
  };
  const epochs = async (membership: HistoryMembership) => {
    const values = [...new Set(await options.keyEpochs())];
    if (
      !values.length ||
      values.length > 1024 ||
      values.some(
        (value) => !integer(value, 1) || value > membership.currentEpoch,
      )
    )
      throw new Error(
        "Installed membership key epochs are unavailable or invalid",
      );
    return values.sort((a, b) => b - a);
  };
  return {
    async keyEpochs() {
      return epochs(await snapshot());
    },
    async authorize(record, context) {
      const membership = await snapshot(),
        payload = record.payload;
      if (
        payload.vaultId !== options.vaultId ||
        !integer(payload.membershipGeneration, 0) ||
        payload.membershipGeneration > membership.generation ||
        !integer(payload.currentEpoch, 1) ||
        payload.currentEpoch > membership.currentEpoch ||
        !integer(payload.keyEpoch, 1) ||
        payload.keyEpoch > payload.currentEpoch ||
        !(await epochs(membership)).includes(payload.keyEpoch)
      )
        return false;
      if (record.event.kind !== 78 && record.event.kind !== 30078) return false;
      const unwrapped = unwrapDeviceTransportEvent(
        record.event,
        record.event.kind,
      );
      if (
        unwrapped.deviceEvent.pubkey !== record.devicePublicKey ||
        unwrapped.legacy !== record.legacy
      )
        return false;
      const device = membership.devices.find(
        (item) => item.publicKey === record.devicePublicKey,
      );
      if (!device) return false;
      const revisionId =
        record.event.kind === 78
          ? record.event.id
          : (payload as { revisionEventId: string }).revisionEventId;
      if (!HASH.test(revisionId)) return false;
      const within = (cutoff: string | undefined) =>
        Boolean(
          cutoff &&
          HASH.test(cutoff) &&
          context?.isAncestorOrEqual(revisionId, cutoff),
        );
      if (
        device.state === "revoked" &&
        (record.event.kind === 30078 || !within(device.cutoffHead))
      )
        return false;
      if (unwrapped.legacy)
        return (
          !membership.syncIdentity ||
          within(own(membership.legacyTransportCutoffHeads, device.publicKey))
        );
      const identity = membership.syncIdentity?.history.find(
        (entry) => entry.publicKey === record.event.pubkey,
      );
      if (
        !identity ||
        payload.membershipGeneration < identity.activatedMembershipGeneration
      )
        return false;
      return (
        identity.retiredMembershipGeneration === undefined ||
        (payload.membershipGeneration < identity.retiredMembershipGeneration &&
          within(own(identity.cutoffHeads, device.publicKey)))
      );
    },
  };
}
