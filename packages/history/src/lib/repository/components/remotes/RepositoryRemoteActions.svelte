<script lang="ts">
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
  import ArrowUpFromLine from "@lucide/svelte/icons/arrow-up-from-line";
  import Settings2 from "@lucide/svelte/icons/settings-2";
  import {
    remoteTargetLabel,
    type RemoteTargetSettings,
  } from "../../controllers/remotes-settings.js";
  let {
    target,
    disabled = false,
    onFetch,
    onPush,
    onManage,
  }: {
    target: RemoteTargetSettings;
    disabled?: boolean;
    onFetch(): void;
    onPush(): void;
    onManage?(): void;
  } = $props();
  const label = $derived(remoteTargetLabel(target.target));
  const unavailable = $derived(disabled || Boolean(target.busy));
</script>

<div
  class="remote-actions"
  role="group"
  aria-label={`${label} remote actions`}
  aria-busy={Boolean(target.busy)}
>
  <span class="target"
    >{label}{#if target.connection}<span>
        · {target.connection.name}/{target.connection.branch}</span
      >{/if}</span
  >
  <div class="buttons">
    <Button
      variant="outline"
      size="sm"
      aria-label={`Fetch ${label.toLowerCase()}`}
      disabled={unavailable || !target.canFetch}
      onclick={onFetch}
    >
      <ArrowDownToLine data-icon="inline-start" />Fetch{#if target.observation}<span
          aria-label="Incoming commits">{target.observation.incoming}</span
        >{/if}
    </Button>
    <Button
      variant="outline"
      size="sm"
      aria-label={`Review push to ${label.toLowerCase()}`}
      disabled={unavailable ||
        !target.canPush ||
        Boolean(target.publication?.outcome === "unknown")}
      onclick={onPush}
    >
      <ArrowUpFromLine data-icon="inline-start" />Push{#if target.observation}<span
          aria-label="Outgoing commits">{target.observation.outgoing}</span
        >{/if}
    </Button>
    {#if onManage}<Button
        variant="ghost"
        size="sm"
        aria-label={`Manage remotes for ${label.toLowerCase()}`}
        onclick={onManage}
      >
        <Settings2 data-icon="inline-start" />Manage remotes
      </Button>{/if}
  </div>
</div>

<style>
  .remote-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    min-width: 0;
  }
  .target {
    flex: 1;
    min-width: 0;
    font-size: 0.8rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .target > span {
    font-weight: 400;
    color: var(--muted-foreground);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
</style>
