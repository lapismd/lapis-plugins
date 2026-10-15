import type { App } from "@lapis-notes/api";
import {
  createDisconnectedSnapshot,
  type SyncRuntime,
  type SyncSnapshot,
  type SyncAction,
  type SyncSettings,
  type RevisionView,
} from "@lapis-notes/lapis-plugin-sync";

export type SyncStoryState =
  | "setup"
  | "dirty"
  | "synced"
  | "syncing"
  | "offline"
  | "error"
  | "conflicted"
  | "locked"
  | "member"
  | "qr"
  | "sas"
  | "recovery";
export const REVISION_IDS = {
  root: "a".repeat(64),
  laptop: "b".repeat(64),
  phone: "c".repeat(64),
  merge: "d".repeat(64),
};
export const SYNC_STORY_FILES = {
  "README.md":
    "# Atlas\n\nA shared research vault.\n\nUpdated on the desktop.\n",
  "notes/research.md": "# Research\n\nCompare the first three options.\n",
  "notes/ideas.md": "# Ideas\n\n- A clearer project overview\n",
};
const BASE_README = "# Atlas\n\nA shared research vault.\n";
const DEVICE = "11".repeat(32),
  PHONE = "22".repeat(32);
const SECURITY = {
  state: "unlocked" as const,
  encrypted: true,
  enrolled: true,
  role: "owner" as const,
  syncIdentity:
    "npub1zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygsy7qnu",
  devicePublicKey: DEVICE,
  deviceAlias: "Desktop",
  epoch: 3,
};
function revision(
  eventId: string,
  parents: string[],
  message: string,
  createdAt: number,
  reason: RevisionView["reason"] = "checkpoint",
): RevisionView {
  return {
    eventId,
    parents,
    message,
    createdAt,
    reason,
    root: "ee".repeat(32),
    author: DEVICE,
  };
}

/** Explicit UI test data; this exercises presentation, never real transport or crypto. */
export function createPreviewSnapshot(state: SyncStoryState): SyncSnapshot {
  const snapshot = createDisconnectedSnapshot();
  snapshot.status = "idle-dirty";
  snapshot.vaultId = "atlas";
  snapshot.security = { ...SECURITY };
  snapshot.destination = {
    provider: "lapis-server",
    url: "https://sync.example.test",
    managedVaultId: "atlas-server",
    authenticated: true,
    authorized: true,
    status: "healthy",
    lastSuccessAt: 1_700_003_600_000,
    message:
      "Authorized for Atlas. Enrolled endpoint; encrypted sync is required.",
  };
  snapshot.localRevisionId = REVISION_IDS.merge;
  snapshot.effectiveRevisionId = REVISION_IDS.merge;
  snapshot.pendingChanges = 2;
  snapshot.pendingFiles = [
    { path: "README.md", operation: "modify" },
    { path: "notes/research.md", operation: "modify" },
  ];
  snapshot.revisions = [
    revision(
      REVISION_IDS.merge,
      [REVISION_IDS.laptop, REVISION_IDS.phone],
      "Merge research notes",
      1_700_003_000,
      "merge",
    ),
    revision(
      REVISION_IDS.phone,
      [REVISION_IDS.root],
      "Phone research notes",
      1_700_002_000,
    ),
    revision(
      REVISION_IDS.laptop,
      [REVISION_IDS.root],
      "Desktop project overview",
      1_700_001_000,
    ),
    revision(
      REVISION_IDS.root,
      [],
      "Initial research checkpoint",
      1_700_000_000,
    ),
  ];
  snapshot.devices = [
    {
      publicKey: DEVICE,
      alias: "Desktop",
      revisionEventId: REVISION_IDS.merge,
      lastSeen: 1_700_003_000,
      role: "owner",
    },
    {
      publicKey: PHONE,
      alias: "Phone",
      revisionEventId: REVISION_IDS.phone,
      lastSeen: 1_700_002_000,
      role: "member",
    },
  ];
  snapshot.changeSets = [
    {
      revisionId: REVISION_IDS.root,
      files: [
        { path: "README.md", additions: 3, oldText: "", newText: BASE_README },
        {
          path: "notes/research.md",
          additions: 3,
          oldText: "",
          newText: "# Research\n\nCompare the options.\n",
        },
      ],
    },
    {
      revisionId: REVISION_IDS.laptop,
      files: [
        {
          path: "README.md",
          additions: 2,
          oldText: BASE_README,
          newText: SYNC_STORY_FILES["README.md"],
        },
      ],
    },
    {
      revisionId: REVISION_IDS.phone,
      files: [
        {
          path: "notes/research.md",
          additions: 1,
          deletions: 1,
          oldText: "# Research\n\nCompare the options.\n",
          newText: SYNC_STORY_FILES["notes/research.md"],
        },
      ],
    },
    {
      revisionId: REVISION_IDS.merge,
      files: [
        {
          path: "README.md",
          additions: 1,
          oldText: BASE_README,
          newText: SYNC_STORY_FILES["README.md"],
        },
        {
          path: "notes/research.md",
          additions: 1,
          oldText: "# Research\n",
          newText: SYNC_STORY_FILES["notes/research.md"],
        },
      ],
    },
  ];
  if (state === "synced") {
    snapshot.status = "idle-clean";
    snapshot.pendingFiles = [];
    snapshot.pendingChanges = 0;
  }
  if (state === "syncing") snapshot.status = "uploading-objects";
  if (state === "offline") {
    snapshot.status = "offline";
    snapshot.destination.status = "offline";
    snapshot.destination.message =
      "Lapis Server is offline. Local changes are queued.";
  }
  if (state === "error") {
    snapshot.status = "error-recoverable";
    snapshot.lastError =
      "The server rejected a stale file generation. Retry after reviewing local changes.";
  }
  if (state === "locked") snapshot.security.state = "locked";
  if (state === "member")
    snapshot.security.role = "member" as typeof snapshot.security.role;
  if (state === "conflicted") {
    snapshot.status = "conflicted";
    snapshot.revisions = snapshot.revisions.filter(
      (r) => r.eventId !== REVISION_IDS.merge,
    );
    snapshot.mergeDraft = {
      id: "atlas-merge-1",
      baseRevisionId: REVISION_IDS.root,
      leftRevisionId: REVISION_IDS.laptop,
      rightRevisionId: REVISION_IDS.phone,
      conflicts: [
        {
          id: "readme-conflict",
          path: "README.md",
          kind: "text-conflict",
          binary: false,
          base: BASE_README,
          left: SYNC_STORY_FILES["README.md"],
          right: "# Atlas\n\nThe phone project overview.\n",
        },
      ],
      resolutions: {},
    };
  }
  if (state === "qr" || state === "sas")
    snapshot.pairing = {
      stage: state,
      invitationUri:
        "lapis://sync-pair?provider=lapis-server&vault=atlas&invitation=ui-test",
      session:
        state === "sas" ? { sessionId: "ui-pair-1", sas: "482196" } : null,
      error: null,
    };
  if (state === "recovery")
    snapshot.recoveryPreview = {
      automatic: ["README.md"],
      localOnly: ["notes/ideas.md"],
      conflicts: [
        {
          id: "research-choice",
          remotePath: "notes/research.md",
          kind: "divergent-path",
        },
      ],
    };
  return snapshot;
}

export class PreviewSyncRuntime implements SyncRuntime {
  readonly actions: SyncAction["type"][] = [
    "checkpoint",
    "sync",
    "test-connection",
    "restore-file",
    "resolve-merge",
    "publish-merge",
    "begin-pairing",
    "accept-pairing",
    "confirm-pairing",
    "cancel-pairing",
    "revoke-device",
    "export-recovery",
    "preview-recovery",
    "apply-recovery",
  ];
  readonly calls: SyncAction[] = [];
  readonly listeners = new Set<() => void>();
  #snapshot: SyncSnapshot;
  #sequence = 16;
  disposed = false;
  constructor(
    readonly app: App,
    state: SyncStoryState,
  ) {
    this.#snapshot = createPreviewSnapshot(state);
  }
  snapshot(): SyncSnapshot {
    return this.#snapshot;
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  async execute(
    action: SyncAction,
    settings: Readonly<SyncSettings>,
    signal: AbortSignal,
  ): Promise<void> {
    signal.throwIfAborted();
    this.calls.push(action);
    const state = this.#snapshot;
    state.lastError = null;
    if (action.type === "restore-file") {
      const change = state.changeSets
        .find((c) => c.revisionId === action.revisionId)
        ?.files.find((f) => f.path === action.path);
      const file = this.app.vault.getFileByPath(action.path);
      if (!change || !file)
        throw new Error("The requested revision is unavailable.");
      await this.app.vault.modify(file, change.newText ?? "");
      this.#addRevision("restore-file", `Restore ${action.path}`, [
        state.localRevisionId!,
      ]);
      state.pendingFiles = [{ path: action.path, operation: "modify" }];
      state.pendingChanges = 1;
      state.status = "idle-dirty";
    } else if (action.type === "checkpoint") {
      this.#addRevision("checkpoint", "History checkpoint", [
        state.localRevisionId!,
      ]);
      state.pendingFiles = [];
      state.pendingChanges = 0;
      state.status = "idle-clean";
    } else if (action.type === "sync" || action.type === "test-connection") {
      state.destination = {
        ...state.destination,
        url: settings.serverUrl,
        managedVaultId: settings.managedVaultId,
        status: "healthy",
        authenticated: true,
        authorized: true,
        message:
          "Authorized for Atlas. Enrolled endpoint; encrypted sync is required.",
        lastSuccessAt: 1_700_004_000_000,
      };
      if (action.type === "sync") {
        state.status = "idle-clean";
        state.pendingFiles = [];
        state.pendingChanges = 0;
      }
    } else if (action.type === "resolve-merge") {
      if (state.mergeDraft?.id !== action.draftId)
        throw new Error("The merge draft changed.");
      state.mergeDraft.resolutions[action.conflictId] = action.resolution;
    } else if (action.type === "publish-merge") {
      const draft = state.mergeDraft;
      if (!draft || draft.id !== action.draftId)
        throw new Error("The merge draft changed.");
      for (const conflict of draft.conflicts) {
        const resolution = draft.resolutions[conflict.id];
        if (!resolution) throw new Error("Resolve all conflicts.");
        const file = this.app.vault.getFileByPath(conflict.path);
        const content =
          resolution.choice === "resolved"
            ? resolution.content
            : resolution.choice === "right"
              ? conflict.right
              : resolution.choice === "base"
                ? conflict.base
                : conflict.left;
        if (file && resolution.choice === "delete")
          await this.app.vault.delete(file);
        else if (file && content !== null)
          await this.app.vault.modify(file, content);
        if (resolution.choice === "keep-both" && conflict.right !== null)
          await this.app.vault.create("README (Phone).md", conflict.right);
      }
      this.#addRevision(
        "merge",
        "Merge device histories",
        [draft.leftRevisionId, draft.rightRevisionId].sort(),
      );
      state.mergeDraft = null;
      state.status = "idle-clean";
    } else if (action.type === "begin-pairing")
      state.pairing = createPreviewSnapshot("qr").pairing;
    else if (action.type === "accept-pairing")
      state.pairing = createPreviewSnapshot("sas").pairing;
    else if (action.type === "confirm-pairing")
      state.pairing = { ...state.pairing, stage: "complete", session: null };
    else if (action.type === "cancel-pairing")
      state.pairing = createDisconnectedSnapshot().pairing;
    else if (action.type === "revoke-device")
      state.devices = state.devices.filter(
        (d) => d.publicKey !== action.publicKey,
      );
    else if (action.type === "preview-recovery")
      state.recoveryPreview = createPreviewSnapshot("recovery").recoveryPreview;
    else if (action.type === "apply-recovery") {
      state.recoveryPreview = null;
      state.status = "idle-dirty";
    }
    signal.throwIfAborted();
    for (const listener of this.listeners) listener();
  }
  #addRevision(
    reason: RevisionView["reason"],
    message: string,
    parents: string[],
  ): void {
    const id = (++this.#sequence).toString(16).padStart(64, "0");
    this.#snapshot.revisions.unshift(
      revision(id, parents, message, 1_700_004_000 + this.#sequence, reason),
    );
    this.#snapshot.localRevisionId = id;
  }
  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }
}
