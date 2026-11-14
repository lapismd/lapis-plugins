<script lang="ts">
  import { untrack } from "svelte";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import type { RepositoryPlugin } from "@lapis-notes/history/repository";
  import RepositoryWorkingCopyStatus from "../../../../packages/history/src/lib/repository/components/RepositoryWorkingCopyStatus.svelte";
  import RepositoryBackupStatus from "../../../../packages/history/src/lib/repository/components/RepositoryBackupStatus.svelte";
  import RemotePushReview from "../../../../packages/history/src/lib/repository/components/remotes/RemotePushReview.svelte";
  import type { WorkingCopyController } from "../../../../packages/history/src/lib/repository/controllers/working-copy-controller";
  import type { BackupController } from "../../../../packages/history/src/lib/repository/controllers/backup";
  import type {
    RemoteTarget,
    RepositoryUpstreamBinding,
  } from "../../../../packages/history/src/lib/repository/controllers/remotes-settings";
  import type { RemotesFixture } from "./model.svelte";
  import type { SyncController } from "../../../../packages/history/src/lib/repository/controllers/sync-controller";
  let {
    plugin,
    fixture,
    kind,
    workingCopy,
    backup,
    onManage,
    legacy,
  }: {
    plugin: RepositoryPlugin;
    fixture: RemotesFixture;
    kind: RemoteTarget;
    workingCopy: WorkingCopyController;
    backup: BackupController;
    onManage(): void;
    legacy?: SyncController;
  } = $props();
  const settings = untrack(() => getWorkspaceHostBinding(plugin.app.workspace).controller.settings);
  const target = $derived(fixture.target(kind));
  async function perform(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      fixture.actions.report(error);
    }
  }
  const remote: RepositoryUpstreamBinding = $derived({
    target,
    fetch: () => void perform(() => fixture.actions.fetch(kind)),
    push: () => void perform(() => fixture.actions.reviewPush(kind)),
    pull: kind === "backup" ? () => void perform(() => fixture.actions.pullBackup()) : undefined,
    manage: onManage,
  });
</script>

{#if kind === "original"}
  <RepositoryWorkingCopyStatus
    controller={workingCopy}
    remote={legacy ? undefined : remote}
    upstream={legacy}
    openRevision={(operation, revision) => plugin.open(operation, revision, "original")}
    copyText={(value) => plugin.copyIdentifier(value)}
  />
{:else}
  <RepositoryBackupStatus
    controller={backup}
    remote={legacy ? undefined : remote}
    upstream={legacy}
    openRevision={(operation, revision) => plugin.open(operation, revision)}
    copyText={(value) => plugin.copyIdentifier(value)}
  />
{/if}
{#if !settings.dialogOpen}<RemotePushReview
    {target}
    busy={Boolean(target.busy)}
    onClose={() => fixture.actions.dismissReview(kind)}
    onPush={(id) => void perform(() => fixture.actions.push(kind, id))}
  />{/if}
