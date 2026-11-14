import { mount, unmount } from "svelte";
import type { RepositoryPlugin } from "@lapis-notes/history/repository";
import { repositoryFeedback } from "../../../../packages/history/src/lib/repository/components/repository-feedback";
import { WorkingCopyController } from "../../../../packages/history/src/lib/repository/controllers/working-copy-controller";
import {
  BackupController,
  type BackupStatus,
} from "../../../../packages/history/src/lib/repository/controllers/backup";
import {
  commit,
  operation,
  revision,
} from "../../../../packages/history/test/repository/fixtures/fixture";
import RemotesPreviewStatus from "./RemotesPreviewStatus.svelte";
import type { RemotesFixture } from "./model.svelte";
import { legacyStatusController } from "./legacy-status";

export async function mountRemotesStatus(
  plugin: RepositoryPlugin,
  fixture: RemotesFixture,
  onManage: () => void,
  legacyStatus = false,
) {
  const current = commit();
  const workingCopy = new WorkingCopyController(
    async () => ({
      operation,
      revision,
      changeId: current.change_id,
      workspace: "default",
      description: current.description,
      author: current.author,
      files: 3,
      lines: { additions: 24, deletions: 6 },
      uncounted: 0,
    }),
    repositoryFeedback(plugin.app, "Working copy status"),
  );
  const saved: BackupStatus = {
    phase: "ready",
    error: null,
    checkpoint: {
      operation,
      commit: revision,
      change_id: current.change_id,
      description: "Retain saved vault files",
      timestamp_millis: 1792252800000,
    },
  };
  const backup = new BackupController(
    { start: async () => saved, capture: async () => saved, stop: async () => {} },
    repositoryFeedback(plugin.app, "Vault backup status"),
  );
  await Promise.all([workingCopy.refresh(), backup.start()]);
  const closingViews: Promise<void>[] = [];
  const legacy = legacyStatus ? legacyStatusController(fixture) : undefined;
  const stops = (["original", "backup"] as const).map((kind) =>
    plugin.app.statusBar.registerItem({
      id: kind === "original" ? "repository-history:working-copy" : "repository-history:backup",
      sourcePlugin: plugin.id,
      alignment: kind === "original" ? "left" : "right",
      priority: 15,
      mount: (host) => {
        const component = mount(RemotesPreviewStatus, {
          target: host,
          props: { plugin, fixture, kind, workingCopy, backup, onManage, legacy },
        });
        return () => {
          closingViews.push(unmount(component));
        };
      },
    }),
  );
  return async () => {
    for (const stop of stops) stop();
    await Promise.all(closingViews);
    legacy?.close();
    await Promise.all([workingCopy.close(), backup.close(), legacy?.drained()]);
  };
}
