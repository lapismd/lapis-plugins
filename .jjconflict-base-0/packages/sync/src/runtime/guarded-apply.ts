import { canonicalize } from "../protocol/canonical-json.js";
import {
  inspectObjectGraph,
  isIgnoredPath,
  type InspectedObjectGraph,
  type LocalObjectIndex,
} from "../objects/object-graph.js";
import type {
  LocalEngineOptions,
  LocalEngineState,
  LocalEndpointAuthority,
} from "./contracts.js";
import type {
  ApplyIntent,
  ApplyOperation,
  ApplyReceipt,
  FileGeneration,
} from "./incoming-contracts.js";
import { fileGenerations, hasLocalChanges } from "./reconciliation.js";
import { requireAuthority, operationAuthority } from "./local-state.js";
import type { SyncIncomingAuthority } from "./incoming-contracts.js";
import {
  historyAuthorityContext,
  revisionAncestryAuthorized,
} from "./history-context.js";

type Commit = (
  state: LocalEngineState,
  expected: LocalEndpointAuthority,
) => Promise<void>;
function generationAt(
  files: Record<string, FileGeneration>,
  path: string,
): FileGeneration | null {
  return Object.hasOwn(files, path) ? files[path] : null;
}

function sameVersion(
  left: FileGeneration | null | undefined,
  right: FileGeneration | null | undefined,
): boolean {
  return !left || !right
    ? !left && !right
    : left.fileId === right.fileId &&
        left.contentGeneration === right.contentGeneration &&
        left.hostFileId === right.hostFileId;
}

async function inspect(
  options: LocalEngineOptions,
  state: LocalEngineState,
  revisionId: string,
): Promise<InspectedObjectGraph> {
  const revision = state.revisions[revisionId];
  if (!revision) throw new Error("Apply requires a validated local revision");
  const graph = await inspectObjectGraph({
    rootHash: revision.payload.root,
    epoch: revision.payload.keyEpoch,
    crypto: options.crypto,
    blobs: options.repository.blobs,
  });
  for (const file of graph.files)
    if (isIgnoredPath(file.path))
      throw new Error("Apply includes excluded configuration");
  return graph;
}

export async function createApplyIntent(
  options: LocalEngineOptions,
  state: LocalEngineState,
  revisionId: string,
): Promise<ApplyIntent> {
  if (!options.vault.apply)
    throw new Error("Host has no guarded apply capability");
  await requireAuthority(options);
  await options.vault.flushOpenEditor();
  const files = await options.vault.list();
  if (hasLocalChanges(state, files))
    throw new Error("Checkpoint local changes before applying remote history");
  const before = fileGenerations(files),
    graph = await inspect(options, state, revisionId);
  // Authenticate all local dependencies before persisting intent or modifying files.
  for (const file of graph.files) {
    const reader = file.openRead().getReader();
    try {
      while (!(await reader.read()).done) {
        /* Bounded authenticated stream. */
      }
    } finally {
      reader.releaseLock();
    }
  }
  if (
    canonicalize(before) !==
    canonicalize(fileGenerations(await options.vault.list()))
  )
    throw new Error("Vault changed while planning apply");
  const id = crypto.randomUUID(),
    operations: ApplyOperation[] = [];
  const index: LocalObjectIndex = {
    revisionEventId: revisionId,
    rootHash: state.revisions[revisionId].payload.root,
    paths: Object.create(null),
    treeHashes: graph.treeHashes,
    treeEpochs: graph.treeEpochs,
  };
  for (const file of graph.files) {
    const prior = Object.hasOwn(state.index.paths, file.path)
      ? state.index.paths[file.path]
      : undefined;
    const original = generationAt(before, file.path);
    index.paths[file.path] = {
      fileId: file.fileId,
      fileManifestHash: file.fileManifestHash,
      fileManifestEpoch: file.fileManifestEpoch,
      contentFingerprint: file.contentFingerprint,
    };
    if (
      original &&
      prior?.fileId === file.fileId &&
      prior.fileManifestHash === file.fileManifestHash
    ) {
      index.paths[file.path].contentGeneration = original.contentGeneration;
    } else
      operations.push({
        id: `${id}:${operations.length}`,
        kind: "write",
        path: file.path,
        expected: original,
        fileId: file.fileId,
      });
  }
  for (const path of Object.keys(before).sort())
    if (!Object.hasOwn(index.paths, path))
      operations.push({
        id: `${id}:${operations.length}`,
        kind: "remove",
        path,
        expected: before[path],
        fileId: before[path].fileId,
      });
  return {
    id,
    revisionEventId: revisionId,
    before,
    index,
    operations,
    completed: {},
  };
}

function validateReceipt(
  operation: ApplyOperation,
  receipt: ApplyReceipt,
): void {
  if (!receipt || canonicalize(receipt.operation) !== canonicalize(operation))
    throw new Error("Host apply receipt does not match its operation");
  if (operation.kind === "remove") {
    if (receipt.result !== null)
      throw new Error("Removal receipt still names a file");
  } else if (
    !receipt.result ||
    receipt.result.fileId !== operation.fileId ||
    !Number.isSafeInteger(receipt.result.contentGeneration) ||
    receipt.result.contentGeneration < 0 ||
    (operation.expected?.fileId === receipt.result.fileId &&
      operation.expected.hostFileId === receipt.result.hostFileId &&
      receipt.result.contentGeneration <= operation.expected.contentGeneration)
  )
    throw new Error("Invalid guarded write receipt");
}

function expectedCurrent(intent: ApplyIntent): Record<string, FileGeneration> {
  const expected: Record<string, FileGeneration> = Object.assign(
    Object.create(null),
    structuredClone(intent.before),
  );
  for (const operation of intent.operations) {
    const receipt = intent.completed[operation.id];
    if (!receipt) continue;
    if (receipt.result) expected[operation.path] = receipt.result;
    else delete expected[operation.path];
  }
  return expected;
}

/** The caller holds the local state mutation queue for the complete apply. */
export async function resumeGuardedApply(
  options: LocalEngineOptions,
  initial: LocalEngineState,
  commit: Commit,
  policy: SyncIncomingAuthority,
): Promise<LocalEngineState> {
  const access = options.vault.apply;
  if (!access || !initial.applyIntent)
    throw new Error("No recoverable apply intent or host capability");
  let state = structuredClone(initial);
  const revision = state.revisions[state.applyIntent!.revisionEventId];
  if (!revision || !policy || typeof policy.authorize !== "function")
    throw new Error("Apply requires enrolled membership authority");
  const context = historyAuthorityContext(state);
  const authorize = async () => {
    if (
      !(await revisionAncestryAuthorized(
        state,
        revision.event.id,
        policy,
        context,
      ))
    )
      throw new Error("Apply participant history is not authorized");
  };
  await authorize();
  const graph = await inspect(
    options,
    state,
    state.applyIntent!.revisionEventId,
  );
  const byPath = new Map(graph.files.map((file) => [file.path, file]));
  for (const operation of state.applyIntent!.operations) {
    const authority = await requireAuthority(options);
    await authorize();
    const intent = state.applyIntent!;
    let receipt = intent.completed[operation.id];
    if (!receipt) {
      const recovered = await access.receipt(
        operation.id,
        operationAuthority(authority),
      );
      if (recovered) {
        validateReceipt(operation, recovered);
        receipt = recovered;
      } else {
        const current = fileGenerations(await options.vault.list());
        if (
          !sameVersion(
            generationAt(current, operation.path),
            operation.expected,
          )
        )
          throw new Error(
            "Stale apply target; preserve the changed working file",
          );
        const file = byPath.get(operation.path);
        if (operation.kind === "write" && !file)
          throw new Error("Missing apply content");
        receipt = await access.mutate(
          structuredClone(operation),
          operation.kind === "write" ? file!.openRead() : undefined,
          operationAuthority(authority),
        );
        validateReceipt(operation, receipt);
      }
      const current = fileGenerations(await options.vault.list());
      if (!sameVersion(generationAt(current, operation.path), receipt.result))
        throw new Error("File changed after apply; retain the recovery intent");
      intent.completed[operation.id] = structuredClone(receipt);
      if (receipt.result && intent.index.paths[operation.path])
        intent.index.paths[operation.path].contentGeneration =
          receipt.result.contentGeneration;
      await commit(structuredClone(state), authority);
    }
  }
  const intent = state.applyIntent!;
  const authority = await requireAuthority(options);
  await authorize();
  const current = fileGenerations(await options.vault.list());
  const expected = expectedCurrent(intent);
  if (
    Object.keys(current).length !== Object.keys(expected).length ||
    Object.entries(expected).some(
      ([path, version]) => !sameVersion(generationAt(current, path), version),
    )
  )
    throw new Error("Vault changed during apply; retain the recovery intent");
  // Every mutation has a verified receipt and every untouched file is still current.
  state.index = intent.index;
  state.localRevisionId = intent.revisionEventId;
  state.appliedRevisionId = intent.revisionEventId;
  state.applyIntent = null;
  state.mergeDraft = null;
  await commit(structuredClone(state), authority);
  return state;
}
