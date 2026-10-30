<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { SyncAccountState } from "../presentation/account";
  import type { AccountSettingsFieldDefinition } from "../settings/field-values";
  let { value, field, disabled = false }: WorkspaceCustomSettingProps<SyncAccountState> = $props();
  let busy = $state(false);
  async function run(action: "signIn" | "cancel" | "signOut") {
    if (busy) return;
    busy = true;
    try { await (field as AccountSettingsFieldDefinition)[action](); }
    finally { busy = false; }
  }
</script>

<div role="group" aria-label="Server sign-in actions" class="sync-account-actions">
  {#if value.username}
    <Button variant="outline" size="sm" disabled={disabled || busy} onclick={() => void run("signOut")}><WorkspaceIcon name="log-out" data-icon="inline-start" />Sign out</Button>
  {:else if value.status === "signing-in" || value.verificationUrl}
    {#if value.verificationUrl}
      <Button size="sm" onclick={() => (field as AccountSettingsFieldDefinition).openSignIn()}><WorkspaceIcon name="external-link" data-icon="inline-start" />Open server sign-in</Button>
    {/if}
    <Button variant="outline" size="sm" disabled={disabled || busy} onclick={() => void run("cancel")}><WorkspaceIcon name="x" data-icon="inline-start" />Cancel sign-in</Button>
  {:else}
    <Button size="sm" disabled={disabled || busy || !value.serverUrl || value.status === "unavailable"} onclick={() => void run("signIn")}><WorkspaceIcon name="log-in" data-icon="inline-start" />Sign in</Button>
  {/if}
</div>

<style>
  .sync-account-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem; }
</style>
