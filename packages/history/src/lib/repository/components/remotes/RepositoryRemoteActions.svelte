<script lang="ts">
  import RepositoryUpstreamActions from "../RepositoryUpstreamActions.svelte";
  import {
    remoteTargetLabel,
    type RemoteTargetSettings,
    type RepositoryUpstreamBinding,
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
  const remote: RepositoryUpstreamBinding = $derived({
    target,
    fetch: onFetch,
    push: onPush,
    manage: onManage,
  });
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
  <RepositoryUpstreamActions {remote} unavailable={disabled} />
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
</style>
