<script lang="ts">
  import { untrack } from "svelte";
  import {
    MergeEditor,
    type MergeResolvedChange,
  } from "@lapismd/design-core/diff";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import type { SyncSession } from "../presentation/session";
  import type { SyncSnapshot, MergeResolution } from "../presentation/types";
  let { snapshot, session }: { snapshot: SyncSnapshot; session: SyncSession } =
    $props();
  let selectedId = $state<string | null>(null);
  let resolvedText = $state("");
  let editorBase = $state("");
  let resolvedReady = $state(false);
  const draft = $derived(snapshot.mergeDraft);
  const selected = $derived(
    draft?.conflicts.find((c) => c.id === selectedId) ??
      draft?.conflicts[0] ??
      null,
  );
  const selectionKey = $derived(`${draft?.id ?? ""}:${selected?.id ?? ""}`);
  const unresolved = $derived(
    draft?.conflicts.filter((c) => !draft.resolutions[c.id]).length ?? 0,
  );
  $effect(() => {
    void selectionKey;
    untrack(() => {
      selectedId = selected?.id ?? null;
      const saved = selected ? draft?.resolutions[selected.id] : null;
      resolvedText =
        saved?.choice === "resolved" ? saved.content : (selected?.base ?? "");
      resolvedReady = saved?.choice === "resolved";
      editorBase = resolvedText;
    });
  });
  function choose(resolution: MergeResolution): void {
    if (!draft || !selected) return;
    void session.run({
      type: "resolve-merge",
      draftId: draft.id,
      conflictId: selected.id,
      resolution,
    });
  }
  function onResolved(change: MergeResolvedChange): void {
    resolvedText = change.content;
    resolvedReady = change.resolved;
  }
</script>

<ScrollArea class="sync-merge-scroll" fillContent>
  <section
    class="sync-merge-workspace"
    data-testid="sync-merge-workspace"
    aria-label="Merge device histories"
  >
    <header>
      <div>
        <h2>Merge device histories</h2>
        <p>{unresolved} unresolved conflict{unresolved === 1 ? "" : "s"}</p>
      </div>
      <Button
        variant="outline"
        disabled={!draft || unresolved > 0 || !session.can("publish-merge")}
        onclick={() =>
          draft &&
          void session.run({ type: "publish-merge", draftId: draft.id })}
        >Publish merge revision</Button
      >
    </header>
    {#if !draft}<p>
        No merge draft is active. Run Sync now to reconcile device histories.
      </p>
    {:else if !draft.conflicts.length}<p>All changes resolved automatically.</p>
    {:else}
      <nav aria-label="Merge conflicts">
        {#each draft.conflicts as conflict (conflict.id)}
          <Button
            variant="outline"
            aria-current={selected?.id === conflict.id ? "true" : undefined}
            onclick={() => (selectedId = conflict.id)}
            >{conflict.path} · {conflict.kind}{draft.resolutions[conflict.id]
              ? " · resolved"
              : ""}</Button
          >
        {/each}
      </nav>
      {#if selected}
        <article>
          <h3>{selected.path}</h3>
          <p>{selected.kind.replaceAll("-", " ")}</p>
          {#if !selected.binary}
            {#key selectionKey}
              <MergeEditor
                mode="three-way"
                path={selected.path}
                left={selected.left ?? ""}
                base={editorBase}
                right={selected.right ?? ""}
                leftLabel="Local device"
                baseLabel="Resolved"
                rightLabel="Remote device"
                editable
                editableSides={["base"]}
                onResolvedChange={onResolved}
              />
            {/key}
            <Button
              variant="outline"
              disabled={!resolvedReady || !session.can("resolve-merge")}
              onclick={() =>
                choose({ choice: "resolved", content: resolvedText })}
              >Use resolved text</Button
            >
          {:else}<p>
              Binary content cannot be merged as text. Choose a side, delete it,
              or keep both.
            </p>{/if}
          <div class="sync-row-actions">
            {#if selected.left !== null}<Button
                variant="outline"
                disabled={!session.can("resolve-merge")}
                onclick={() => choose({ choice: "left" })}>Use local</Button
              >{/if}
            {#if selected.right !== null}<Button
                variant="outline"
                disabled={!session.can("resolve-merge")}
                onclick={() => choose({ choice: "right" })}>Use remote</Button
              >{/if}
            {#if selected.base !== null}<Button
                variant="outline"
                disabled={!session.can("resolve-merge")}
                onclick={() => choose({ choice: "base" })}>Use base</Button
              >{/if}
            <Button
              variant="outline"
              disabled={!session.can("resolve-merge")}
              onclick={() => choose({ choice: "delete" })}>Delete</Button
            >
            {#if selected.left !== null && selected.right !== null}<Button
                variant="outline"
                disabled={!session.can("resolve-merge")}
                onclick={() => choose({ choice: "keep-both" })}
                >Keep both</Button
              >{/if}
          </div>
        </article>
      {/if}
    {/if}
  </section>
</ScrollArea>

<style>
  :global(.sync-merge-scroll) {
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  .sync-merge-workspace {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    width: 100%;
    min-height: 100%;
  }
  .sync-merge-workspace > header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
    flex-wrap: wrap;
  }
  .sync-merge-workspace h2,
  .sync-merge-workspace h3,
  .sync-merge-workspace p {
    margin: 0;
  }
  .sync-merge-workspace nav {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    flex-shrink: 0;
  }
  .sync-merge-workspace nav :global([aria-current="true"]) {
    font-weight: 700;
  }
  .sync-merge-workspace article {
    display: grid;
    gap: 0.75rem;
  }
</style>
