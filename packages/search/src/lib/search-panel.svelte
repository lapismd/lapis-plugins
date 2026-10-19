<script lang="ts">
  import "./search-panel.css";
  import {
    canCollectSearchQueryTerms,
    collectSearchQueryTerms,
    createVaultSearchFilterSyntax,
    parseSearchQueryAst,
    searchQueryLanguageSupport,
    Notice,
    type App,
    type SearchResultScope,
    type EditorPosition,
    type TFile,
    TextFileView,
    WorkspaceLeaf,
  } from "@lapis-notes/api";
  import { SearchFilterBar } from "@lapismd/design-core/filter";
  import {
    FilterCommandPicker,
    type FilterCommandOption,
  } from "@lapismd/design-core/forms/filter-command-picker";
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Collapsible from "@lapismd/design-core/shadcn/collapsible";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import * as Sidebar from "@lapismd/design-core/shadcn/sidebar";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import ChevronsUpDown from "@lucide/svelte/icons/chevrons-up-down";
  import Copy from "@lucide/svelte/icons/copy";
  import FileText from "@lucide/svelte/icons/file-text";
  import Hash from "@lucide/svelte/icons/hash";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import { onMount, untrack } from "svelte";
  import HighlightedText from "./highlighted-text.svelte";
  import {
    expandSearchMatchContext,
    sliceSearchMatchContext,
    type SearchMatchContextDirection,
  } from "./search-match-context";
  import type { SearchManager, SearchRuntimeStatus } from "./search-manager";
  import {
    SEARCH_VIEW_SORT_OPTIONS,
    type SearchPluginSettings,
    type SearchPluginSettingsPatch,
    type SearchResultFacet,
    type SearchRetrievalMode,
    resolveSearchRetrievalModeForQuery,
    resolveSearchSnippetLength,
  } from "./search-settings";
  import { formatSearchViewSortLabel, sortSearchResults } from "./search-sort";
  import {
    searchResultFromHit,
    type SearchMatch,
    type SearchResult,
  } from "./search-result-model";
  import { SearchViewType } from "./search-view-type";

  import {
    SearchProviderController,
    searchProviderFields,
    type ProviderResults,
  } from "./search-provider-controller";
  import { groupProviderResults } from "./search-provider-groups";
  import SearchHistoryVersions from "./search-history-versions.svelte";

  type SearchPanelPlugin = {
    searchManager: SearchManager;
    getSettings(): SearchPluginSettings;
    updateSettings(patch: SearchPluginSettingsPatch): Promise<void>;
    refreshIndex(reason?: string): Promise<SearchRuntimeStatus>;
  };

  const RESULT_FACET_OPTIONS = [
    { value: "all", label: "All" },
    { value: "markdown", label: "Markdown" },
    { value: "canvas", label: "Canvas" },
  ] satisfies FilterCommandOption[];

  const RETRIEVAL_MODE_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "lexical", label: "Lexical" },
    { value: "vector", label: "Vector" },
    { value: "hybrid", label: "Hybrid" },
  ] satisfies FilterCommandOption[];

  let {
    app,
    initialQuery = "",
    initialScope = "files",
  }: {
    app: App;
    initialQuery?: string;
    initialScope?: SearchResultScope;
  } = $props();

  const plugin = untrack(() => {
    const registered = app.plugins.plugins.get("search") as
      | SearchPanelPlugin
      | undefined;
    if (!registered) throw new Error("Search plugin is not registered");
    return registered;
  });

  let query = $state("");
  let scope = $state<SearchResultScope>(untrack(() => initialScope));
  let providerRows = $state<ProviderResults[]>([]);
  const providerController = untrack(
    () =>
      new SearchProviderController(
        app.searchResultProviders,
        (error) =>
          new Notice(
            `History search failed: ${error instanceof Error ? error.message : String(error)}`,
            undefined,
            app,
          ),
      ),
  );
  const reportProviderError = (error: unknown) => {
    new Notice(
      `History search failed: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      app,
    );
  };
  const historyGroups = $derived(groupProviderResults(providerRows));
  const historyCount = $derived(
    historyGroups.reduce((sum, group) => sum + group.versions.length, 0),
  );
  const historyPending = $derived(
    providerRows.some(
      (row) => row.busy || row.next || row.status?.complete === false,
    ),
  );
  const parsedQuery = $derived(parseSearchQueryAst(query));
  const currentUnsupported = $derived(
    searchProviderFields(parsedQuery.expression).some((field) =>
      ["author", "after", "before", "commit"].includes(field),
    ),
  );
  const displayGroups = $derived.by(() => {
    const groups = new Map(
      historyGroups.map((history) => [
        history.id,
        {
          id: history.id,
          history,
          current: undefined as SearchResult | undefined,
        },
      ]),
    );
    for (const current of filteredResults) {
      const existing = groups.get(current.file.path);
      if (existing) existing.current = current;
      else
        groups.set(current.file.path, {
          id: current.file.path,
          current,
          history: undefined!,
        });
    }
    const mode = settings.view.sortMode;
    return [...groups.values()].sort((a, b) => {
      if (mode.startsWith("filename"))
        return (
          (mode.endsWith("desc") ? -1 : 1) *
            (a.current?.file.name ?? a.history?.title ?? a.id).localeCompare(
              b.current?.file.name ?? b.history?.title ?? b.id,
              undefined,
              { numeric: true, sensitivity: "base" },
            ) || a.id.localeCompare(b.id)
        );
      const time = (item: typeof a) =>
        item.current
          ? mode.startsWith("created")
            ? item.current.file.stat.ctime
            : item.current.file.stat.mtime
          : (item.history?.versions[0]?.hit.timestamp ?? 0);
      return (
        (mode.endsWith("desc") ? -1 : 1) * (time(a) - time(b)) ||
        a.id.localeCompare(b.id)
      );
    });
  });
  let settings = $state(untrack(() => plugin.getSettings()));
  let results = $state<SearchResult[]>([]);
  let resultCount = $state(0);
  let resultOpenState = $state<Record<string, boolean>>({});
  let contextLoading = $state<Record<string, boolean>>({});
  let resultIdentity = "";
  let searching = $state(false);
  let indexing = $state(false);
  let filtersExpanded = $state(false);
  let metadataTags = $state<string[]>([]);
  let metadataFacetError = $state<string | null>(null);
  let metadataFacetGeneration = 0;
  let searchRevision = 0;
  const resultSummary = $derived(
    searching
      ? "Searching…"
      : scope === "files"
        ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
        : `${scope === "history" ? 0 : resultCount} current · ${historyCount} saved${historyPending ? " loaded" : ""}`,
  );
  const providerSearchKey = $derived(
    JSON.stringify({
      text: query,
      caseSensitive: settings.view.matchCase,
      mode: retrievalModeForQuery(),
      limit: settings.query.resultLimit,
      enabled: scope !== "files",
    }),
  );
  $effect(() => {
    const { enabled, ...input } = JSON.parse(providerSearchKey);
    const timer = window.setTimeout(
      () => providerController.search(input, enabled),
      250,
    );
    return () => window.clearTimeout(timer);
  });
  const databaseRefreshDelayMs = 75;

  const diagnostic = $derived(
    query.trim() ? (parsedQuery.diagnostics[0]?.message ?? null) : null,
  );
  const structuredQuery = $derived(
    Boolean(
      query.trim() &&
        parsedQuery.diagnostics.length === 0 &&
        !canCollectSearchQueryTerms(parsedQuery),
    ),
  );
  const searchRequestKey = $derived(
    JSON.stringify([
      query,
      scope,
      settings.view.matchCase,
      settings.view.showMoreContext,
      settings.view.semanticSearchInStructuredQueries,
      settings.view.retrievalMode,
    ]),
  );
  const explanation = $derived.by(() => {
    if (!query.trim() || !settings.view.explainSearchTerms) return null;
    const terms = (
      canCollectSearchQueryTerms(parsedQuery)
        ? collectSearchQueryTerms(parsedQuery)
        : query.trim().split(/\s+/u).filter(Boolean)
    )
      .slice(0, 8)
      .join(", ");
    return terms
      ? `Matching filenames, paths, tags, metadata, and content for: ${terms}.`
      : "Matching filenames, paths, tags, metadata, and content.";
  });
  const filteredResults = $derived.by(() => {
    if (scope === "history" || currentUnsupported) return [];
    const facet = settings.view.resultFacet;
    const matching = results.filter((result) => {
      if (facet === "all") return true;
      if (facet === "canvas") return result.file.extension === "canvas";
      return ["md", "markdown"].includes(result.file.extension);
    });
    return sortSearchResults(matching, settings.view.sortMode);
  });
  const filterSyntax = $derived.by(() => {
    const files = app.vault.getFiles();
    const paths = [
      ...new Set(files.map((file) => file.parent?.path).filter(Boolean)),
    ]
      .sort()
      .slice(0, 100) as string[];
    const names = files
      .map((file) => file.name)
      .sort()
      .slice(0, 100);
    const syntax = createVaultSearchFilterSyntax({
      fileNames: names,
      paths,
      tags: metadataTags,
    });
    if (scope === "files") return syntax;
    const fields =
      scope === "history"
        ? (syntax.fields?.filter((field) =>
            ["file", "path", "content"].includes(field.name),
          ) ?? [])
        : (syntax.fields ?? []);
    return {
      ...syntax,
      title: "Search syntax",
      fields: [
        ...fields,
        { name: "author", description: "Checkpoint author", operators: [":"] },
        {
          name: "after",
          description: "Checkpoint date on or after (UTC)",
          operators: [":"],
        },
        {
          name: "before",
          description: "Checkpoint date on or before (UTC)",
          operators: [":"],
        },
        {
          name: "commit",
          description: "Checkpoint revision",
          operators: [":"],
        },
      ],
    };
  });

  async function refreshMetadataFacets(): Promise<void> {
    const generation = ++metadataFacetGeneration;
    metadataFacetError = null;
    try {
      const rows = await app.metadataCache.queryFacets({
        kind: "tag",
        limit: 100,
      });
      if (generation !== metadataFacetGeneration) return;
      metadataTags = rows
        .flatMap((row) =>
          typeof row.value === "string"
            ? [`#${row.value.replace(/^#/u, "")}`]
            : [],
        )
        .sort();
    } catch (error) {
      if (generation !== metadataFacetGeneration) return;
      metadataFacetError =
        error instanceof Error ? error.message : String(error);
    }
  }

  export function setSearchScope(next: SearchResultScope): void {
    scope = next;
  }

  export function setSearchQuery(next: string): void {
    query = next;
  }

  function retrievalModeForQuery(): SearchRetrievalMode {
    return resolveSearchRetrievalModeForQuery(
      settings.view.retrievalMode,
      structuredQuery,
      settings.view.semanticSearchInStructuredQueries,
    );
  }

  function snippetLength(): number {
    return resolveSearchSnippetLength(
      settings.query.snippetLength,
      settings.view.showMoreContext,
    );
  }

  let openQuery = "";
  $effect(() => {
    if (openQuery !== query) {
      openQuery = query;
      resultOpenState = {};
    }
  });
  function refreshOpenState(items: SearchResult[], identity: string): void {
    if (identity === resultIdentity) return;
    resultIdentity = identity;
    const defaultOpen = !settings.view.collapseResults;
    const previous = openQuery === query ? resultOpenState : {};
    openQuery = query;
    resultOpenState = {
      ...previous,
      ...Object.fromEntries(
        items.map((item) => [
          item.file.path,
          previous[item.file.path] ?? defaultOpen,
        ]),
      ),
    };
  }

  function setResultOpen(path: string, open: boolean): void {
    resultOpenState = { ...resultOpenState, [path]: open };
  }

  async function rememberSearch(value: string): Promise<void> {
    const term = value.trim();
    if (!term) return;
    const recentSearches = [
      term,
      ...settings.view.recentSearches.filter((item) => item !== term),
    ].slice(0, 10);
    if (
      recentSearches.length === settings.view.recentSearches.length &&
      recentSearches.every(
        (item, index) => item === settings.view.recentSearches[index],
      )
    ) {
      return;
    }
    await patchSettings({ view: { recentSearches } });
  }

  async function patchSettings(
    patch: SearchPluginSettingsPatch,
  ): Promise<void> {
    await plugin.updateSettings(patch);
    settings = plugin.getSettings();
    if (patch.view?.collapseResults !== undefined) {
      const defaultOpen = !settings.view.collapseResults;
      resultOpenState = Object.fromEntries(
        displayGroups.map((group) => [group.id, defaultOpen]),
      );
    }
  }

  async function executeSearch(term: string, revision: number): Promise<void> {
    if (
      !term.trim() ||
      diagnostic ||
      scope === "history" ||
      currentUnsupported
    ) {
      results = [];
      resultCount = 0;
      searching = false;
      refreshOpenState([], term.trim());
      return;
    }
    searching = true;
    try {
      const response = await plugin.searchManager.query({
        term,
        caseSensitive: settings.view.matchCase,
        snippetLength: snippetLength(),
        mode: retrievalModeForQuery(),
      });
      if (revision !== searchRevision) return;
      const nextResults = response.hits
        .map((hit) => searchResultFromHit(app, hit))
        .filter((result): result is SearchResult => result !== null);
      resultCount = nextResults.length;
      const identity = `${term}\u0000${nextResults
        .map(
          (result) =>
            `${result.file.path}:${result.hit.document.checksum}:${result.matches.length}`,
        )
        .join("\u0000")}`;
      if (identity !== resultIdentity) results = nextResults;
      refreshOpenState(nextResults, identity);
      void rememberSearch(term);
    } finally {
      if (revision === searchRevision) searching = false;
    }
  }

  $effect(() => {
    const requestKey = searchRequestKey;
    const term = query;
    const revision = ++searchRevision;
    const timer = window.setTimeout(() => {
      if (requestKey !== searchRequestKey) return;
      void executeSearch(term, revision);
    }, 250);
    return () => window.clearTimeout(timer);
  });

  async function refreshIndex(): Promise<void> {
    providerController.refresh();
    if (indexing) return;
    indexing = true;
    try {
      await plugin.refreshIndex("search-panel");
      const revision = ++searchRevision;
      await executeSearch(query, revision);
    } finally {
      indexing = false;
    }
  }

  async function copySearchResults(): Promise<void> {
    const lines = filteredResults.flatMap((result) => [
      result.file.path,
      ...result.matches.map((match) => `  ${match.key}: ${match.text}`),
    ]);
    lines.push(
      ...providerRows.flatMap((row) =>
        row.hits.flatMap((hit) => [
          hit.path ?? hit.title,
          ...hit.matches.map((match) => `  ${match.field}: ${match.text}`),
        ]),
      ),
    );
    const text = lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      new Notice("Search results copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      new Notice(
        copied ? "Search results copied" : "Unable to copy search results",
      );
    }
  }

  function mainLeaf(): WorkspaceLeaf {
    const selected = app.workspace.rootSplit.iterateAllTabs((tabs) => {
      const child = tabs.children[tabs.selectedIndex] ?? tabs.children[0];
      return child instanceof WorkspaceLeaf ? child : child?.getSelectedLeaf();
    });
    return selected?.view.getViewType() === SearchViewType
      ? app.workspace.getLeaf("tab")
      : (selected ?? app.workspace.getLeaf("tab"));
  }

  async function openResult(
    result: SearchResult,
    pos?: EditorPosition,
  ): Promise<void> {
    const leaf = mainLeaf();
    await leaf.openFile(result.file);
    app.workspace.activeLeaf = leaf;
    app.workspace.revealLeaf(leaf);
    if (pos && leaf.view instanceof TextFileView)
      leaf.view.editor.setCursor(pos);
  }

  async function expandMatchContext(
    result: SearchResult,
    match: SearchMatch,
    direction: SearchMatchContextDirection,
  ): Promise<void> {
    if (!match.context) return;
    const loadingKey = `${result.file.path}\u0000${match.id}`;
    if (contextLoading[loadingKey]) return;
    contextLoading = { ...contextLoading, [loadingKey]: true };
    try {
      const indexedSource = result.hit.document.content;
      let source = indexedSource;
      try {
        const currentSource = await app.vault.cachedRead(result.file);
        const expectedSlice = indexedSource.slice(
          match.context.start,
          match.context.end,
        );
        if (
          currentSource.slice(match.context.start, match.context.end) ===
          expectedSlice
        ) {
          source = currentSource;
        }
      } catch {
        // The indexed source remains a valid fallback for the visible result.
      }

      const expanded = expandSearchMatchContext(
        source,
        match.context,
        direction,
      );
      const sliced = sliceSearchMatchContext(source, expanded);
      results = results.map((currentResult) =>
        currentResult.hit !== result.hit
          ? currentResult
          : {
              ...currentResult,
              matches: currentResult.matches.map((currentMatch) =>
                currentMatch.id === match.id
                  ? {
                      ...currentMatch,
                      ...sliced,
                      context: {
                        ...expanded,
                        sourceLength: source.length,
                      },
                    }
                  : currentMatch,
              ),
            },
      );
    } finally {
      contextLoading = { ...contextLoading, [loadingKey]: false };
    }
  }

  onMount(() => {
    query = initialQuery;
    const unsubscribeProviders = providerController.subscribe(
      (rows) => (providerRows = rows),
    );
    void refreshMetadataFacets();
    let databaseRefreshTimer: number | undefined;
    const databaseChanged = app.appDatabase.subscribeToChanges((change) => {
      if (!change.reset && !change.domains.includes("search")) return;
      window.clearTimeout(databaseRefreshTimer);
      databaseRefreshTimer = window.setTimeout(() => {
        const revision = ++searchRevision;
        void executeSearch(query, revision);
      }, databaseRefreshDelayMs);
    });
    const changed = app.metadataCache.on("index-changed", (change) => {
      if (change.reset || change.domains.includes("metadata")) {
        void refreshMetadataFacets();
      }
    });
    const loaded = app.metadataCache.on(
      "loaded",
      () => void refreshMetadataFacets(),
    );
    return () => {
      unsubscribeProviders();
      providerController.close();
      searchRevision += 1;
      metadataFacetGeneration += 1;
      window.clearTimeout(databaseRefreshTimer);
      databaseChanged();
      app.metadataCache.offref(changed);
      app.metadataCache.offref(loaded);
    };
  });
</script>

<div
  class="search-panel"
  data-testid="search-panel"
  data-ui-component="search-panel"
>
  <div class="search-panel__chrome" data-ui-part="chrome">
    <div class="search-panel__query-row">
      <SearchFilterBar
        value={query}
        inputMode="filter-query"
        {filterSyntax}
        editorExtensions={[searchQueryLanguageSupport()]}
        error={diagnostic}
        showFilterToggle
        bind:filtersExpanded
        ariaLabel="Search vault"
        placeholder="Search all files…"
        onValueChange={(value) => (query = value)}
        onClearSearch={() => {
          query = "";
        }}
      >
        {#snippet actions()}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Refresh search index"
            disabled={indexing}
            onclick={refreshIndex}
          >
            <RefreshCw aria-hidden="true" />
          </Button>
        {/snippet}
        {#snippet filters()}
          <div class="search-panel__filters">
            <FilterCommandPicker
              label="File type"
              ariaLabel="Filter by file type"
              options={RESULT_FACET_OPTIONS}
              value={settings.view.resultFacet}
              onChange={(value) =>
                patchSettings({
                  view: { resultFacet: value as SearchResultFacet },
                })}
            />
            <FilterCommandPicker
              label="Retrieval"
              ariaLabel="Filter by retrieval mode"
              options={RETRIEVAL_MODE_OPTIONS}
              value={settings.view.retrievalMode}
              onChange={(value) =>
                patchSettings({
                  view: { retrievalMode: value as SearchRetrievalMode },
                })}
            />
            <section
              class="search-panel__settings"
              aria-label="Search view settings"
            >
              <label>
                <span>Match case</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.matchCase,
                    (checked) =>
                      void patchSettings({ view: { matchCase: checked } })
                  }
                />
              </label>
              <label>
                <span>Collapse results</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.collapseResults,
                    (checked) =>
                      void patchSettings({ view: { collapseResults: checked } })
                  }
                />
              </label>
              <label>
                <span>Show more context</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.showMoreContext,
                    (checked) =>
                      void patchSettings({ view: { showMoreContext: checked } })
                  }
                />
              </label>
              <label>
                <span>Explain search terms</span>
                <Switch
                  size="sm"
                  bind:checked={
                    () => settings.view.explainSearchTerms,
                    (checked) =>
                      void patchSettings({
                        view: { explainSearchTerms: checked },
                      })
                  }
                />
              </label>
              <label class="search-panel__structured-semantic">
                <span>
                  <strong>Semantic search in structured queries</strong>
                  <small
                    >Allow semantic candidates alongside filters, OR, and
                    negation.</small
                  >
                </span>
                <Switch
                  size="sm"
                  aria-label="Semantic search in structured queries"
                  bind:checked={
                    () => settings.view.semanticSearchInStructuredQueries,
                    (checked) =>
                      void patchSettings({
                        view: { semanticSearchInStructuredQueries: checked },
                      })
                  }
                />
              </label>
            </section>
          </div>
        {/snippet}
      </SearchFilterBar>
    </div>
    {#if metadataFacetError}
      <p class="search-panel__empty" role="alert">
        Unable to load metadata facets: {metadataFacetError}
      </p>
    {/if}

    <div class="search-panel__source">
      <FilterCommandPicker
        label={`${scope === "files" ? "Current files" : scope === "history" ? "History" : "Everything"} search source`}
        value={scope}
        options={[
          { value: "files", label: "Current files" },
          { value: "history", label: "History" },
          { value: "all", label: "Everything" },
        ]}
        onChange={(value: string) => {
          scope = value as SearchResultScope;
        }}
      />
    </div>
    <div class="search-panel__summary">
      <Button
        variant="ghost"
        size="sm"
        class="search-panel__summary-control"
        aria-label={`Copy search results: ${resultSummary}`}
        disabled={!filteredResults.length && !historyCount}
        onclick={copySearchResults}
      >
        <Copy aria-hidden="true" />
        {resultSummary}
      </Button>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="sm"
              class="search-panel__summary-control search-panel__sort"
              aria-label={formatSearchViewSortLabel(settings.view.sortMode)}
            >
              <span class="search-panel__sort-label"
                >{formatSearchViewSortLabel(settings.view.sortMode)}</span
              >
              <ChevronsUpDown aria-hidden="true" />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="end" class="search-panel__sort-popover">
          {#each SEARCH_VIEW_SORT_OPTIONS as option (option.value)}
            <Button
              variant={option.value === settings.view.sortMode
                ? "secondary"
                : "ghost"}
              class="search-panel__sort-option"
              onclick={() =>
                void patchSettings({ view: { sortMode: option.value } })}
              >{option.label}</Button
            >
          {/each}
        </Popover.Content>
      </Popover.Root>
    </div>

    {#if scope !== "files"}
      {#if !providerRows.length && query.trim()}<p
          class="search-panel__explanation"
        >
          History search is unavailable. Enable Repository History to search
          saved versions.
        </p>{/if}
      {#each providerRows as row (row.provider.id)}
        {#if row.unavailable}<p class="search-panel__explanation">
            {row.provider.label}: {row.unavailable}
          </p>{/if}
        {#if row.status?.omitted}<p class="search-panel__explanation">
            {row.status.omitted} file versions are searchable by path only.
          </p>{/if}
        {#if row.status?.complete === false}<p
            class="search-panel__explanation"
            role="status"
          >
            {row.status.description ??
              `Indexing history · ${row.status.indexed} checkpoints ready`}
          </p>{/if}
      {/each}
    {/if}
    {#if currentUnsupported && scope !== "history"}<p
        class="search-panel__explanation"
      >
        Current files do not support checkpoint author, date or revision
        filters.
      </p>{/if}
    {#if explanation}
      <p class="search-panel__explanation">{explanation}</p>
    {/if}
  </div>

  <ScrollArea class="search-panel__scroll-area">
    <Sidebar.Content class="search-panel__results" data-ui-part="content">
      {#if !query.trim()}
        <p class="search-panel__empty">Type to search.</p>
      {:else if providerRows.some((row) => row.busy) && displayGroups.length === 0}
        <div
          class="search-panel__loading"
          role="status"
          aria-label="Searching saved history"
        >
          {#each Array(4) as _}<Skeleton
              class="search-panel__loading-title"
            /><Skeleton class="search-panel__loading-snippet" />{/each}
        </div>
      {:else if !searching && !historyPending && !providerRows.some((row) => row.unavailable) && !diagnostic && displayGroups.length === 0}
        <p class="search-panel__empty">No matches found.</p>
      {:else}
        <div class="search-panel__tree-inset">
          <Sidebar.Menu
            role="tree"
            aria-label="Search results"
            class="search-panel__tree"
          >
            {#each displayGroups as display (display.id)}
              {@const result = display.current}
              {@const path =
                result?.file.path ?? display.history?.path ?? display.id}
              {@const open =
                resultOpenState[display.id] ?? !settings.view.collapseResults}
              <Sidebar.MenuItem role="none" class="search-panel__tree-item">
                <Collapsible.Root
                  {open}
                  onOpenChange={(next) => setResultOpen(display.id, next)}
                  class="search-panel__result"
                >
                  <Collapsible.Trigger
                    class="search-panel__file"
                    role="treeitem"
                    aria-level={1}
                    aria-selected="false"
                    aria-expanded={open}
                    aria-label={result
                      ? `${result.file.basename} ${(result?.matches.length ?? 0) + (display.history?.versions.length ?? 0)} · ${path}, ${(result?.matches.length ?? 0) + (display.history?.versions.length ?? 0)} matches`
                      : `${display.history?.title ?? path} ${display.history?.versions.length ?? 0} · ${path}, ${display.history?.versions.length ?? 0} saved versions`}
                  >
                    <ChevronRight
                      class="search-panel__disclosure"
                      aria-hidden="true"
                    />
                    {#if (result?.file.extension ?? display.history?.extension) === "canvas"}
                      <Hash
                        class="search-panel__file-icon"
                        aria-hidden="true"
                      />
                    {:else}
                      <FileText
                        class="search-panel__file-icon"
                        aria-hidden="true"
                      />
                    {/if}
                    <span class="search-panel__file-label">
                      <HighlightedText
                        text={result?.file.basename ??
                          display.history?.title ??
                          path}
                        ranges={result?.title?.ranges ?? []}
                      />
                    </span>
                    <Sidebar.MenuBadge class="search-panel__count-badge">
                      {(result?.matches.length ?? 0) +
                        (display.history?.versions.length ?? 0)}
                    </Sidebar.MenuBadge>
                  </Collapsible.Trigger>
                  <Collapsible.Content class="search-panel__match-list">
                    <div class="search-panel__match-header">
                      <span class="search-panel__match-path" title={path}>
                        {path}
                      </span>
                      <Badge variant="outline" class="search-panel__mode-badge">
                        {result?.hit.retrievalMode ?? "lexical"}
                      </Badge>
                      {#if display.history && result}<Badge variant="outline"
                          >Current</Badge
                        >{/if}
                    </div>
                    <Sidebar.MenuSub role="group">
                      {#each result?.matches ?? [] as match, index (`${display.id}:${index}`)}
                        {@const currentResult = result!}
                        <Sidebar.MenuSubItem role="none">
                          {@const loadingKey = `${path}\u0000${match.id}`}
                          <div
                            class="search-panel__match-shell"
                            role="treeitem"
                            tabindex="0"
                            aria-level="2"
                            aria-selected="false"
                            data-context-before={Boolean(match.context?.start)}
                            data-context-after={Boolean(
                              match.context &&
                                match.context.end < match.context.sourceLength,
                            )}
                            onclick={() => openResult(currentResult, match.pos)}
                            onkeydown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ")
                                return;
                              event.preventDefault();
                              void openResult(currentResult, match.pos);
                            }}
                          >
                            {#if match.context?.start}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                class="search-panel__context-control search-panel__context-control--before"
                                aria-label="Show more context before this match"
                                disabled={contextLoading[loadingKey]}
                                onclick={(event) => {
                                  event.stopPropagation();
                                  void expandMatchContext(
                                    currentResult,
                                    match,
                                    "before",
                                  );
                                }}
                              >
                                <ChevronUp aria-hidden="true" />
                              </Button>
                            {/if}
                            <div class="search-panel__match">
                              <span class="search-panel__match-text">
                                <HighlightedText
                                  text={match.text}
                                  ranges={match.ranges}
                                />
                              </span>
                              <span class="search-panel__match-meta">
                                <Badge
                                  variant="outline"
                                  class="search-panel__match-key"
                                >
                                  {match.key}
                                </Badge>
                              </span>
                            </div>
                            {#if match.context && match.context.end < match.context.sourceLength}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                class="search-panel__context-control search-panel__context-control--after"
                                aria-label="Show more context after this match"
                                disabled={contextLoading[loadingKey]}
                                onclick={(event) => {
                                  event.stopPropagation();
                                  void expandMatchContext(
                                    currentResult,
                                    match,
                                    "after",
                                  );
                                }}
                              >
                                <ChevronDown aria-hidden="true" />
                              </Button>
                            {/if}
                          </div>
                        </Sidebar.MenuSubItem>
                      {/each}
                    </Sidebar.MenuSub>
                    {#if display.history}<SearchHistoryVersions
                        versions={display.history.versions}
                        report={reportProviderError}
                      />{/if}
                  </Collapsible.Content>
                </Collapsible.Root>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </div>
      {/if}
      {#each providerRows.filter((row) => row.next) as row (row.provider.id)}
        <Button
          variant="ghost"
          size="sm"
          disabled={row.busy}
          onclick={() => providerController.more(row.provider.id)}
          >{row.busy ? "Searching history…" : "Search older history"}</Button
        >
      {/each}
    </Sidebar.Content>
  </ScrollArea>
</div>
