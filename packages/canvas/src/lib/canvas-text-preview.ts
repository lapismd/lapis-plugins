import type { TFile } from "@lapis-notes/api";
import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";

const IMAGE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
]);

export function canvasTextFile(id: string): MiraFileRef {
  return {
    path: `canvas-text/${id}.md`,
    name: "Note.md",
    extension: "md",
    kind: "markdown",
  };
}

export function toCanvasFileRef(file: TFile): MiraFileRef {
  const extension = file.extension.toLowerCase();
  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    kind:
      extension === "md" || extension === "markdown"
        ? "markdown"
        : IMAGE_EXTENSIONS.has(extension)
          ? "image"
          : "unknown",
  };
}

export function createCanvasTextAdapter(
  source: { value: string },
  onWrite: (value: string) => void | Promise<void>,
  bind?: MiraFileAdapter["bindMarkdownEditingSession"],
  vault?: { adapter: MiraFileAdapter; file: MiraFileRef; sourcePath: string },
): MiraFileAdapter & { reload: () => void } {
  const watchers = new Set<() => void>();
  const base = vault?.adapter;
  const isVirtual = (file: MiraFileRef) => !vault || file.path === vault.file.path;
  const sourcePath = (path?: string) => !vault || (path && path !== vault.file.path) ? path : vault.sourcePath;
  return {
    ...base,
    bindMarkdownEditingSession: bind
      ? (path, session) => {
          if (!vault || path === vault.file.path) return bind(path, session);
          if (!base?.bindMarkdownEditingSession) throw new Error("Vault editing sessions are unavailable");
          return base.bindMarkdownEditingSession(path, session);
        }
      : undefined,
    registerEditingSession: base?.registerEditingSession
      ? (path, session) => path !== vault?.file.path ? base.registerEditingSession!(path, session) : undefined
      : undefined,
    resolveLink: (target) => base?.resolveLink({ ...target, sourcePath: sourcePath(target.sourcePath) }) ?? null,
    renderEmbed: base?.renderEmbed
      ? (target, element) => base.renderEmbed!({ ...target, sourcePath: sourcePath(target.sourcePath) }, element)
      : undefined,
    watchTarget: base?.watchTarget
      ? (target, callback) => base.watchTarget!({ ...target, sourcePath: sourcePath(target.sourcePath) }, callback)
      : undefined,
    readMarkdown: (file) => isVirtual(file) ? source.value : base?.readMarkdown?.(file) ?? null,
    writeMarkdown: (file, value) => {
      if (!isVirtual(file)) {
        if (!base?.writeMarkdown) throw new Error("This file cannot be edited");
        return base.writeMarkdown(file, value);
      }
      source.value = value;
      return onWrite(value);
    },
    watchFile: (file, callback) => {
      if (!isVirtual(file)) return base?.watchFile?.(file, callback);
      watchers.add(callback);
      return () => { watchers.delete(callback); };
    },
    reload() { for (const watcher of watchers) watcher(); },
  };
}
