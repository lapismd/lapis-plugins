<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import RepositoryPanel from "../../../../packages/history/src/lib/repository/components/RepositoryPanel.svelte";
  import RepositoryOperations from "../../../../packages/history/src/lib/repository/components/RepositoryOperations.svelte";
  import type { RepositoryPlugin } from "@lapis-notes/history/repository";
  import type { RemotesFixture } from "./model.svelte";
  import type { RepositoryUpstreamBinding } from "../../../../packages/history/src/lib/repository/controllers/remotes-settings";
  let {
    plugin,
    fixture,
    onManage,
    operations = false,
  }: {
    plugin: RepositoryPlugin;
    fixture: RemotesFixture;
    onManage(): void;
    operations?: boolean;
  } = $props();
  async function perform(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      fixture.actions.report(error);
    }
  }
  const remote: RepositoryUpstreamBinding = $derived({
    target: fixture.target("original"),
    fetch: () => void perform(() => fixture.actions.fetch("original")),
    push: () => void perform(() => fixture.actions.reviewPush("original")),
    manage: onManage,
  });
  const controller = untrack(() => (operations ? undefined : plugin.createController("original")));
  const operationController = untrack(() =>
    operations ? plugin.createOperationController("original") : undefined,
  );
  onDestroy(() => {
    if (controller) void plugin.release(controller);
    if (operationController) void plugin.release(operationController);
  });
</script>

{#if controller}<RepositoryPanel
    {controller}
    {remote}
    showContextPickers={false}
    copyText={(value) => plugin.copyIdentifier(value)}
  />{:else if operationController}<RepositoryOperations
    controller={operationController}
    {remote}
    copyText={(value) => plugin.copyIdentifier(value)}
    onHistory={(operation) => void plugin.open(operation, undefined, "original")}
  />{/if}
