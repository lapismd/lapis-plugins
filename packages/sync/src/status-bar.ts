import type { App } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import type { SyncSession } from "./presentation/session";
import { statusBarDescriptor, SYNC_STATUS_ID } from "./presentation/status";
import { SyncStatusOverlay } from "./status-overlay.svelte";
import SyncStatusPopover from "./ui/SyncStatusPopover.svelte";

export class SyncStatusBar {
  readonly overlay = new SyncStatusOverlay();
  #host: HTMLElement | null = null;
  #component: Record<string, unknown> | null = null;
  #unsubscribe: (() => void) | null = null;
  constructor(
    readonly app: App,
    readonly session: SyncSession,
    readonly openSync: () => Promise<void>,
  ) {}
  start(): void {
    this.#unsubscribe = this.session.subscribe(() => this.refresh());
    this.refresh();
    if (typeof document === "undefined") return;
    this.#host = document.createElement("div");
    this.#host.dataset.testid = "sync-status-overlay-root";
    document.body.append(this.#host);
    this.#component = mount(SyncStatusPopover, {
      target: this.#host,
      props: { overlay: this.overlay, onOpenSync: this.openSync },
    });
  }
  refresh(): void {
    const snapshot = this.session.snapshot();
    this.overlay.snapshot = snapshot;
    this.app.statusBar.upsertItem(statusBarDescriptor(snapshot));
  }
  toggle(): void {
    const scope = this.app.workspace.containerEl;
    const focused = scope.ownerDocument.activeElement;
    this.overlay.anchor =
      scope.querySelector<HTMLElement>(
        `[data-status-bar-item-id="${SYNC_STATUS_ID}"]`,
      ) ??
      (focused instanceof HTMLElement &&
      focused.closest(`[data-status-bar-item-id="${SYNC_STATUS_ID}"]`)
        ? focused
        : null);
    if (this.overlay.open) this.overlay.close();
    else this.overlay.open = true;
  }
  async dispose(): Promise<void> {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.overlay.close(false);
    this.app.statusBar.unregisterItem(SYNC_STATUS_ID);
    if (this.#component) await unmount(this.#component);
    this.#component = null;
    this.#host?.remove();
    this.#host = null;
  }
}
