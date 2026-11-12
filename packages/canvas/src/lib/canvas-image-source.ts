import type { App, TFile } from "@lapis-notes/api";
import { toCanvasFileRef } from "./canvas-text-preview";

export type CanvasImageSnapshot = { url: string | null; error: string | null };
export function resolveCanvasImage(app: App, path: string, sourcePath = ""): TFile | null {
  const file = app.vault.getFileByPath(path) ?? app.metadataCache.getFirstLinkpathDest(path, sourcePath);
  return file && toCanvasFileRef(file).kind === "image" ? file : null;
}
/** A read-only image subscription owns each public resource URL it acquires. */
export class CanvasImageSource {
  private generation = 0;
  private disposed = false;
  private canonical: string | null = null;
  private url: string | null = null;
  private stops: (() => void)[];
  readonly ready: Promise<void>;
  constructor(private app: App, private path: string, private sourcePath: string, private changed: (snapshot: CanvasImageSnapshot) => void) {
    const modify = app.vault.on("modify", (file) => { if (this.matches(file.path)) void this.refresh(); });
    const create = app.vault.on("create", (file) => { if (!this.canonical || this.matches(file.path)) void this.refresh(); });
    const remove = app.vault.on("delete", (file) => { if (this.matches(file.path)) void this.refresh(); });
    const rename = app.vault.on("rename", (file, oldPath) => { if (this.matches(oldPath) || this.matches(file.path)) void this.refresh(); });
    this.stops = [() => app.vault.offref(modify), () => app.vault.offref(create), () => app.vault.offref(remove), () => app.vault.offref(rename)];
    this.ready = this.refresh();
  }
  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    let acquired: string;
    try {
      const file = resolveCanvasImage(this.app, this.path, this.sourcePath)?.copy();
      if (!file) throw new Error("Choose an existing vault image.");
      this.canonical = file.path;
      acquired = await this.app.vault.getResourceUrl(file);
      if (!acquired) throw new Error("The background image is unavailable.");
    } catch (error) {
      if (!this.disposed && generation === this.generation) {
        this.release();
        this.changed({ url: null, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    if (this.disposed || generation !== this.generation) {
      this.app.vault.revokeResourceUrl(acquired);
      return;
    }
    this.release();
    this.url = acquired;
    this.changed({ url: acquired, error: null });
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    ++this.generation;
    for (const stop of this.stops) stop();
    this.release();
  }
  private matches(path: string): boolean {
    return !this.disposed && [this.path, this.canonical].some((target) => target && (target === path || target.startsWith(`${path}/`)));
  }
  private release(): void {
    if (this.url) this.app.vault.revokeResourceUrl(this.url);
    this.url = null;
  }
}
