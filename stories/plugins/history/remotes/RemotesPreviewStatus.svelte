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
    presentation = "split",
    workingCopy,
    backup,
    onManage,
    legacy,
  }: {
    plugin: RepositoryPlugin;
    fixture: RemotesFixture;
    kind?: RemoteTarget;
    presentation?: "split";
    workingCopy: WorkingCopyController;
    backup: BackupController;
    onManage(): void;
    legacy?: SyncController;
  } = $props();
  const settings = untrack(() => getWorkspaceHostBinding(plugin.app.workspace).controller.settings);
  const target = $derived(fixture.target("original"));
  async function perform(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      fixture.actions.report(error);
    }
  }
  const remote: RepositoryUpstreamBinding = $derived({
    target,
    fetch: () => void perform(() => fixture.actions.fetch("original")),
    push: () => void perform(() => fixture.actions.reviewPush("original")),
    manage: onManage,
  });
</script>

{#if legacy && kind === "backup"}
  <RepositoryBackupStatus
    controller={backup}
    upstream={legacy}
    openRevision={(operation, revision) => plugin.open(operation, revision)}
    copyText={(value) => plugin.copyIdentifier(value)}
  />
{:else}
  <RepositoryWorkingCopyStatus
    controller={workingCopy}
    {backup}
    presentation={legacy ? "full" : presentation}
    remote={legacy ? undefined : remote}
    upstream={legacy}
    openRevision={(operation, revision) => plugin.open(operation, revision, "original")}
    copyText={(value) => plugin.copyIdentifier(value)}
  />
{/if}
{#if !legacy && presentation === "split" && !settings.dialogOpen}<RemotePushReview
    {target}
    busy={Boolean(target.busy)}
    onClose={() => fixture.actions.dismissReview("original")}
    onPush={(id) => void perform(() => fixture.actions.push("original", id))}
  />{/if}
