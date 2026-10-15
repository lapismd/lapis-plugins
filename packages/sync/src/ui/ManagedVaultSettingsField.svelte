<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { CopyableValue } from "@lapismd/design-core/workspace/settings";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { ManagedVaultSettingsValue, ManagedVaultSettingsFieldDefinition } from "../settings/field-values";
  import "./controlled-settings-fields.css";

  let { value, id, field, setValue, disabled = false, readOnly = false, busy = false, error }: WorkspaceCustomSettingProps<ManagedVaultSettingsValue> = $props();
  const selected = $derived(value.vaults.find(vault => vault.id === value.selectedId));
  const unavailable = $derived(disabled || readOnly || busy || !value.serverUrl);
  function refresh() { return (field as ManagedVaultSettingsFieldDefinition).refresh(); }
  onMount(() => { if (value.serverUrl && value.selectedId) void refresh(); });
  onDestroy(() => (field as ManagedVaultSettingsFieldDefinition).cancel());
</script>

<div class="sync-controlled-field" aria-busy={value.loading}>
  <div class="sync-vault-picker__controls">
    <Select.Root
      type="single"
      value={value.selectedId}
      disabled={unavailable}
      onOpenChange={(open) => { if (open && !value.loaded && !value.loading) void refresh(); }}
      onValueChange={(selectedId) => { if (selectedId) void setValue({ ...value, selectedId }); }}
    >
      <Select.Trigger {id} role="combobox" aria-label={field.title} class="sync-vault-picker__trigger">
        <span>{selected?.name ?? "Select a managed vault"}</span>
      </Select.Trigger>
      <Select.Content aria-label="Managed vault options">
        <Select.Group>
          {#each value.vaults as vault (vault.id)}
            <Select.Item value={vault.id} label={vault.name} disabled={vault.role === "viewer"}>
              {vault.name}{vault.role === "viewer" ? " (read only)" : ""}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>
    <Button variant="ghost" size="icon-sm" class="sync-vault-picker__refresh" aria-label="Refresh managed vaults" disabled={unavailable || value.loading} onclick={() => void refresh()}>
      <RefreshCw />
    </Button>
  </div>
  {#if value.selectedId}<CopyableValue value={value.selectedId} label="managed vault ID" />{/if}
  {#if value.loading}<p role="status">Loading managed vaults…</p>
  {:else if error || value.error}<p role="alert" class="sync-controlled-field__error">{error || value.error}</p>
  {:else if !value.serverUrl}<p>Enter a server URL to load your vaults.</p>
  {:else if value.loaded && !value.vaults.length}<p role="status">No active managed vaults are available to this account.</p>{/if}
</div>

<style>
  .sync-vault-picker__controls { display: flex; gap: 0.5rem; min-width: 0; }
  .sync-vault-picker__controls :global(.sync-vault-picker__trigger) { flex: 1; min-width: 0; }
  .sync-vault-picker__controls :global(.sync-vault-picker__refresh) {
    width: var(--ui-workspace-settings-control-height);
    height: var(--ui-workspace-settings-control-height);
  }
</style>
