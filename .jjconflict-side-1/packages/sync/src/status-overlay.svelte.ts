import type { SyncSnapshot } from "./presentation/types";
export class SyncStatusOverlay {
  open = $state(false);
  snapshot = $state<SyncSnapshot | null>(null);
  anchor = $state.raw<HTMLElement | null>(null);
  close(restoreFocus = true): void {
    this.open = false;
    if (restoreFocus && this.anchor?.isConnected) this.anchor.focus();
  }
}
