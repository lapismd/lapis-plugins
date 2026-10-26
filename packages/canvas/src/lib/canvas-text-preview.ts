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
  onWrite: (value: string) => void,
): MiraFileAdapter & { reload: () => void } {
  const watchers = new Set<() => void>();
  return {
    resolveLink: () => null,
    readMarkdown: () => source.value,
    writeMarkdown: (_file, value) => {
      source.value = value;
      onWrite(value);
    },
    watchFile: (_file, callback) => {
      watchers.add(callback);
      return () => {
        watchers.delete(callback);
      };
    },
    reload() {
      for (const watcher of watchers) watcher();
    },
  };
}
