import { SyncController } from "../../../../packages/history/src/lib/repository/controllers/sync-controller";
import type { RemoteSnapshot } from "../../../../packages/history/src/lib/repository/controllers/remote";
import type { RemotesFixture } from "./model.svelte";

/** Exercise the existing controller-based widget contract without new bindings. */
export function legacyStatusController(fixture: RemotesFixture) {
  const snapshot: RemoteSnapshot = {
    revision: 1,
    checkpoint: null,
    configuration: {
      account: "github",
      project: "alex/notes-backup",
      canPush: true,
      target: { url: "https://github.com/alex/notes-backup.git", branch: "main" },
    },
    divergence: {
      local_commit: "11".repeat(20),
      remote_commit: "22".repeat(20),
      incoming: 2,
      outgoing: 3,
    },
  };
  const unused = async (): Promise<never> => {
    throw Error("Unexpected legacy fixture operation");
  };
  return new SyncController(
    {
      status: async () => snapshot,
      configure: unused,
      disconnect: unused,
      preview: unused,
      restore: unused,
      keepCurrent: async () => {
        fixture.record("legacy-capture");
      },
      fetch: async () => {
        fixture.record("legacy-fetch");
        return snapshot;
      },
    },
    {
      prepare: async () => {
        fixture.record("legacy-pull");
        return null;
      },
      preview: unused,
      apply: unused,
      conflict: unused,
      resolve: unused,
      publish: async () => {
        fixture.record("legacy-push");
        return "complete";
      },
    },
    async (action) => action(),
    { report: fixture.actions.report, recovered: () => {} },
    { load: async () => undefined, save: async () => {} },
  );
}
