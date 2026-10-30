import type { SyncIncomingAuthority } from "../src/runtime/incoming-contracts";
import { fixtureCrypto } from "./engine-harness";
import type { createEngineHarness } from "./engine-harness";
import type {
  ApplyOperation,
  ApplyReceipt,
} from "../src/runtime/incoming-contracts";
import { canonicalize } from "../src/protocol/canonical-json";

export function fixtureIncomingAuthority(
  devices: string[],
): SyncIncomingAuthority {
  return {
    async keyEpochs() {
      return [1];
    },
    async authorize(record) {
      return (
        !record.legacy &&
        devices.includes(record.devicePublicKey) &&
        record.event.pubkey === fixtureCrypto().syncPublicKey &&
        record.payload.membershipGeneration === 1
      );
    },
  };
}

export function installFixtureApply(
  harness: Awaited<ReturnType<typeof createEngineHarness>>,
) {
  const receipts = new Map<string, ApplyReceipt>();
  const control = {
    mutations: 0,
    crashAfterMutation: false,
    failProgressCommit: false,
  };
  harness.options.vault = {
    ...harness.options.vault,
    apply: {
      async receipt(id) {
        return structuredClone(receipts.get(id) ?? null);
      },
      async mutate(operation, source) {
        const existing = receipts.get(operation.id);
        if (existing) {
          if (canonicalize(existing.operation) !== canonicalize(operation))
            throw new Error("Reused operation ID");
          return structuredClone(existing);
        }
        const current = harness.files.get(operation.path);
        if (
          operation.expected
            ? !current ||
              current.fileId !== operation.expected.fileId ||
              current.contentGeneration !== operation.expected.contentGeneration
            : !!current
        )
          throw new Error("Stale host generation");
        let result: ApplyReceipt["result"] = null;
        if (operation.kind === "write") {
          if (!source) throw new Error("Missing content source");
          const bytes = new Uint8Array(
            await new Response(source).arrayBuffer(),
          );
          result = {
            fileId: operation.fileId,
            contentGeneration: (current?.contentGeneration ?? 0) + 1,
          };
          harness.files.set(operation.path, { ...result, bytes });
        } else harness.files.delete(operation.path);
        const receipt = { operation: structuredClone(operation), result };
        receipts.set(operation.id, structuredClone(receipt));
        control.mutations++;
        if (control.failProgressCommit) {
          control.failProgressCommit = false;
          harness.repository.failCommit = true;
        }
        if (control.crashAfterMutation) {
          control.crashAfterMutation = false;
          throw new Error("Crash after host mutation");
        }
        return receipt;
      },
    },
  };
  return {
    ...control,
    get mutations() {
      return control.mutations;
    },
    crashNextMutation() {
      control.crashAfterMutation = true;
    },
    failNextProgressCommit() {
      control.failProgressCommit = true;
    },
    receipts,
  };
}
