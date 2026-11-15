<script lang="ts">
  import { tick } from "svelte";
  import type { WorkspaceCustomSetting, WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { RepositoryRemotes } from "../repository-remotes.svelte.js";
  import RepositoryRemotesSettings from "./RepositoryRemotesSettings.svelte";
  import BackupSettings from "../backup/BackupSettings.svelte";
  let { field }: Pick<WorkspaceCustomSettingProps, "field"> = $props();
  const owner = $derived((field as WorkspaceCustomSetting & { remotes: RepositoryRemotes }).remotes);
  let root: HTMLDivElement;
  $effect(() => {
    const target = owner.settingsTarget;
    if (!target || !owner.state) return;
    let disposed = false;
    let cancel = () => {};
    void tick().then(() => {
      if (disposed) return;
      const section = root?.querySelector<HTMLElement>(`[data-remote-target="${target}"]`);
      if (!section) return;
      const reveal = () => {
        if (disposed || owner.settingsTarget !== target) return;
        section.scrollIntoView({ block: "nearest" });
        section.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
        owner.settingsTarget = undefined;
      };
      // The shell owns initial dialog focus. Finish the requested field focus
      // when that dialog enters, or immediately when Settings is already open.
      const dialog = root.closest<HTMLElement>('[role="dialog"][aria-modal="true"]');
      if (dialog && !dialog.contains(root.ownerDocument.activeElement)) {
        dialog.addEventListener("focus", reveal, { once: true });
        cancel = () => dialog.removeEventListener("focus", reveal);
      } else reveal();
    });
    return () => { disposed = true; cancel(); };
  });
</script>

<div bind:this={root}>
  {#snippet nativeSynchronization()}
    {#if owner.synchronization}<BackupSettings
      sync={owner.synchronization}
      setSyncEnabled={async (enabled) => {
        try {
          await owner.actions.setAutomaticSync(enabled);
        } catch (error) {
          owner.report(error);
        }
        await owner.synchronization?.refresh();
      }}
    />{/if}
  {/snippet}
  {#if owner.state}
    <RepositoryRemotesSettings state={owner.state} actions={owner.actions} showReviews={false}
      automaticSynchronization={owner.synchronization ? nativeSynchronization : undefined} />
  {:else}
    <div role="status">Repository connections are not loaded.</div>
    <Button variant="outline" onclick={() => void owner.refresh()}>Refresh connection settings</Button>
  {/if}
</div>
