import { describe, expect, it, vi } from "vitest";
import { RepositoryRemotesController } from "./remotes-controller.js";
import type { RepositoryRemotesSnapshot } from "./remotes-service.js";

const snapshot = (revision = 3): RepositoryRemotesSnapshot => ({
  revision,
  capabilities: {
    targets: ["backup", "original"],
    anonymousHttps: true,
    httpsTokens: true,
    hostSshAgent: true,
    hostSshDefault: true,
    githubDeviceSignIn: true,
    forgejoTokens: true,
  },
  settings: {
    host: "server",
    storage: "available",
    sshAvailable: true,
    deviceSignInAvailable: true,
    credentials: [],
    automaticSync: false,
    targets: [],
  },
});
function fixture() {
  const service = {
    read: vi.fn(async () => snapshot()),
    execute: vi.fn(async (_command: unknown) => snapshot(4)),
    openSignIn: vi.fn(async () => {}),
  };
  const controller = new RepositoryRemotesController(service, vi.fn());
  return { service, controller };
}

describe("native repository remote presentation boundary", () => {
  it("saves only the selected target at the last observed configuration revision", async () => {
    const { controller, service } = fixture();
    await controller.refresh();
    const connection = {
      name: "origin",
      url: "https://forge.example/notes.git",
      branch: "main",
      bookmark: "main",
      authentication: "anonymous" as const,
      credential: "",
    };
    await controller.actions.save("original", connection);
    expect(service.execute.mock.calls).toEqual([
      [
        {
          kind: "save_connection",
          target: "original",
          connection,
          expectedRevision: 3,
        },
      ],
    ]);
    expect(controller.snapshot?.revision).toBe(4);
    expect(controller.snapshot?.settings.automaticSync).toBe(false);
  });
  it("does not replay a lost push response and observes the retained identity explicitly", async () => {
    const { controller, service } = fixture();
    await controller.refresh();
    service.execute.mockRejectedValueOnce(
      new Error("Outcome needs observation")
    );
    await expect(
      controller.actions.push("backup", "review-one")
    ).rejects.toThrow("observation");
    expect(service.execute).toHaveBeenCalledTimes(1);
    await controller.actions.observe("backup", "original-request");
    expect(service.execute).toHaveBeenLastCalledWith({
      kind: "observe_push",
      target: "backup",
      requestId: "original-request",
      expectedRevision: 3,
    });
  });
  it("refuses overlapping publication and ignores its late response after disposal", async () => {
    const { controller, service } = fixture();
    await controller.refresh();
    let finish!: (value: RepositoryRemotesSnapshot) => void;
    service.execute.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const listener = vi.fn();
    controller.subscribe(listener);
    listener.mockClear();
    const pending = controller.actions.push("original", "review-one");
    await expect(
      controller.actions.push("original", "review-one")
    ).rejects.toThrow("already running");
    controller.close();
    finish(snapshot(4));
    await pending;
    expect(listener).not.toHaveBeenCalled();
    expect(controller.snapshot).toBeUndefined();
    expect(service.execute).toHaveBeenCalledTimes(1);
  });
  it("keeps a stale read from replacing newer observation", async () => {
    const { controller, service } = fixture();
    let finish!: (value: RepositoryRemotesSnapshot) => void;
    service.read.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const old = controller.refresh();
    await controller.refresh();
    finish(snapshot(1));
    await old;
    expect(controller.snapshot?.revision).toBe(3);
  });
  it("rejects regressing or unsafe native configuration revisions", async () => {
    const { controller, service } = fixture();
    await controller.refresh();
    service.read.mockResolvedValueOnce(snapshot(2));
    await expect(controller.refresh()).rejects.toThrow("revision");
    service.read.mockResolvedValueOnce(snapshot(Number.MAX_SAFE_INTEGER + 1));
    await expect(controller.refresh()).rejects.toThrow("revision");
    expect(controller.snapshot?.revision).toBe(3);
  });
  it("hands off only a currently pending GitHub code", async () => {
    const { controller, service } = fixture();
    await controller.refresh();
    await expect(controller.actions.openSignIn()).rejects.toThrow(
      "Start GitHub"
    );
    const pending = snapshot(4);
    pending.settings.authorization = {
      code: "ABCD-EFGH",
      url: "https://github.com/login/device",
      state: "pending",
    };
    service.read.mockResolvedValueOnce(pending);
    await controller.refresh();
    await controller.actions.openSignIn();
    expect(service.openSignIn).toHaveBeenCalledTimes(1);
    const expired = snapshot(5);
    expired.settings.authorization = {
      ...pending.settings.authorization,
      state: "expired",
    };
    service.read.mockResolvedValueOnce(expired);
    await controller.refresh();
    await expect(controller.actions.openSignIn()).rejects.toThrow(
      "Start GitHub"
    );
    expect(service.openSignIn).toHaveBeenCalledTimes(1);
  });
});
