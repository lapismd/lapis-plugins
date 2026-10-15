import { maximalHeads } from "../protocol/ancestry.js";
import type { StreamingVaultFile } from "../objects/object-graph.js";
import { isIgnoredPath } from "../objects/object-graph.js";
import { findSingleLowestCommonAncestor } from "./merge.js";
import type { LocalEngineState } from "./contracts.js";
import type {
  FileGeneration,
  ReconciliationPlan,
  SyncIncomingAuthority,
} from "./incoming-contracts.js";
import {
  historyAuthorityContext,
  revisionAncestryAuthorized,
} from "./history-context.js";

export function fileGenerations(
  files: StreamingVaultFile[],
): Record<string, FileGeneration> {
  return Object.fromEntries(
    files
      .filter((file) => !isIgnoredPath(file.path))
      .map(({ path, fileId, contentGeneration, hostFileId }) => [
        path,
        { fileId, contentGeneration, ...(hostFileId ? { hostFileId } : {}) },
      ]),
  );
}

export function hasLocalChanges(
  state: LocalEngineState,
  files: StreamingVaultFile[],
): boolean {
  const actual = fileGenerations(files);
  return (
    Object.keys(actual).length !== Object.keys(state.index.paths).length ||
    Object.entries(actual).some(([path, file]) => {
      const before = Object.hasOwn(state.index.paths, path)
        ? state.index.paths[path]
        : undefined;
      return (
        !before ||
        before.fileId !== file.fileId ||
        before.contentGeneration !== file.contentGeneration
      );
    })
  );
}

export async function reconciliationPlan(
  state: LocalEngineState,
  files: StreamingVaultFile[],
  policy: SyncIncomingAuthority,
): Promise<ReconciliationPlan> {
  if (!policy || typeof policy.authorize !== "function")
    throw new Error("Reconciliation requires enrolled membership authority");
  const tips = new Set<string>();
  const context = historyAuthorityContext(state);
  if (state.localRevisionId) tips.add(state.localRevisionId);
  for (const head of Object.values(state.heads))
    if (
      (await policy.authorize(structuredClone(head), context)) === true &&
      (await revisionAncestryAuthorized(
        state,
        head.payload.revisionEventId,
        policy,
        context,
      ))
    )
      tips.add(head.payload.revisionEventId);
  const nodes = new Map(
    Object.entries(state.revisions).map(([eventId, revision]) => [
      eventId,
      { eventId, parents: revision.payload.parents },
    ]),
  );
  if ([...tips].some((id) => !nodes.has(id)))
    throw new Error("Tip has missing ancestry");
  const maximal = maximalHeads([...tips], nodes).sort();
  if (hasLocalChanges(state, files))
    return { kind: "local-changes", tips: maximal };
  if (
    maximal.length === 0 ||
    (maximal.length === 1 && maximal[0] === state.localRevisionId)
  )
    return { kind: "clean", tips: maximal };
  if (maximal.length === 1)
    return {
      kind: "fast-forward",
      tips: maximal,
      targetRevisionId: maximal[0],
    };
  const left =
    state.localRevisionId && maximal.includes(state.localRevisionId)
      ? state.localRevisionId
      : maximal[0];
  const right = maximal.find((id) => id !== left)!;
  const base = findSingleLowestCommonAncestor(
    left,
    right,
    (id) =>
      state.revisions[id]?.payload.parents.map((parent) => parent.eventId) ??
      [],
  );
  return base
    ? {
        kind: "merge-required",
        tips: maximal,
        leftRevisionId: left,
        rightRevisionId: right,
        baseRevisionId: base,
      }
    : {
        kind: "unrelated",
        tips: maximal,
        leftRevisionId: left,
        rightRevisionId: right,
      };
}
