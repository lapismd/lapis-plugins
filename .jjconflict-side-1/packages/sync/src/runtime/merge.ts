// SPDX-License-Identifier: Apache-2.0
// Adapted from lapismd/lapis-plugin-nostr-sync; see NOTICE.md.
import { sha256Hex } from "../protocol/bytes.js";

export type MergeConflictKind =
  | "delete-edit"
  | "divergent-rename"
  | "same-path-addition"
  | "binary-change"
  | "text-conflict";

export type MergeConflict = {
  id: string;
  path: string;
  kind: MergeConflictKind;
  binary: boolean;
  basePath?: string;
  leftPath?: string;
  rightPath?: string;
  base: string | null;
  left: string | null;
  right: string | null;
};

export type MergeDraft = {
  schemaVersion: 1;
  baseRevisionId: string;
  leftRevisionId: string;
  rightRevisionId: string;
  contentGenerations: Record<string, number>;
  automaticFiles: Record<string, string>;
  conflicts: MergeConflict[];
  resolutions: Record<string, MergeResolution>;
  createdAt: number;
};

export type MergeResolution =
  | { choice: "left" | "right" | "base" | "delete" | "keep-both" }
  | { choice: "resolved"; content: string };

export function createMergeDraft(input: {
  baseRevisionId: string;
  leftRevisionId: string;
  rightRevisionId: string;
  base: Record<string, Uint8Array>;
  left: Record<string, Uint8Array>;
  right: Record<string, Uint8Array>;
  baseFileIds?: Record<string, string>;
  leftFileIds?: Record<string, string>;
  rightFileIds?: Record<string, string>;
  contentGenerations: Record<string, number>;
}): MergeDraft {
  const automaticFiles: Record<string, string> = Object.create(null);
  const { conflicts, excludedPaths } = divergentRenameConflicts(input);
  const paths = [
    ...new Set([
      ...Object.keys(input.base),
      ...Object.keys(input.left),
      ...Object.keys(input.right),
    ]),
  ].sort();
  for (const path of paths) {
    if (excludedPaths.has(path)) continue;
    const base = input.base[path];
    const left = input.left[path];
    const right = input.right[path];
    const resolved = automaticResolution(base, left, right);
    if (resolved !== undefined) {
      if (resolved) automaticFiles[path] = bytesToBase64(resolved);
      continue;
    }
    const binary = [base, left, right].some((bytes) => bytes && !isText(bytes));
    const kind: MergeConflictKind = binary
      ? "binary-change"
      : !base && left && right
        ? "same-path-addition"
        : base && (!left || !right)
          ? "delete-edit"
          : "text-conflict";
    conflicts.push({
      id: `${sha256Hex(new TextEncoder().encode(path)).slice(0, 16)}:${kind}`,
      path,
      kind,
      binary,
      base: encoded(base),
      left: encoded(left),
      right: encoded(right),
    });
  }
  return {
    schemaVersion: 1,
    baseRevisionId: input.baseRevisionId,
    leftRevisionId: input.leftRevisionId,
    rightRevisionId: input.rightRevisionId,
    contentGenerations: { ...input.contentGenerations },
    automaticFiles,
    conflicts,
    resolutions: {},
    createdAt: Date.now(),
  };
}

export function materialiseMergeDraft(
  draft: MergeDraft,
  keepBothName: (path: string) => string,
): Record<string, Uint8Array> {
  const files = Object.fromEntries(
    Object.entries(draft.automaticFiles).map(([path, value]) => [
      path,
      base64ToBytes(value),
    ]),
  );
  for (const conflict of draft.conflicts) {
    const resolution = draft.resolutions[conflict.id];
    if (!resolution) throw new Error(`Resolve ${conflict.path} before merging`);
    if (resolution.choice === "delete") continue;
    if (resolution.choice === "keep-both") {
      if (conflict.left) {
        files[conflict.leftPath ?? conflict.path] = base64ToBytes(
          conflict.left,
        );
      }
      if (conflict.right) {
        files[keepBothName(conflict.rightPath ?? conflict.path)] =
          base64ToBytes(conflict.right);
      }
      continue;
    }
    const encodedValue =
      resolution.choice === "resolved"
        ? bytesToBase64(new TextEncoder().encode(resolution.content))
        : conflict[resolution.choice];
    if (encodedValue) {
      const targetPath =
        resolution.choice === "left"
          ? (conflict.leftPath ?? conflict.path)
          : resolution.choice === "right"
            ? (conflict.rightPath ?? conflict.path)
            : resolution.choice === "base"
              ? (conflict.basePath ?? conflict.path)
              : (conflict.leftPath ?? conflict.path);
      files[targetPath] = base64ToBytes(encodedValue);
    }
  }
  return files;
}

function divergentRenameConflicts(input: {
  base: Record<string, Uint8Array>;
  left: Record<string, Uint8Array>;
  right: Record<string, Uint8Array>;
  baseFileIds?: Record<string, string>;
  leftFileIds?: Record<string, string>;
  rightFileIds?: Record<string, string>;
}): { conflicts: MergeConflict[]; excludedPaths: Set<string> } {
  if (!input.baseFileIds || !input.leftFileIds || !input.rightFileIds) {
    return { conflicts: [], excludedPaths: new Set() };
  }
  const leftById = invertFileIds(input.leftFileIds);
  const rightById = invertFileIds(input.rightFileIds);
  const conflicts: MergeConflict[] = [];
  const excludedPaths = new Set<string>();
  for (const [basePath, fileId] of Object.entries(input.baseFileIds).sort(
    ([left], [right]) => left.localeCompare(right),
  )) {
    const leftPath = leftById.get(fileId);
    const rightPath = rightById.get(fileId);
    if (
      !leftPath ||
      !rightPath ||
      leftPath === basePath ||
      rightPath === basePath ||
      leftPath === rightPath
    ) {
      continue;
    }
    const base = input.base[basePath];
    const left = input.left[leftPath];
    const right = input.right[rightPath];
    if (!base || !left || !right) continue;
    excludedPaths.add(basePath);
    excludedPaths.add(leftPath);
    excludedPaths.add(rightPath);
    const binary = [base, left, right].some((bytes) => !isText(bytes));
    conflicts.push({
      id: `${sha256Hex(new TextEncoder().encode(`${basePath}\0${leftPath}\0${rightPath}`)).slice(0, 16)}:divergent-rename`,
      path: basePath,
      kind: "divergent-rename",
      binary,
      basePath,
      leftPath,
      rightPath,
      base: encoded(base),
      left: encoded(left),
      right: encoded(right),
    });
  }
  return { conflicts, excludedPaths };
}

function invertFileIds(fileIds: Record<string, string>): Map<string, string> {
  const result = new Map<string, string>();
  for (const [path, fileId] of Object.entries(fileIds).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (!result.has(fileId)) result.set(fileId, path);
  }
  return result;
}

export function findSingleLowestCommonAncestor(
  left: string,
  right: string,
  parents: (eventId: string) => readonly string[],
): string | null {
  const leftAncestors = ancestors(left, parents);
  const rightAncestors = ancestors(right, parents);
  const common = [...leftAncestors].filter((eventId) =>
    rightAncestors.has(eventId),
  );
  if (common.length === 0) return null;
  const lowest = common.filter(
    (candidate) =>
      !common.some(
        (other) =>
          other !== candidate && ancestors(other, parents).has(candidate),
      ),
  );
  if (lowest.length !== 1) {
    throw new Error("Unsupported history: multiple incomparable merge bases");
  }
  return lowest[0]!;
}

export function deterministicKeepBothPath(
  path: string,
  alias: string,
  publicKey: string,
  occupied: ReadonlySet<string>,
): string {
  const slash = path.lastIndexOf("/");
  const directory = slash >= 0 ? path.slice(0, slash + 1) : "";
  const filename = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const extension = dot > 0 ? filename.slice(dot) : "";
  const safeAlias = alias.trim().replace(/[^\p{L}\p{N}_-]+/gu, "-") || "device";
  const suffix = `${safeAlias}-${publicKey.slice(0, 8)}`;
  let candidate = `${directory}${stem} (${suffix})${extension}`;
  let index = 2;
  while (occupied.has(candidate)) {
    candidate = `${directory}${stem} (${suffix}-${index})${extension}`;
    index += 1;
  }
  return candidate;
}

function automaticResolution(
  base?: Uint8Array,
  left?: Uint8Array,
  right?: Uint8Array,
): Uint8Array | null | undefined {
  if (same(left, right)) return left ?? null;
  if (same(left, base)) return right ?? null;
  if (same(right, base)) return left ?? null;
  return undefined;
}

function same(left?: Uint8Array, right?: Uint8Array): boolean {
  if (!left || !right) return left === right;
  return sha256Hex(left) === sha256Hex(right);
}

function ancestors(
  start: string,
  parents: (eventId: string) => readonly string[],
): Set<string> {
  const result = new Set<string>();
  const pending = [start];
  while (pending.length > 0) {
    const eventId = pending.pop()!;
    if (result.has(eventId)) continue;
    result.add(eventId);
    pending.push(...parents(eventId));
  }
  return result;
}

function isText(bytes: Uint8Array): boolean {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return !bytes.includes(0);
  } catch {
    return false;
  }
}

function encoded(bytes?: Uint8Array): string | null {
  return bytes ? bytesToBase64(bytes) : null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
