<script lang="ts">
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import BackupCard from "../backup/BackupCard.svelte";
  import RemoteConnectionSettings from "./RemoteConnectionSettings.svelte";
  import RemoteCredentialsSettings from "./RemoteCredentialsSettings.svelte";
  import type {
    RemotesSettingsActions,
    RemotesSettingsState,
  } from "../../controllers/remotes-settings.js";
  let {
    showReviews = true,
    state: snapshot,
    actions: commands,
  }: { state: RemotesSettingsState; actions: RemotesSettingsActions; showReviews?: boolean } = $props();
  const id = $props.id();
  let busy = $state(false);
  const backup = $derived(snapshot.targets.find((target) => target.target === "backup"));
  async function setAutomaticSync(enabled: boolean) {
    busy = true;
    try {
      await commands.setAutomaticSync(enabled);
    } catch (error) {
      commands.report(error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="remotes-settings" data-remotes-settings>
  <div class="intro">
    <h2>Remotes and credentials</h2>
    <p>
      Choose a remote for each repository. Connections are independent; saving a connection never
      transfers data.
    </p>
  </div>
  {#each snapshot.targets as target (target.target)}<RemoteConnectionSettings
      {target}
      showReview={showReviews}
      state={snapshot}
      actions={commands}
    />{/each}
  <RemoteCredentialsSettings state={snapshot} actions={commands} />
  {#if backup}<BackupCard
      title="Automatic backup synchronization"
      description="Original repository fetch and push always stay manual."
    >
      <Field.Field
        orientation="horizontal"
        data-disabled={busy || (!snapshot.automaticSync && (!backup.connection || !backup.canPush))}
      >
        <Switch
          id={`${id}-automatic`}
          checked={snapshot.automaticSync}
          disabled={busy || (!snapshot.automaticSync && (!backup.connection || !backup.canPush))}
          onCheckedChange={(value) => void setAutomaticSync(value)}
        />
        <Field.Label for={`${id}-automatic`}>Synchronize the vault backup automatically</Field.Label
        >
      </Field.Field>
      <p class="guidance">
        New connections start with automatic synchronization off. Enabling it allows background
        fetch and push for the vault backup.
      </p>
    </BackupCard>{/if}
</div>

<style>
  .remotes-settings {
    container: remotes-settings / inline-size;
    display: grid;
    gap: 1.25rem;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--muted-foreground);
  }
  .guidance {
    font-size: 0.8rem;
  }
</style>
