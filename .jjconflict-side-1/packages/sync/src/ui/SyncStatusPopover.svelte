<script lang="ts">
  import { tick } from "svelte";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { CopyableValue } from "@lapismd/design-core/workspace/settings";
  import { WorkspaceIcon } from "@lapismd/design-core/workspace/icon";
  import type { SyncStatusOverlay } from "../status-overlay.svelte";
  import SyncStatusBadge from "./SyncStatusBadge.svelte";
  import "./sync.css";
  let {
    overlay,
    onOpenSync,
  }: { overlay: SyncStatusOverlay; onOpenSync: () => Promise<void> } = $props();
  let panel = $state<HTMLElement | null>(null);
  let panelStyle = $state("");
  function position(): void {
    const rect = overlay.anchor?.getBoundingClientRect();
    panelStyle = rect
      ? `right:${Math.max(8, window.innerWidth - rect.right)}px;bottom:${Math.max(8, window.innerHeight - rect.top + 6)}px;`
      : "right:1rem;bottom:3rem;";
  }
  $effect(() => {
    if (!overlay.open) return;
    position();
    let cancelled = false;
    void tick().then(() => {
      if (!cancelled) panel?.focus();
    });
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !panel?.contains(target) &&
        !overlay.anchor?.contains(target)
      )
        overlay.close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        overlay.close();
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]',
        ),
      ];
      const first = focusable[0],
        last = focusable.at(-1),
        active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", position);
    return () => {
      cancelled = true;
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", position);
    };
  });
</script>

{#if overlay.open && overlay.snapshot}
  <div
    bind:this={panel}
    class="sync-status-popover"
    data-testid="sync-status-popover"
    role="dialog"
    aria-label="Sync status"
    tabindex="-1"
    style={panelStyle}
  >
    <header class="sync-status-popover__header">
      <div class="sync-status-popover__title">
        <WorkspaceIcon name="refresh-cw" />
        <h2>Sync status</h2>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Close status"
        onclick={() => overlay.close()}><WorkspaceIcon name="x" /></Button
      >
    </header>
    <div class="sync-status-popover__state">
      <SyncStatusBadge snapshot={overlay.snapshot} /><span
        ><WorkspaceIcon name="shield-check" />
        {overlay.snapshot.security.encrypted
          ? "End-to-end encrypted"
          : "Encryption required"}</span
      >
    </div>
    <section
      class="sync-status-popover__services"
      aria-label="Lapis Server connection"
    >
      <div class="sync-status-popover__server-title">
        <WorkspaceIcon name="server" />
        <h3>Lapis Server</h3>
        <span
          class="sync-status-popover__connection"
          data-health={overlay.snapshot.destination.status}
          >{overlay.snapshot.destination.status === "healthy"
            ? "Connected"
            : overlay.snapshot.destination.status === "unconfigured"
              ? "Not configured"
              : overlay.snapshot.destination.status === "offline"
                ? "Offline"
                : "Connection error"}</span
        >
      </div>
      <p class="sync-status-popover__endpoint">
        {overlay.snapshot.destination.url || "No destination configured"}
      </p>
      <p class="sync-status-popover__message">
        {overlay.snapshot.destination.message}
      </p>
    </section>
    <dl class="sync-status-popover__summary">
      <div>
        <dt>Pending changes</dt>
        <dd>
          {overlay.snapshot.pendingChanges === 0
            ? "None"
            : overlay.snapshot.pendingChanges}
        </dd>
      </div>
      <div>
        <dt>Last synced</dt>
        <dd>
          {overlay.snapshot.destination.lastSuccessAt
            ? new Date(
                overlay.snapshot.destination.lastSuccessAt,
              ).toLocaleString()
            : "Not yet"}
        </dd>
      </div>
    </dl>
    <dl class="sync-status-popover__revisions">
      <div>
        <dt>Local revision</dt>
        <dd>
          <CopyableValue
            value={overlay.snapshot.localRevisionId}
            label="local revision"
          />
        </dd>
      </div>
      <div>
        <dt>Effective revision</dt>
        <dd>
          <CopyableValue
            value={overlay.snapshot.effectiveRevisionId}
            label="effective revision"
          />
        </dd>
      </div>
    </dl>
    <div class="sync-status-popover__footer">
      <Button
        variant="outline"
        size="sm"
        onclick={() => {
          overlay.close(false);
          void onOpenSync();
        }}>Open Sync<WorkspaceIcon name="arrow-up-right" /></Button
      >
    </div>
  </div>
{/if}
