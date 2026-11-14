<script lang="ts">
  import { onMount } from "svelte";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import CircleArrowDown from "@lucide/svelte/icons/circle-arrow-down";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Settings2 from "@lucide/svelte/icons/settings-2";
  import {
    remoteTargetLabel,
    type RepositoryUpstreamBinding,
  } from "../controllers/remotes-settings.js";
  import type { SyncController } from "../controllers/sync-controller.js";
  import type { SyncState } from "../controllers/sync.js";
  let {
    controller,
    unavailable = false,
    remote,
    compact = false,
  }: {
    controller?: SyncController;
    unavailable?: boolean;
    remote?: RepositoryUpstreamBinding;
    compact?: boolean;
  } = $props();
  let state: SyncState = $state({
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  });
  onMount(() => {
    const stop = remote ? undefined : controller?.subscribe((next) => (state = next));
    if (!remote) void controller?.run("status");
    return stop;
  });
  const actions = [
    { action: "fetch", label: "Fetch from upstream", Icon: CircleArrowDown },
    { action: "pull", label: "Pull from upstream", Icon: ArrowDown },
    { action: "push", label: "Push to upstream", Icon: ArrowUp },
  ] as const;
  const counts = $derived(remote ? remote.target.observation : state.upstream?.divergence);
  const busy = $derived(remote ? Boolean(remote.target.busy) : state.busy);
  const targetLabel = $derived(
    remote ? remoteTargetLabel(remote.target.target).toLowerCase() : "upstream",
  );
  function blocked(action: "fetch" | "pull" | "push") {
    if (remote)
      return (
        unavailable ||
        busy ||
        !remote.target.connection ||
        (action === "fetch" && !remote.target.canFetch) ||
        (action === "pull" && (!remote.pull || !remote.target.canFetch)) ||
        (action === "push" &&
          (!remote.target.canPush || remote.target.publication?.outcome === "unknown"))
      );
    return (
      unavailable ||
      !controller ||
      busy ||
      !state.upstream?.configuration ||
      (action !== "fetch" && (state.recovery || Boolean(state.proposal?.conflicts.length))) ||
      (action === "push" && !state.upstream?.configuration?.canPush)
    );
  }
  function run(action: "fetch" | "pull" | "push") {
    if (blocked(action)) return;
    if (!remote) {
      void controller?.run(action);
      return;
    }
    if (action === "fetch") remote.fetch();
    else if (action === "pull") remote.pull?.();
    else remote.push();
  }
</script>

<div
  class="upstream-actions"
  class:compact
  role="group"
  aria-label={remote
    ? `${remoteTargetLabel(remote.target.target)} upstream actions`
    : "Upstream actions"}
  aria-busy={busy}
>
  <Tooltip.Provider>
    {#each actions as action (action.action)}
      {@const disabled = blocked(action.action)}
      {@const label = remote
        ? `${action.action === "fetch" ? "Fetch" : action.action === "pull" ? "Pull" : "Review push to"} ${targetLabel}`
        : action.label}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <span {...props} class="action-trigger">
              <Button
                aria-describedby={typeof props["aria-describedby"] === "string"
                  ? props["aria-describedby"]
                  : undefined}
                variant="ghost"
                size="sm"
                class="upstream-action"
                aria-label={label}
                {disabled}
                onclick={(event) => {
                  run(action.action);
                }}
              >
                <action.Icon data-icon="inline-start" aria-hidden="true" />
                <span class="sr-label">{label}</span>
                {#if action.action !== "fetch"}<span class="count"
                    >{counts?.[action.action === "pull" ? "incoming" : "outgoing"] ?? "—"}</span
                  >{/if}
              </Button>
            </span>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content role="tooltip">
          <strong>{label}</strong>
          {#if remote?.target.connection}<span class="count-description"
              >{remote.target.connection.name}/{remote.target.connection.branch}</span
            >{/if}
          {#if remote?.target.target === "original" && action.action === "pull"}<span
              class="count-description">Original repository pull is not available.</span
            >{/if}
          {#if action.action !== "fetch"}<span class="count-description"
              >{counts
                ? `${counts[action.action === "pull" ? "incoming" : "outgoing"]} ${action.action === "pull" ? "incoming" : "outgoing"} commits since the last fetch`
                : "Commit count unavailable until upstream history is fetched"}</span
            >{/if}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
    {#if remote}<Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}<Button
              {...props}
              variant="ghost"
              size="sm"
              class="upstream-action"
              aria-label={`Manage remotes for ${targetLabel}`}
              onclick={remote.manage}><Settings2 aria-hidden="true" /></Button
            >{/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content role="tooltip">Manage remotes for {targetLabel}</Tooltip.Content>
      </Tooltip.Root>{/if}
  </Tooltip.Provider>
</div>

<style>
  .upstream-actions {
    display: flex;
    align-items: center;
    margin-inline-start: auto;
    gap: 0.125rem;
    flex: none;
  }
  .action-trigger {
    display: inline-flex;
  }
  .sr-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .upstream-actions :global(.upstream-action) {
    height: 1.75rem;
    padding: 0 0.35rem;
    gap: 0.3rem;
  }
  .upstream-actions :global(.upstream-action svg) {
    width: 1rem;
    height: 1rem;
  }
  .upstream-actions.compact :global(.upstream-action) {
    height: 1.25rem;
  }
  .count {
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
  }
  .count-description {
    display: block;
    font-size: 0.75rem;
  }
</style>
