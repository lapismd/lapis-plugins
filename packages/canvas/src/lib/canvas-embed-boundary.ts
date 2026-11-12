import type { App } from "@lapis-notes/api";

export const MAX_CANVAS_EMBED_DEPTH = 6;
const owners = new WeakMap<App, string>();

export function canvasOwnerKey(app?: App): string {
  if (!app) return "static";
  let key = owners.get(app);
  if (!key) { key = crypto.randomUUID(); owners.set(app, key); }
  return key;
}

/** Canvas owns these DOM annotations across independently mounted Markdown roots. */
export function inspectCanvasEmbedding(container: HTMLElement, app: App, path: string): { depth: number; blocked: "cycle" | "depth" | null } {
  const owner = canvasOwnerKey(app);
  let depth = 0;
  for (let parent = container.parentElement; parent; parent = parent.parentElement) {
    if (!parent.hasAttribute("data-canvas-boundary")) continue;
    depth++;
    if (parent.dataset.canvasOwner === owner && parent.dataset.canvasSourcePath === path) return { depth, blocked: "cycle" };
  }
  return { depth, blocked: depth >= MAX_CANVAS_EMBED_DEPTH ? "depth" : null };
}

/** Renderers may be called on a detached Markdown fragment; inspect after attachment. */
export function whenCanvasContainerConnected(container: HTMLElement, connected: () => void): () => void {
  let active = true;
  let delivered = false;
  let observer: MutationObserver | null = null;
  const attempt = () => {
    if (!active || delivered || !container.isConnected) return;
    delivered = true;
    observer?.disconnect();
    observer = null;
    connected();
  };
  if (!container.isConnected) {
    const Observer = container.ownerDocument.defaultView!.MutationObserver;
    observer = new Observer(attempt);
    observer.observe(container.ownerDocument, { childList: true, subtree: true });
    const root = container.getRootNode();
    if (root !== container.ownerDocument) observer.observe(root, { childList: true, subtree: true });
    queueMicrotask(attempt);
  } else attempt();
  return () => { active = false; observer?.disconnect(); observer = null; };
}
