<script lang="ts">
  import type { RepositoryRemotes } from "../repository-remotes.svelte.js";
  import RemotePushReview from "./RemotePushReview.svelte";
  let { owner, portalTarget }: { owner: RepositoryRemotes; portalTarget: HTMLElement } = $props();
  const target = $derived(owner.review);
</script>

{#if target?.review}
  <RemotePushReview
    {target}
    {portalTarget}
    busy={target.busy === "pushing"}
    onClose={() => owner.actions.dismissReview(target.target)}
    onPush={id => owner.run(() => owner.actions.push(target.target, id))}
  />
{/if}
