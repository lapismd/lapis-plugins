import {
  createDisconnectedSnapshot,
  type SyncSnapshot,
} from "../src/presentation/types";

export function emptySnapshot(): SyncSnapshot {
  return createDisconnectedSnapshot();
}

export function dirtySnapshot(): SyncSnapshot {
  return {
    ...emptySnapshot(),
    status: "idle-dirty",
    pendingChanges: 2,
    pendingFiles: [
      { path: "notes/a.md", operation: "modify" },
      { path: "notes/b.md", operation: "modify" },
    ],
    localRevisionId: "abc123",
    localRoot: "root-a",
  };
}

export function syncingSnapshot(): SyncSnapshot {
  return {
    ...dirtySnapshot(),
    status: "publishing-revision",
    pendingUploads: 1,
  };
}

export function errorSnapshot(): SyncSnapshot {
  return {
    ...dirtySnapshot(),
    status: "error-recoverable",
    lastError: "Relay unavailable",
  };
}

export function offlineSnapshot(): SyncSnapshot {
  return {
    ...dirtySnapshot(),
    status: "offline",
  };
}

export function historySnapshot(): SyncSnapshot {
  return {
    ...emptySnapshot(),
    status: "idle-clean",
    localRevisionId: "rev-b",
    effectiveRevisionId: "rev-b",
    localRoot: "root-b",
    revisions: [
      {
        eventId: "rev-b",
        parents: ["rev-a"],
        message: "Update 1 file",
        reason: "checkpoint",
        createdAt: 1_700_000_100,
        root: "root-b",
        author: "aa".repeat(32),
      },
      {
        eventId: "rev-a",
        parents: [],
        message: "History checkpoint",
        reason: "checkpoint",
        createdAt: 1_700_000_000,
        root: "root-a",
        author: "aa".repeat(32),
      },
    ],
    devices: [
      {
        publicKey: "aa".repeat(32),
        alias: "This device",
        revisionEventId: "rev-b",
        lastSeen: 1_700_000_100,
      },
    ],
    diagnostics: {
      rootHash: "root-b",
      supportedNips: [1, 42, 77],
      usedNegentropy: true,
      missingLocal: 0,
      missingRemote: 0,
      blobCount: 3,
    },
  };
}

export function conflictedSnapshot(): SyncSnapshot {
  return {
    ...historySnapshot(),
    status: "conflicted",
    revisions: [
      {
        eventId: "rev-c",
        parents: ["rev-a"],
        message: "Phone edits",
        reason: "checkpoint",
        createdAt: 1_700_000_200,
        root: "root-c",
        author: "bb".repeat(32),
      },
      ...historySnapshot().revisions,
    ],
  };
}

export function restoredSnapshot(): SyncSnapshot {
  return {
    ...historySnapshot(),
    revisions: [
      {
        eventId: "rev-restore",
        parents: ["rev-b"],
        message: "Restore README.md",
        reason: "restore-file",
        createdAt: 1_700_000_300,
        root: "root-a",
        author: "aa".repeat(32),
      },
      ...historySnapshot().revisions,
    ],
  };
}

const laptopKey = "aa".repeat(32);
const phoneKey = "bb".repeat(32);

export function divergedSnapshot(): SyncSnapshot {
  return {
    ...emptySnapshot(),
    status: "conflicted",
    localRevisionId: "rev-laptop-2",
    effectiveRevisionId: null,
    localRoot: "root-laptop-2",
    revisions: [
      {
        eventId: "rev-phone-2",
        parents: ["rev-phone"],
        message: "Phone edits notes.md",
        reason: "checkpoint",
        createdAt: 1_700_000_500,
        root: "root-phone-2",
        author: phoneKey,
      },
      {
        eventId: "rev-laptop-2",
        parents: ["rev-laptop"],
        message: "Update README and plan",
        reason: "checkpoint",
        createdAt: 1_700_000_400,
        root: "root-laptop-2",
        author: laptopKey,
      },
      {
        eventId: "rev-phone",
        parents: ["rev-docs"],
        message: "Add daily notes",
        reason: "checkpoint",
        createdAt: 1_700_000_300,
        root: "root-phone",
        author: phoneKey,
      },
      {
        eventId: "rev-laptop",
        parents: ["rev-docs"],
        message: "Expand the vault README",
        reason: "checkpoint",
        createdAt: 1_700_000_200,
        root: "root-laptop",
        author: laptopKey,
      },
      {
        eventId: "rev-docs",
        parents: ["rev-root"],
        message: "Add docs/guide.md",
        reason: "checkpoint",
        createdAt: 1_700_000_100,
        root: "root-docs",
        author: laptopKey,
      },
      {
        eventId: "rev-root",
        parents: [],
        message: "Initial vault",
        reason: "checkpoint",
        createdAt: 1_700_000_000,
        root: "root-root",
        author: laptopKey,
      },
    ],
    devices: [
      {
        publicKey: laptopKey,
        alias: "This device",
        revisionEventId: "rev-laptop-2",
        lastSeen: 1_700_000_400,
      },
      {
        publicKey: phoneKey,
        alias: "Phone",
        revisionEventId: "rev-phone-2",
        lastSeen: 1_700_000_500,
      },
    ],
  };
}

export function mergedSnapshot(): SyncSnapshot {
  const diverged = divergedSnapshot();
  return {
    ...diverged,
    status: "idle-clean",
    localRevisionId: "rev-merge",
    effectiveRevisionId: "rev-merge",
    localRoot: "root-merge",
    revisions: [
      {
        eventId: "rev-merge",
        parents: ["rev-laptop-2", "rev-phone-2"],
        message: "Merge phone notes into laptop",
        reason: "merge",
        createdAt: 1_700_000_600,
        root: "root-merge",
        author: laptopKey,
      },
      {
        eventId: "rev-snapshot",
        parents: ["rev-laptop-2"],
        message: "Snapshot before merge",
        reason: "checkpoint",
        createdAt: 1_700_000_550,
        root: "root-laptop-2",
        author: laptopKey,
      },
      ...diverged.revisions,
    ],
    devices: [
      {
        publicKey: laptopKey,
        alias: "This device",
        revisionEventId: "rev-merge",
        lastSeen: 1_700_000_600,
      },
      {
        publicKey: phoneKey,
        alias: "Phone",
        revisionEventId: "rev-merge",
        lastSeen: 1_700_000_600,
      },
    ],
  };
}
