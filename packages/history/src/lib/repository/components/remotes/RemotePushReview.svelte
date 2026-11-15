<script lang="ts">
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import {
    remoteDisplayUrl,
    remoteTargetLabel,
    type RemoteTargetSettings,
  } from "../../controllers/remotes-settings.js";
  let {
    target,
    busy = false,
    onPush,
    onClose,
  }: {
    target: RemoteTargetSettings;
    busy?: boolean;
    onPush(id: string): void;
    onClose(): void;
  } = $props();
  const label = $derived(remoteTargetLabel(target.target));
</script>

<Dialog.Root
  open={Boolean(target.review)}
  onOpenChange={(open) => {
    if (!open && !busy) onClose();
  }}
>
  <Dialog.Content
    onEscapeKeydown={(event) => {
      if (busy) event.preventDefault();
    }}
  >
    <Dialog.Header>
      <Dialog.Title>Push to {label.toLowerCase()}?</Dialog.Title>
      <Dialog.Description
        >Publish only the reviewed commit and its required ancestry. Unsaved files are not included.</Dialog.Description
      >
    </Dialog.Header>
    {#if target.review && target.connection}
      <dl>
        <dt>Remote</dt>
        <dd>{target.connection.name} · {remoteDisplayUrl(target.connection.url)}</dd>
        <dt>Branch</dt>
        <dd>{target.connection.branch}</dd>
        {#if target.target === "original"}<dt>Local bookmark</dt>
          <dd>{target.connection.bookmark}</dd>{/if}
        <dt>Commit</dt>
        <dd><code>{target.review.commit}</code></dd>
        <dt>Summary</dt>
        <dd>{target.review.summary}</dd>
        <dt>Update</dt>
        <dd>
          {target.review.outgoing} outgoing commits · {target.review.remoteCommit
            ? "Update existing branch"
            : "Create remote branch"}
        </dd>
      </dl>
      <p>Other branches stay unchanged. A changed remote requires a fresh review.</p>
      <Dialog.Footer>
        <Button variant="outline" disabled={busy} onclick={onClose}>Cancel</Button>
        <Button disabled={busy} onclick={() => onPush(target.review!.id)}
          >{busy
            ? "Pushing…"
            : `Push to ${target.connection.name}/${target.connection.branch}`}</Button
        >
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<style>
  dl {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.65rem 1rem;
    font-size: 0.875rem;
  }
  dt {
    color: var(--muted-foreground);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: 0.8rem;
  }
</style>
