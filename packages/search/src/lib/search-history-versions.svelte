<script lang="ts">
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import type {
    SearchProviderHit,
    SearchProviderMatch,
    SearchResultProvider,
  } from "@lapis-notes/api";
  import type { ProviderVersion } from "./search-provider-groups";
  import HighlightedText from "./highlighted-text.svelte";
  import { onDestroy } from "svelte";
  const treeId = $props.id();
  let {
    versions,
    report,
  }: { versions: ProviderVersion[]; report(error: unknown): void } = $props();
  let expanded = $state<Record<string, boolean>>({});
  let contexts = $state<Record<string, SearchProviderMatch>>({});
  let loading = $state<Record<string, boolean>>({});
  const abort = new AbortController();
  onDestroy(() => abort.abort());
  const key = (provider: SearchResultProvider, hit: SearchProviderHit) =>
    `${provider.id}/${hit.id}`;
  async function open(
    provider: SearchResultProvider,
    hit: SearchProviderHit,
    match?: SearchProviderMatch,
  ) {
    try {
      await provider.activate(hit, match);
    } catch (error) {
      report(error);
    }
  }
  async function context(
    provider: SearchResultProvider,
    hit: SearchProviderHit,
    match: SearchProviderMatch,
    direction: "before" | "after",
  ) {
    if (!provider.expand) return;
    const id = `${key(provider, hit)}/${match.id}`;
    loading[id] = true;
    try {
      const next = await provider.expand(hit, match, direction, abort.signal);
      if (!abort.signal.aborted) contexts[id] = next;
    } catch (error) {
      if (!abort.signal.aborted) report(error);
    } finally {
      if (!abort.signal.aborted) loading[id] = false;
    }
  }
</script>

<Sidebar.MenuSub role="group" class="search-panel__history-list">
  {#each versions as { provider, hit }, index (`${provider.id}/${hit.id}`)}
    {@const id = key(provider, hit)}
    <Sidebar.MenuSubItem
      role="treeitem"
      aria-selected="false"
      aria-level={2}
      aria-expanded={expanded[id] ?? false}
    >
      <Collapsible.Root
        open={expanded[id] ?? false}
        onOpenChange={(value) => (expanded[id] = value)}
      >
        <Collapsible.Trigger
          class="search-panel__history-version"
          id={`${treeId}-${index}-label`}
          aria-label={`History ${hit.version?.label ?? hit.title}${hit.timestamp ? ` ${new Date(hit.timestamp).toLocaleDateString()}` : ""}`}
          aria-expanded={expanded[id] ?? false}
          onkeydown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              expanded[id] = event.key === "ArrowRight";
            }
          }}
        >
          <ChevronRight class="search-panel__disclosure" aria-hidden="true" />
          <Badge variant="outline">History</Badge>
          <span class="search-panel__history-label"
            >{hit.version?.label ?? hit.title}</span
          >
          {#if hit.timestamp}<time
              datetime={new Date(hit.timestamp).toISOString()}
              >{new Date(hit.timestamp).toLocaleDateString()}</time
            >{/if}
        </Collapsible.Trigger>
        <Collapsible.Content
          class="search-panel__history-content"
          role="group"
          id={`${treeId}-${index}`}
        >
          <div class="search-panel__history-details">
            <Button
              variant="ghost"
              size="sm"
              onclick={() => open(provider, hit)}
              aria-label={`Open saved version ${hit.version?.label ?? hit.title}: ${hit.version?.author ?? provider.label}${hit.version ? ` · ${hit.version.id.slice(0, 12)}` : ""}`}
            >
              {hit.version?.author ?? provider.label}{hit.version
                ? ` · ${hit.version.id.slice(0, 12)}`
                : ""}
            </Button>
            {#each hit.badges ?? [] as badge}<Badge variant="outline"
                >{badge}</Badge
              >{/each}
            {#if (hit.version?.occurrences ?? 0) > 1}<Badge variant="outline"
                >{hit.version?.occurrences} checkpoints</Badge
              >{/if}
          </div>
          {#if hit.version?.references && hit.version.references.length > 1}
            <div
              class="search-panel__history-details"
              aria-label="Matching checkpoints"
            >
              {#each hit.version.references as reference (reference.id)}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() =>
                    open(provider, { ...hit, target: reference.target })}
                  >{reference.id.slice(0, 12)} · {new Date(
                    reference.timestamp,
                  ).toLocaleDateString()}</Button
                >
              {/each}
            </div>
          {/if}
          <Sidebar.MenuSub role="group" class="search-panel__history-matches">
            {#each hit.matches as original (original.id)}
              {@const matchId = `${id}/${original.id}`}
              {@const match = contexts[matchId] ?? original}
              <Sidebar.MenuSubItem role="none">
                <div
                  class="search-panel__match-shell"
                  role="treeitem"
                  aria-selected="false"
                  aria-level={3}
                  aria-label={`${match.text} ${match.field}`}
                  tabindex={0}
                  onclick={() => open(provider, hit, match)}
                  onkeydown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void open(provider, hit, match);
                    }
                  }}
                >
                  {#if match.context && provider.expand}<Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Show more context before this saved match"
                      disabled={loading[matchId]}
                      onclick={(event) => {
                        event.stopPropagation();
                        void context(provider, hit, match, "before");
                      }}><ChevronUp aria-hidden="true" /></Button
                    >{/if}
                  <div class="search-panel__match">
                    <span class="search-panel__match-text"
                      ><HighlightedText
                        text={match.text}
                        ranges={match.ranges}
                      /></span
                    >
                    <span class="search-panel__match-meta"
                      ><Badge variant="outline" class="search-panel__match-key"
                        >{match.field}</Badge
                      ></span
                    >
                  </div>
                  {#if match.context && provider.expand}<Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Show more context after this saved match"
                      disabled={loading[matchId]}
                      onclick={(event) => {
                        event.stopPropagation();
                        void context(provider, hit, match, "after");
                      }}><ChevronDown aria-hidden="true" /></Button
                    >{/if}
                </div>
              </Sidebar.MenuSubItem>
            {/each}
          </Sidebar.MenuSub>
        </Collapsible.Content>
      </Collapsible.Root>
    </Sidebar.MenuSubItem>
  {/each}
</Sidebar.MenuSub>
