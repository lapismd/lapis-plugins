<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import QrCodeIcon from "@lucide/svelte/icons/qr-code";
  import XIcon from "@lucide/svelte/icons/x";
  import type { WorkspaceCustomSettingProps } from "@lapis-notes/api";
  import type { PairingSettingsValue, PairingSettingsFieldDefinition } from "../settings/field-values";
  import "./controlled-settings-fields.css";

  let { value, field, setValue, disabled = false, readOnly = false, busy = false }: WorkspaceCustomSettingProps<PairingSettingsValue> = $props();
  const actions = $derived.by(() => {
    const active = value.cameraActive || !["idle", "complete", "expired"].includes(value.stage);
    return (field as PairingSettingsFieldDefinition).actions
      .filter(action => (action.id === "sync.cancel-pairing") === active)
      .map(action => ({ ...action, disabled: action.isDisabled?.() || action.isBusy?.() }));
  });
</script>

<div class="sync-controlled-field__actions" role="group" aria-label="Pairing invitation actions">
  {#each actions as action (action.id)}
    <Button variant="outline" disabled={disabled || readOnly || busy || action.disabled} onclick={async () => {
      if (action.id === "sync.cancel-pairing") await setValue({ ...value, cameraActive: false });
      await action.run();
    }}>
      {#if action.id === "sync.begin-pairing"}<QrCodeIcon data-icon="inline-start" />{:else}<XIcon data-icon="inline-start" />{/if}
      {action.label}
    </Button>
  {/each}
</div>
