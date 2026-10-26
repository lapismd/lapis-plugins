import {
  type App,
  type SearchResultScope,
  Notice,
  Plugin,
  TextFileView,
  type PluginManifest,
} from "@lapis-notes/api";
import { SearchManager, type SearchRuntimeStatus } from "./search-manager";
import {
  CANVAS_SEARCH_DOCUMENT_PROVIDER,
  MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
} from "./built-in-search-document-providers";
import {
  mergeSearchSettings,
  patchSearchSettings,
  resolveSearchEmbeddingProviderConfig,
  type SearchPluginSettings,
  type SearchPluginSettingsPatch,
} from "./search-settings";
import { SearchSettingsTab } from "./search-settings-tab";
import { SearchView, SearchViewType } from "./search-view";
import { createNotesSearchSlashCommand } from "./notes-search-command";
import { createNotesSearchTool } from "./notes-search-tool";
import SearchToolResult from "./search-tool-result.svelte";
import { reconcileSearchAfterMetadata } from "./search-startup";
import manifestSpec from "@lapis-notes/search/manifest.json";
import { observeRecoveredSearchSettings } from "./search-settings-observer";

export class SearchPlugin extends Plugin {
  private settings: SearchPluginSettings;
  private startupRefreshStarted = false;
  private startupRefreshPromise: Promise<void> | null = null;
  private providerReconcileReason: string | null = null;
  private providerReconcilePromise: Promise<void> | null = null;
  private managerStopped = false;
  private currentSearchManager: SearchManager;

  constructor(
    app: App,
    pluginManifest: PluginManifest = manifestSpec as PluginManifest,
  ) {
    super(app, pluginManifest);
    this.settings = mergeSearchSettings(null);
    this.currentSearchManager = new SearchManager(app, () => this.settings);
  }

  get searchManager(): SearchManager {
    return this.currentSearchManager;
  }

  getSettings(): SearchPluginSettings {
    return {
      chunking: { ...this.settings.chunking },
      query: { ...this.settings.query },
      embeddings: { ...this.settings.embeddings },
      view: {
        ...this.settings.view,
        recentSearches: [...this.settings.view.recentSearches],
      },
    };
  }

  async updateSettings(patch: SearchPluginSettingsPatch): Promise<void> {
    const previous = this.settings;
    this.settings = patchSearchSettings(this.settings, patch);
    await this.saveData(this.settings);
    await this.reconfigureSettings(previous);
  }

  private async reconfigureSettings(
    previous: SearchPluginSettings,
  ): Promise<void> {
    const manager = this.searchManager;
    const previousProvider = resolveSearchEmbeddingProviderConfig(previous);
    const nextProvider = resolveSearchEmbeddingProviderConfig(this.settings);
    if (JSON.stringify(previousProvider) !== JSON.stringify(nextProvider)) {
      await this.app.appDatabase.configureSearchEmbeddingProvider(nextProvider);
    }
    if (
      this.app.session?.backgroundIndexing &&
      JSON.stringify(previous.chunking) !==
        JSON.stringify(this.settings.chunking)
    ) {
      await manager.configureIndexing();
    }
  }

  getSearchStatus(): Promise<SearchRuntimeStatus> {
    return this.searchManager.getStatus();
  }

  rebuildSemanticSearch(): Promise<SearchRuntimeStatus> {
    return this.searchManager.refreshFromVault("manual-semantic-rebuild");
  }

  async onload(): Promise<void> {
    if (this.managerStopped) {
      this.currentSearchManager = new SearchManager(
        this.app,
        () => this.settings,
      );
      this.managerStopped = false;
      this.startupRefreshStarted = false;
      this.startupRefreshPromise = null;
      this.providerReconcileReason = null;
      this.providerReconcilePromise = null;
    }
    this.settings = mergeSearchSettings(await this.loadData());
    await this.app.appDatabase.configureSearchEmbeddingProvider(
      resolveSearchEmbeddingProviderConfig(this.settings),
    );
    this.register(
      observeRecoveredSearchSettings(this.app, this.manifest.id, (settings) => {
        if (this.managerStopped) return;
        const previous = this.settings;
        this.settings = settings;
        void this.reconfigureSettings(previous).catch((error) => {
          if (this.nativeObserverDetached()) return;
          new Notice(
            `Search settings recovery failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }),
    );
    this.registerEvent(
      this.app.searchDocumentProviders.on("changed", ({ reason }) => {
        if (this.state !== "enabled") return;
        if (
          this.app.session?.backgroundIndexing &&
          this.app.metadataCache.initialized
        ) {
          this.scheduleProviderReconciliation(`provider-${reason}`);
          return;
        }
        if (
          !this.app.metadataCache.initialized ||
          !this.startupRefreshStarted
        ) {
          return;
        }
        this.scheduleProviderReconciliation(`provider-${reason}`);
      }),
    );
    this.registerSearchDocumentProvider(
      "markdown",
      MARKDOWN_SEARCH_DOCUMENT_PROVIDER,
    );
    this.registerSearchDocumentProvider(
      "canvas",
      CANVAS_SEARCH_DOCUMENT_PROVIDER,
    );
    this.registerAgentTool(createNotesSearchTool(this.searchManager));
    this.registerAgentSlashCommand(createNotesSearchSlashCommand());
    this.registerAgentResultView({
      tool: "notes_search",
      component: SearchToolResult,
    });
    this.addSettingTab(new SearchSettingsTab(this.app, this));
    this.register(this.searchManager.trackChanges());
    this.registerSidebarView(
      SearchViewType,
      (leaf) => new SearchView(leaf),
      { side: "left", title: "Search", icon: "search" },
      {
        kind: "command",
        command: {
          id: "open-search",
          name: "Open Search",
          callback: (query?: string, scope?: SearchResultScope) =>
            this.openSearchInLeftSidebar(query, scope),
        },
      },
    );

    this.registerEvent(
      this.app.metadataCache.on("loaded", () => {
        void this.startupRefresh();
      }),
    );
    if (this.app.metadataCache.initialized) {
      void this.startupRefresh();
    }

    this.addCommand({
      id: "rebuild-semantic-search",
      name: "Rebuild semantic search embeddings",
      callback: async () => {
        const status = await this.rebuildSemanticSearch();
        new Notice(
          `Semantic search refreshed (${status.readyChunkCount}/${status.chunkCount} ready)`,
        );
      },
    });
    this.addCommand({
      id: "search-selected-text",
      name: "Search selected text",
      callback: () => {
        const view = this.app.workspace.activeLeaf?.view;
        const query =
          view instanceof TextFileView ? view.editor.getSelection().trim() : "";
        void this.openSearchInLeftSidebar(query);
      },
    });
    this.addCommand({
      id: "rebuild-search-index",
      name: "Rebuild search index",
      callback: async () => {
        if (!this.app.session?.backgroundIndexing)
          await this.app.appDatabase.rebuildSearchIndex();
        await this.refreshIndex("rebuild");
        new Notice("Search index rebuilt");
      },
    });
    this.addCommand({
      id: "refresh-search-index",
      name: "Refresh search index",
      callback: () => void this.refreshIndex("command"),
    });
  }

  refreshIndex(reason = "manual"): Promise<SearchRuntimeStatus> {
    return this.searchManager.refreshFromVault(reason);
  }

  override async disable(): Promise<void> {
    if (this.app.session?.backgroundIndexing) {
      this.managerStopped = true;
      await this.searchManager.dispose();
    }
    await super.disable();
  }

  async onunload(): Promise<void> {
    this.managerStopped = true;
    await this.searchManager.dispose();
  }

  private startupRefresh(): Promise<void> {
    if (this.startupRefreshPromise) return this.startupRefreshPromise;
    if (this.startupRefreshStarted) return Promise.resolve();
    const manager = this.searchManager;
    this.startupRefreshStarted = true;
    this.startupRefreshPromise = reconcileSearchAfterMetadata(this.app, manager)
      .then(() => undefined)
      .catch((error) => {
        if (this.searchManager !== manager) return;
        this.startupRefreshStarted = false;
        if (this.nativeObserverDetached()) return;
        new Notice(
          `Search index refresh failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      })
      .finally(() => {
        if (this.searchManager === manager && !this.startupRefreshStarted)
          this.startupRefreshPromise = null;
      });
    return this.startupRefreshPromise;
  }

  private scheduleProviderReconciliation(reason: string): void {
    if (this.managerStopped || this.state !== "enabled") return;
    this.providerReconcileReason = reason;
    if (this.providerReconcilePromise) return;
    const manager = this.searchManager;
    this.providerReconcilePromise = (async () => {
      await this.startupRefresh();
      while (
        this.providerReconcileReason &&
        !this.managerStopped &&
        this.searchManager === manager &&
        this.state === "enabled"
      ) {
        this.providerReconcileReason = null;
        await manager.reconcileStartup();
      }
    })()
      .catch((error) => {
        if (this.searchManager !== manager) return;
        if (this.nativeObserverDetached()) return;
        new Notice(
          `Search provider refresh failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      })
      .finally(() => {
        if (this.searchManager !== manager) return;
        this.providerReconcilePromise = null;
        if (this.managerStopped || this.state !== "enabled") {
          this.providerReconcileReason = null;
          return;
        }
        if (this.providerReconcileReason) {
          this.scheduleProviderReconciliation(this.providerReconcileReason);
        }
      });
  }

  private async openSearchInLeftSidebar(
    query = "",
    scope: SearchResultScope = "files",
  ): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(SearchViewType)[0];
    const target =
      existing ?? this.app.workspace.ensureSideLeaf(SearchViewType, "left");
    await target.setViewState({
      type: SearchViewType,
      state: { query, scope },
    });
    this.app.workspace.activateLeaf(target, {
      focusRootHost: false,
      source: "api",
      operation: "open-search",
    });
    await this.app.workspace.revealLeaf(target);
  }

  private nativeObserverDetached(): boolean {
    return Boolean(
      this.app.session?.backgroundIndexing &&
        (this.app.backgroundIndexing?.detached ||
          this.managerStopped ||
          this.state === "disabling" ||
          this.state === "disabled"),
    );
  }
}
