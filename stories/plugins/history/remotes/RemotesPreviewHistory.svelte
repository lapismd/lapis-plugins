<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import RepositoryRemotesHistory from "../../../../packages/history/src/lib/repository/components/remotes/RepositoryRemotesHistory.svelte";
  import RemotePushReview from "../../../../packages/history/src/lib/repository/components/remotes/RemotePushReview.svelte";
  import type { RepositoryPlugin } from "@lapis-notes/history/repository";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import type { RemotesFixture } from "./model.svelte";
  let {
    plugin,
    fixture,
    onManage,
  }: { plugin: RepositoryPlugin; fixture: RemotesFixture; onManage(): void } = $props();
  const controller = untrack(() => plugin.createController("original"));
  const target = $derived(fixture.target("original"));
  const settings = untrack(() => getWorkspaceHostBinding(plugin.app.workspace).controller.settings);
  onDestroy(() => {
    void plugin.release(controller);
  });
  async function perform(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      fixture.actions.report(error);
    }
  }
</script>

<RepositoryRemotesHistory
  history={{ controller, copyText: (value) => plugin.copyIdentifier(value) }}
  remote={{
    target,
    onFetch: () => void perform(() => fixture.actions.fetch("original")),
    onPush: () => void perform(() => fixture.actions.reviewPush("original")),
    onManage,
  }}
/>
{#if !settings.dialogOpen}<RemotePushReview
    {target}
    busy={Boolean(target.busy)}
    onClose={() => fixture.actions.dismissReview("original")}
    onPush={(id) => void perform(() => fixture.actions.push("original", id))}
  />{/if}
