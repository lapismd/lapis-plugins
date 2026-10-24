const AUDIO_EXTENSIONS = new Set([
  "aac",
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "ogg",
  "wav",
  "webm",
]);

export function findRecordingReference(
  markdown: string,
  frontMatterAudio: string | null,
): string | null {
  if (frontMatterAudio) return frontMatterAudio;
  const markdownLink = /\[[^\]]*]\(([^)\s]+)\)/g;
  for (const match of markdown.matchAll(markdownLink)) {
    const reference = match[1];
    if (reference && isAudioReference(reference)) return reference;
  }
  const wikiLink = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
  for (const match of markdown.matchAll(wikiLink)) {
    const reference = match[1]?.trim();
    if (reference && isAudioReference(reference)) return reference;
  }
  return null;
}

export function audioPathCandidates(
  notePath: string,
  reference: string,
): string[] {
  const trimmed = reference.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return [];
  const relative = resolvePath(noteDirectory(notePath), trimmed);
  const fromRoot = resolvePath("", stripRelativePrefix(trimmed));
  return [...new Set([relative, fromRoot].filter((path): path is string => !!path))];
}

function isAudioReference(reference: string): boolean {
  const path = reference.split("?")[0]?.split("#")[0] ?? reference;
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return AUDIO_EXTENSIONS.has(extension);
}

function noteDirectory(notePath: string): string {
  const slash = notePath.lastIndexOf("/");
  return slash === -1 ? "" : notePath.slice(0, slash);
}

function stripRelativePrefix(reference: string): string {
  return reference.replace(/^(?:\.\/)+/, "").replace(/^\/+/, "");
}

function resolvePath(base: string, reference: string): string | null {
  const combined = reference.startsWith("/")
    ? stripRelativePrefix(reference)
    : base
      ? `${base}/${stripRelativePrefix(reference)}`
      : stripRelativePrefix(reference);
  const parts: string[] = [];
  for (const part of combined.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  const path = parts.join("/");
  return isAudioReference(path) ? path : null;
}
