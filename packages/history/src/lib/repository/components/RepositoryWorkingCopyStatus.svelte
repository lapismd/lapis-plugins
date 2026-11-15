<script lang="ts">
  import { onMount } from "svelte";
  import RepositoryUpstreamActions from "./RepositoryUpstreamActions.svelte";
  import type { SyncController } from "../controllers/sync-controller.js";
  import type { RepositoryRemotes } from "./repository-remotes.svelte.js";
  import type { RepositoryUpstreamBinding } from "../controllers/remotes-settings.js";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import { FileChangeStats } from "@lapismd/design-core/diff";
  import { RelativeTime } from "@lapismd/design-core/shadcn/relative-time";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import ChevronsRight from "@lucide/svelte/icons/chevrons-right";
  import ChevronsLeft from "@lucide/svelte/icons/chevrons-left";
  import GitBranch from "@lucide/svelte/icons/git-branch";
  import type { BackupController, BackupStatus } from "../controllers/backup.js";
  import GitCommitHorizontal from "@lucide/svelte/icons/git-commit-horizontal";
  import RepositoryAuthorAvatar from "./RepositoryAuthorAvatar.svelte";
  import RepositoryIdentifiers from "./RepositoryIdentifiers.svelte";
  import { encodeJjChangeId } from "../controllers/graph/repository-log-graph.js";
  import type {
    WorkingCopyController,
    WorkingCopyState,
  } from "../controllers/working-copy-controller.js";
  let {
    controller,
    openRevision,
    copyText,
    upstream,
    remote,
    remotes,
    backup,
    presentation = "full",
  }: {
    controller: WorkingCopyController;
    openRevision(operation: string, revision: string): Promise<void>;
    copyText(value: string): Promise<void>;
    upstream?: SyncController;
    remote?: RepositoryUpstreamBinding;
    remotes?: RepositoryRemotes;
    backup?: BackupController;
    presentation?: "full" | "split";
  } = $props();
  let statusState: WorkingCopyState = $state({ busy: true, status: "loading" });
  let open = $state(false);
  let expanded = $state(false);
  const expansionId = $props.id();
  let local: BackupStatus | undefined = $state();
  onMount(() => {
    const stop = controller.subscribe((next) => (statusState = next));
    const stopBackup = backup?.subscribe((next) => (local = next));
    return () => {
      stop();
      stopBackup?.();
    };
  });
  const localLabel = $derived(
    !local
      ? undefined
      : local.phase === "ready"
        ? "Saved locally"
        : local.phase === "saving"
          ? "Saving locally"
          : "Local history needs attention",
  );
  const selectedRemote = $derived(remote ?? remotes?.binding(statusState.value?.source ?? "backup"));
  const headerRemote = $derived(
    selectedRemote
      ? {
          ...selectedRemote,
          push: () => {
            open = false;
            selectedRemote.push();
          },
          manage: selectedRemote.manage
            ? () => {
                open = false;
                selectedRemote.manage?.();
              }
            : undefined,
        }
      : undefined,
  );
  const value = $derived(statusState.value);
  const summaryLabel = $derived(
    value
      ? `${value.files} ${value.files === 1 ? "file" : "files"} ${value.lines ? `+${value.lines.additions} -${value.lines.deletions}` : "line counts unavailable"}`
      : statusState.status === "loading"
        ? "Loading working copy"
        : "Working copy unavailable",
  );
  async function inspect() {
    if (!value) return;
    open = false;
    await openRevision(value.operation, value.revision);
  }
</script>

<div
  class="repository-working-status"
  class:split={presentation === "split"}
  aria-label="Repository working copy"
  aria-busy={statusState.busy}
>
  <Popover.Root bind:open>
    <Popover.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="summary"
          aria-label={`Working copy details: ${summaryLabel}`}
        >
          {#if presentation === "split"}<GitBranch aria-hidden="true" />{:else}<GitCommitHorizontal
              aria-hidden="true"
            />{/if}
          {#if presentation !== "split"}{#if value}
              <span>{value.files} {value.files === 1 ? "file" : "files"}</span>
              {#if value.lines}<FileChangeStats
                  additions={value.lines.additions}
                  deletions={value.lines.deletions}
                />{:else}<span>line counts unavailable</span>{/if}
            {:else if statusState.status === "loading"}
              <Skeleton style="height:.75rem;width:5.5rem" />
            {:else}<span>Working copy unavailable</span>{/if}{/if}
        </button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content
      side="top"
      align="end"
      collisionPadding={8}
      sideOffset={6}
      style="width:min(26rem,calc(100vw - 1rem));padding:0"
    >
      <section class="working-card" aria-label="Working copy details">
        <header>
          <GitCommitHorizontal aria-hidden="true" /><strong>Working copy</strong>{#if value}<span
              class="workspace">{value.workspace}</span
            >{/if}
          <RepositoryUpstreamActions
            remote={headerRemote}
            controller={upstream}
            unavailable={statusState.busy}
          />
        </header>
        {#if value}
          <button type="button" class="subject" onclick={inspect}
            >{value.description.split(/\r?\n/u)[0] || "(no description)"}</button
          >
          <div class="identifiers">
            <RepositoryIdentifiers
              {copyText}
              placement="inline"
              commitId={value.revision}
              changeId={encodeJjChangeId(value.changeId)}
            />
          </div>
          <div class="author">
            <RepositoryAuthorAvatar
              name={value.author.name}
              email={value.author.email}
              size="xs"
            /><span>{value.author.name}</span><RelativeTime
              timestamp={Number(value.author.timestamp.millis)}
            />
          </div>
          <div class="totals">
            <span>{value.files} changed {value.files === 1 ? "file" : "files"}</span
            >{#if value.lines}<FileChangeStats
                additions={value.lines.additions}
                deletions={value.lines.deletions}
              />{:else}<span
                >Line totals unavailable for {value.uncounted}
                {value.uncounted === 1 ? "file" : "files"}.</span
              >{/if}
          </div>
          <p>
            Includes unsnapshotted files and saved editor changes compared with the working-copy
            parent. Editor changes appear after saving.
          </p>
          <button type="button" class="open-log" onclick={inspect}>Open in JJ Log</button>
        {:else if statusState.status === "loading"}
          <div class="loading" role="status" aria-label="Reading working copy">
            <Skeleton style="height:1rem;width:90%" /><Skeleton
              style="height:1rem;width:65%"
            /><Skeleton style="height:1rem;width:80%" />
          </div>
        {:else}<p>Status is unavailable. Refresh to read the current working copy.</p>{/if}
      </section>
    </Popover.Content>
  </Popover.Root>
  {#if presentation === "split"}
    <div id={expansionId} class="expanded-summary" hidden={!expanded}>
      {#if localLabel}<span class="local-label">{localLabel}</span>{/if}
      {#if value?.lines}<FileChangeStats
          additions={value.lines.additions}
          deletions={value.lines.deletions}
        />{/if}
      {#if selectedRemote?.target.connection}<RepositoryUpstreamActions
          remote={{ ...selectedRemote, manage: undefined }}
          compact
          unavailable={statusState.busy}
        />{/if}
    </div>
    <button
      type="button"
      class="expand-status"
      aria-label={expanded ? "Collapse repository status" : "Expand repository status"}
      title={expanded ? "Collapse repository status" : "Expand repository status"}
      aria-expanded={expanded}
      aria-controls={expansionId}
      onclick={() => (expanded = !expanded)}
    >
      {#if expanded}<ChevronsLeft aria-hidden="true" />{:else}<ChevronsRight
          aria-hidden="true"
        />{/if}
    </button>
  {/if}
  {#if presentation === "full"}{#if selectedRemote}<RepositoryUpstreamActions
        remote={selectedRemote}
        compact
        unavailable={statusState.busy}
      />{/if}
    <button
      type="button"
      class="refresh"
      aria-label="Refresh working copy status"
      title="Refresh working copy status"
      disabled={statusState.busy}
      onclick={() => controller.refresh()}><RefreshCw aria-hidden="true" /></button
    >{/if}
</div>

<style>
  .repository-working-status {
    display: inline-flex;
    min-height: 1.25rem;
    align-items: stretch;
    gap: 0;
    border: 0;
    background: color-mix(
      in oklab,
      var(--ui-workspace-muted-foreground) 6%,
      var(--ui-workspace-panel)
    );
    border-radius: var(--radius);
    font: inherit;
    color: inherit;
  }
  .repository-working-status.split {
    height: 1.25rem;
    flex: none;
  }
  .split .summary,
  .expand-status {
    width: 1.5rem;
    height: 1.25rem;
    justify-content: center;
    padding: 0;
  }
  .expanded-summary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding-inline: 0.35rem;
    white-space: nowrap;
  }
  .expanded-summary[hidden] {
    display: none;
  }
  .expand-status {
    display: inline-flex;
    align-items: center;
    border-radius: 0 var(--radius) var(--radius) 0;
    background: color-mix(
      in oklab,
      var(--ui-workspace-muted-foreground) 12%,
      var(--ui-workspace-panel)
    );
  }
  .expand-status :global(svg) {
    width: 0.8rem;
    height: 0.8rem;
  }
  .local-label {
    white-space: nowrap;
  }
  button {
    appearance: none;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  button:hover {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  button:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .summary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0 0.4rem;
    border-radius: var(--radius) 0 0 var(--radius);
    line-height: 1;
    white-space: nowrap;
  }
  .summary :global(svg),
  .refresh :global(svg),
  header :global(svg) {
    width: 0.8rem;
    height: 0.8rem;
    flex: none;
  }
  .refresh {
    display: flex;
    align-items: center;
    padding: 0 0.35rem;
    background: color-mix(
      in oklab,
      var(--ui-workspace-muted-foreground) 12%,
      var(--ui-workspace-panel)
    );
    border-radius: 0 var(--radius) var(--radius) 0;
  }
  .refresh:hover:not(:disabled) {
    background: var(--accent);
    color: var(--accent-foreground);
  }
  .working-card {
    font-family: var(--font-sans, sans-serif);
    font-size: 0.8125rem;
    color: var(--foreground);
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 1rem;
    background: var(--ui-column-canvas-column-background, var(--card));
    border-radius: var(--radius) var(--radius) 0 0;
    border-bottom: 1px solid var(--border);
  }
  .workspace {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted-foreground);
  }
  .subject {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
    text-align: left;
    font-weight: 600;
    margin: 0.75rem 1rem;
    padding: 0;
  }
  .subject:hover {
    color: var(--primary);
    background: transparent;
    text-decoration: underline;
  }
  .identifiers,
  .author,
  .totals {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem 1rem;
    flex-wrap: wrap;
  }
  .author {
    color: var(--muted-foreground);
  }
  p {
    margin: 0.75rem 1rem;
    color: var(--muted-foreground);
    font-size: 0.75rem;
    line-height: 1.5;
  }
  .open-log {
    border-top: 1px solid var(--border);
    padding: 0.65rem 1rem;
    width: 100%;
    text-align: left;
  }
  .loading {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
  }
</style>
