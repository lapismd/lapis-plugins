// SPDX-License-Identifier: Apache-2.0
// Authority rules adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import { unwrapDeviceTransportEvent } from "../protocol/revision.js";
import type {
  SyncAuthorityContext,
  SyncIncomingAuthority,
} from "./incoming-contracts.js";

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

export interface MembershipAuthorizationRecord {
  eventId: string;
  eventKind: number;
  transportPublicKey: string;
  attestedDevicePublicKey: string;
  devicePublicKey: string;
  legacy: boolean;
  payload: {
    vaultId: string;
    membershipGeneration: number;
    currentEpoch: number;
    keyEpoch: number;
    revisionEventId?: string;
  };
}

/** Validate the host-owned public membership projection before using it. */
export function validateHistoryMembership(
  membership: HistoryMembership | null,
  expectedVaultId: string,
  expectedOwnerPublicKey: string,
): asserts membership is HistoryMembership {
  if (
    !membership ||
    membership.vaultId !== expectedVaultId ||
    membership.ownerPublicKey !== expectedOwnerPublicKey ||
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
      throw new Error("Enrolled membership has no unique active Sync Identity");
  }
}

export function validateInstalledEpochs(
  values: readonly number[],
  membership: HistoryMembership,
): number[] {
  const epochs = [...new Set(values)];
  if (
    !epochs.length ||
    epochs.length > 1024 ||
    epochs.some(
      (value) => !integer(value, 1) || value > membership.currentEpoch,
    )
  )
    throw new Error("Installed membership key epochs are unavailable or invalid");
  return epochs.sort((a, b) => b - a);
}

/** Pure authorization after signature/envelope verification and membership validation. */
export function authorizeMembershipRecord(options: {
  membership: HistoryMembership;
  installedEpochs: readonly number[];
  record: MembershipAuthorizationRecord;
  context?: SyncAuthorityContext;
}): boolean {
  const { membership, record, context } = options;
  const payload = record.payload;
  if (
    payload.vaultId !== membership.vaultId ||
    !integer(payload.membershipGeneration, 0) ||
    payload.membershipGeneration > membership.generation ||
    !integer(payload.currentEpoch, 1) ||
    payload.currentEpoch > membership.currentEpoch ||
    !integer(payload.keyEpoch, 1) ||
    payload.keyEpoch > payload.currentEpoch ||
    !validateInstalledEpochs(options.installedEpochs, membership).includes(
      payload.keyEpoch,
    ) ||
    (record.eventKind !== 78 && record.eventKind !== 30078) ||
    record.attestedDevicePublicKey !== record.devicePublicKey
  )
    return false;
  const device = membership.devices.find(
    (item) => item.publicKey === record.devicePublicKey,
  );
  if (!device) return false;
  const revisionId =
    record.eventKind === 78 ? record.eventId : payload.revisionEventId;
  if (!revisionId || !HASH.test(revisionId)) return false;
  const within = (cutoff: string | undefined) =>
    Boolean(
      cutoff &&
      HASH.test(cutoff) &&
      context?.isAncestorOrEqual(revisionId, cutoff),
    );
  if (
    device.state === "revoked" &&
    (record.eventKind === 30078 || !within(device.cutoffHead))
  )
    return false;
  if (record.legacy)
    return (
      !membership.syncIdentity ||
      within(own(membership.legacyTransportCutoffHeads, device.publicKey))
    );
  const identity = membership.syncIdentity?.history.find(
    (entry) => entry.publicKey === record.transportPublicKey,
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
}

/** Historical authorization only. New publication additionally needs current endpoint authority. */
export function createMembershipHistoryAuthority(
  options: MembershipHistoryAuthorityOptions,
): SyncIncomingAuthority {
  if (!options.vaultId || !HASH.test(options.ownerPublicKey))
    throw new Error("History authority requires an enrolled vault and owner");
  const snapshot = async () => {
    const membership = structuredClone(await options.membership());
    validateHistoryMembership(
      membership,
      options.vaultId,
      options.ownerPublicKey,
    );
    return membership;
  };
  const epochs = async (membership: HistoryMembership) =>
    validateInstalledEpochs(await options.keyEpochs(), membership);
  return {
    async keyEpochs() {
      return epochs(await snapshot());
    },
    async authorize(record, context) {
      const membership = await snapshot(),
        payload = record.payload,
        installedEpochs = await epochs(membership);
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
      return authorizeMembershipRecord({
        membership,
        installedEpochs,
        context,
        record: {
          eventId: record.event.id,
          eventKind: record.event.kind,
          transportPublicKey: record.event.pubkey,
          attestedDevicePublicKey: unwrapped.deviceEvent.pubkey,
          devicePublicKey: record.devicePublicKey,
          legacy: record.legacy,
          payload: {
            vaultId: payload.vaultId,
            membershipGeneration: payload.membershipGeneration,
            currentEpoch: payload.currentEpoch,
            keyEpoch: payload.keyEpoch,
            revisionEventId:
              record.event.kind === 30078
                ? (payload as { revisionEventId: string }).revisionEventId
                : undefined,
          },
        },
      });
    },
  };
}
