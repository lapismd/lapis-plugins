import type { App, TFile } from "@lapis-notes/api";

export type CanvasEmbedSnapshot = { value: string; sourcePath: string; error: string | null };

/** Own one read-only source subscription, including rename and cancelled reads. */
export class CanvasEmbedSource {
  private file: TFile;
  private generation = 0;
  private disposed = false;
  private readonly stops: (() => void)[];
  readonly ready: Promise<void>;

  constructor(private readonly app: App, file: TFile, private readonly changed: (snapshot: CanvasEmbedSnapshot) => void) {
    this.file = file.copy();
    const modified = (file: { path: string }) => {
      if (this.disposed || file.path !== this.file.path) return;
      this.file = app.vault.getFileByPath(file.path)?.copy() ?? this.file;
      void this.refresh();
    };
    const deleted = (file: { path: string }) => {
      if (!this.matches(file.path)) return;
      ++this.generation;
      this.changed({ value: "", sourcePath: this.file.path, error: "The embedded canvas was removed from this vault." });
    };
    const renamed = (file: { path: string }, oldPath: string) => {
      if (!this.matches(oldPath)) return;
      const path = file.path + this.file.path.slice(oldPath.length);
      const target = app.vault.getFileByPath(path)?.copy() ?? this.file.copy();
      target.path = path;
      this.file = target;
      void this.refresh();
    };
    const modifyRef = app.vault.on("modify", modified);
    const createRef = app.vault.on("create", modified);
    const deleteRef = app.vault.on("delete", deleted);
    const renameRef = app.vault.on("rename", renamed);
    this.stops = [() => app.vault.offref(modifyRef), () => app.vault.offref(createRef), () => app.vault.offref(deleteRef), () => app.vault.offref(renameRef)];
    this.ready = this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    const file = this.file.copy();
    let value: string;
    try { value = await this.app.vault.read(file); }
    catch (error) {
      if (!this.disposed && generation === this.generation) this.changed({ value: "", sourcePath: file.path, error: error instanceof Error ? error.message : String(error) });
      return;
    }
    if (!this.disposed && generation === this.generation) this.changed({ value, sourcePath: file.path, error: null });
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    ++this.generation;
    for (const stop of this.stops) stop();
  }

  private matches(path: string): boolean { return !this.disposed && (this.file.path === path || this.file.path.startsWith(`${path}/`)); }
}
