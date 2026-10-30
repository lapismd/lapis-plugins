import {
  buildUnifiedDiffRows,
  type FileListingFile,
} from "@lapismd/design-core/diff";
import type { RevisionView } from "../presentation/types";

export type SnapshotFileChange = FileListingFile & {
  oldText?: string;
  newText?: string;
  binary?: boolean;
};

export type SnapshotChangeSet = {
  revisionId: string;
  files: SnapshotFileChange[];
};

export type RevisionFileReader = {
  filesAtRevision(eventId: string): Promise<Record<string, string>>;
};

export function changeSetForRevision(
  changeSets: readonly SnapshotChangeSet[],
  revisionId: string | null,
): SnapshotFileChange[] {
  if (!revisionId) return [];
  return (
    changeSets.find((entry) => entry.revisionId === revisionId)?.files ?? []
  );
}

export function fileChangeAtPath(
  files: readonly SnapshotFileChange[],
  path: string | null,
): SnapshotFileChange | null {
  if (!path) return null;
  return files.find((file) => file.path === path) ?? null;
}

export function fileChangeFromTexts(
  path: string,
  oldText = "",
  newText = "",
): SnapshotFileChange {
  const rows = buildUnifiedDiffRows(oldText, newText);
  return {
    path,
    additions: rows.filter((row) => row.variant === "added").length,
    deletions: rows.filter((row) => row.variant === "removed").length,
    oldText,
    newText,
  };
}

export function changeSetFromSnapshots(
  revisionId: string,
  current: Record<string, string>,
  parent: Record<string, string> = {},
): SnapshotChangeSet {
  const paths = [
    ...new Set([...Object.keys(parent), ...Object.keys(current)]),
  ].sort();
  return {
    revisionId,
    files: paths.flatMap((path) => {
      const oldText = parent[path] ?? "";
      const newText = current[path] ?? "";
      if (oldText === newText) return [];
      return [fileChangeFromTexts(path, oldText, newText)];
    }),
  };
}

export function revisionTouchesPath(
  changeSet: SnapshotChangeSet | undefined,
  path: string,
): boolean {
  return Boolean(changeSet?.files.some((file) => file.path === path));
}

export function nearestKeptAncestors(
  parents: readonly string[],
  keptIds: ReadonlySet<string>,
  byId: ReadonlyMap<string, RevisionView>,
): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const walk = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    if (keptIds.has(id)) {
      found.push(id);
      return;
    }
    for (const parent of byId.get(id)?.parents ?? []) walk(parent);
  };
  for (const parent of parents) walk(parent);
  return found;
}

export function filterRevisionsForPath(
  revisions: readonly RevisionView[],
  changeSets: readonly SnapshotChangeSet[],
  path: string,
): RevisionView[] {
  const byChangeSet = new Map(
    changeSets.map((entry) => [entry.revisionId, entry]),
  );
  const kept = revisions.filter((revision) =>
    revisionTouchesPath(byChangeSet.get(revision.eventId), path),
  );
  const keptIds = new Set(kept.map((revision) => revision.eventId));
  const byId = new Map(
    revisions.map((revision) => [revision.eventId, revision]),
  );
  return kept.map((revision) => ({
    ...revision,
    parents: nearestKeptAncestors(revision.parents, keptIds, byId),
  }));
}

export function changeSetsForPath(
  changeSets: readonly SnapshotChangeSet[],
  path: string,
): SnapshotChangeSet[] {
  return changeSets.flatMap((entry) => {
    const files = entry.files.filter((file) => file.path === path);
    return files.length > 0 ? [{ revisionId: entry.revisionId, files }] : [];
  });
}

export async function loadRevisionChangeSets(
  reader: RevisionFileReader,
  revisions: readonly RevisionView[],
): Promise<SnapshotChangeSet[]> {
  const byEvent = new Map<string, Record<string, string>>();
  const byRoot = new Map<string, Record<string, string>>();

  async function filesFor(
    eventId: string | undefined,
  ): Promise<Record<string, string>> {
    if (!eventId) return {};
    const cached = byEvent.get(eventId);
    if (cached) return cached;
    const revision = revisions.find((entry) => entry.eventId === eventId);
    if (revision) {
      const shared = byRoot.get(revision.root);
      if (shared) {
        byEvent.set(eventId, shared);
        return shared;
      }
    }
    const files = await reader.filesAtRevision(eventId);
    byEvent.set(eventId, files);
    if (revision) byRoot.set(revision.root, files);
    return files;
  }

  const changeSets: SnapshotChangeSet[] = [];
  for (const revision of revisions) {
    const current = await filesFor(revision.eventId);
    const parent = await filesFor(revision.parents[0]);
    changeSets.push(changeSetFromSnapshots(revision.eventId, current, parent));
  }
  return changeSets;
}
