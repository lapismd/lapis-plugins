import { describe, expect, it, vi } from "vitest";
import { SyncSession } from "./session";
import {
  DEFAULT_SYNC_SETTINGS,
  readSyncSettings,
  validateSyncDestination,
} from "./settings";
import {
  createDisconnectedSnapshot,
  type SyncRuntime,
  type SyncSettings,
  type SyncSnapshot,
} from "./types";

function fixture() {
  const state = createDisconnectedSnapshot();
  state.security = {
    state: "unlocked",
    encrypted: true,
    enrolled: true,
    role: "owner",
    syncIdentity: "npub1public",
    devicePublicKey: "owner",
    deviceAlias: "Desktop",
    epoch: 1,
  };
  state.destination = {
    ...state.destination,
    url: "https://sync.example.test",
    managedVaultId: "managed",
    authenticated: true,
    authorized: true,
    status: "healthy",
  };
  const settings: SyncSettings = {
    ...DEFAULT_SYNC_SETTINGS,
    serverUrl: state.destination.url,
    managedVaultId: "managed",
    enabled: true,
  };
  const listeners = new Set<() => void>();
  const runtime: SyncRuntime = {
    actions: [
      "checkpoint",
      "sync",
      "restore-file",
      "resolve-merge",
      "publish-merge",
      "begin-pairing",
      "revoke-device",
      "confirm-pairing",
      "apply-recovery",
      "export-recovery",
    ],
    snapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    execute: vi.fn(async () => {}),
    dispose: vi.fn(),
  };
  return {
    state,
    settings,
    listeners,
    runtime,
    session: new SyncSession(runtime, () => settings),
  };
}

describe("encrypted Sync presentation boundary", () => {
  it("never supplies demo history or a success state without a runtime", async () => {
    const session = new SyncSession(null, () => DEFAULT_SYNC_SETTINGS);
    expect(session.snapshot().status).toBe("disabled");
    expect(session.snapshot().revisions).toEqual([]);
    expect(await session.run({ type: "sync" })).toBe(false);
    expect(session.snapshot().status).not.toBe("idle-clean");
  });
  it.each(["locked", "unenrolled", "unavailable"] as const)(
    "hides decrypted history and blocks content actions when %s",
    async (state) => {
      const f = fixture();
      f.state.security.state = state;
      f.state.changeSets = [
        {
          revisionId: "private",
          files: [{ path: "private.md", oldText: "secret" }],
        },
      ];
      expect(f.session.snapshot().changeSets).toEqual([]);
      for (const type of [
        "checkpoint",
        "sync",
        "begin-pairing",
        "export-recovery",
      ] as const)
        expect(f.session.can(type)).toBe(false);
      expect(await f.session.run({ type: "checkpoint" })).toBe(false);
      expect(f.runtime.execute).not.toHaveBeenCalled();
    },
  );
  it("refuses encrypted operations without encryption or enrollment", () => {
    const f = fixture();
    f.state.security.encrypted = false;
    expect(f.session.can("checkpoint")).toBe(false);
    f.state.changeSets = [
      {
        revisionId: "private",
        files: [{ path: "private.md", newText: "secret" }],
      },
    ];
    expect(f.session.snapshot().changeSets).toEqual([]);
    f.state.security.encrypted = true;
    f.state.security.enrolled = false;
    expect(f.session.can("sync")).toBe(false);
    expect(f.session.snapshot().changeSets).toEqual([]);
  });
  it("distinguishes authentication from authorization and exact destination binding", () => {
    const f = fixture();
    f.state.destination.authorized = false;
    expect(f.session.authorized()).toBe(false);
    f.state.destination.authorized = true;
    f.settings.managedVaultId = "different";
    expect(f.session.can("sync")).toBe(false);
    f.settings.managedVaultId = "managed";
    f.settings.serverUrl = "https://other.test";
    expect(f.session.can("sync")).toBe(false);
  });
  it("supports encrypted offline checkpoints but owner operations stay unavailable to members", () => {
    const f = fixture();
    f.state.status = "offline";
    expect(f.session.can("checkpoint")).toBe(true);
    f.state.security.role = "member";
    expect(f.session.can("begin-pairing")).toBe(false);
    expect(f.session.can("revoke-device")).toBe(false);
  });
  it("returns isolated snapshots rather than allowing UI to mutate runtime authority", () => {
    const f = fixture();
    const snapshot = f.session.snapshot();
    snapshot.security.role = "member";
    expect(f.state.security.role).toBe("owner");
  });
  it("rejects stale or unresolved merge publication without executing it", async () => {
    const f = fixture();
    f.state.mergeDraft = {
      id: "current",
      baseRevisionId: "base",
      leftRevisionId: "left",
      rightRevisionId: "right",
      conflicts: [
        {
          id: "conflict",
          path: "a.md",
          kind: "text-conflict",
          binary: false,
          base: "a",
          left: "b",
          right: "c",
        },
      ],
      resolutions: {},
    };
    expect(
      await f.session.run({ type: "publish-merge", draftId: "stale" }),
    ).toBe(false);
    expect(
      await f.session.run({ type: "publish-merge", draftId: "current" }),
    ).toBe(false);
    expect(f.runtime.execute).not.toHaveBeenCalled();
  });
  it("surfaces failed operations and recovers only after an actual successful action", async () => {
    const f = fixture();
    vi.mocked(f.runtime.execute).mockRejectedValueOnce(
      new Error("Generation changed"),
    );
    expect(await f.session.run({ type: "checkpoint" })).toBe(false);
    expect(f.session.snapshot().lastError).toBe("Generation changed");
    expect(await f.session.run({ type: "checkpoint" })).toBe(true);
    expect(f.session.snapshot().lastError).toBeNull();
  });
  it("rejects a conflict ID that is absent from the active draft", async () => {
    const f = fixture();
    f.state.mergeDraft = {
      id: "draft",
      baseRevisionId: "base",
      leftRevisionId: "left",
      rightRevisionId: "right",
      conflicts: [],
      resolutions: {},
    };
    expect(
      await f.session.run({
        type: "resolve-merge",
        draftId: "draft",
        conflictId: "missing",
        resolution: { choice: "left" },
      }),
    ).toBe(false);
    expect(f.runtime.execute).not.toHaveBeenCalled();
  });
  it("rejects confirmation for an obsolete pairing session or security code", async () => {
    const f = fixture();
    f.state.pairing = {
      stage: "sas",
      invitationUri: "",
      session: { sessionId: "current", sas: "123456" },
      error: null,
    };
    expect(
      await f.session.run({
        type: "confirm-pairing",
        sessionId: "old",
        sas: "123456",
      }),
    ).toBe(false);
    expect(
      await f.session.run({
        type: "confirm-pairing",
        sessionId: "current",
        sas: "654321",
      }),
    ).toBe(false);
    expect(f.runtime.execute).not.toHaveBeenCalled();
  });
  it("prevents revoking the current device or an unknown device", async () => {
    const f = fixture();
    f.state.devices = [
      {
        publicKey: "owner",
        alias: "Desktop",
        revisionEventId: "revision",
        lastSeen: 1,
        role: "owner",
      },
    ];
    expect(
      await f.session.run({ type: "revoke-device", publicKey: "owner" }),
    ).toBe(false);
    expect(
      await f.session.run({ type: "revoke-device", publicKey: "unknown" }),
    ).toBe(false);
    expect(f.runtime.execute).not.toHaveBeenCalled();
  });
  it("prevents duplicate operations and aborts/unsubscribes on disposal", async () => {
    const f = fixture();
    let release!: () => void;
    let signal!: AbortSignal;
    vi.mocked(f.runtime.execute).mockImplementation(
      async (_action, _settings, passedSignal) => {
        signal = passedSignal;
        await new Promise<void>((resolve) => (release = resolve));
      },
    );
    const update = vi.fn();
    f.session.subscribe(update);
    const action = f.session.run({ type: "checkpoint" });
    expect(f.session.can("sync")).toBe(false);
    await f.session.dispose();
    expect(signal.aborted).toBe(true);
    expect(f.listeners.size).toBe(0);
    const calls = update.mock.calls.length;
    release();
    expect(await action).toBe(false);
    expect(update).toHaveBeenCalledTimes(calls);
  });
});

describe("Sync destination settings", () => {
  it.each([
    "http://sync.example.test",
    "https://user:secret@sync.example.test",
    "https://sync.example.test?token=secret",
    "not a URL",
  ])("rejects unsafe destination %s", (serverUrl) =>
    expect(
      validateSyncDestination({ serverUrl, managedVaultId: "vault" }),
    ).not.toBeNull(),
  );
  it("removes credentials embedded in provider URLs", () => {
    expect(
      readSyncSettings({
        serverUrl: "https://user:secret@sync.test",
        enabled: true,
      }).serverUrl,
    ).toBe("");
  });
  it("keeps only public configuration, dropping credentials and foreign provider state", () => {
    expect(
      readSyncSettings({
        provider: "nostr",
        password: "secret",
        privateKey: "secret",
        snapshots: ["private"],
        serverUrl: "https://sync.test",
        managedVaultId: "vault",
      }),
    ).toEqual({
      ...DEFAULT_SYNC_SETTINGS,
      serverUrl: "https://sync.test",
      managedVaultId: "vault",
    });
  });
});
