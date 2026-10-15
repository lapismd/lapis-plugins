import { describe, expect, it, vi } from "vitest";
import { ServerConnectionRuntime } from "./server-connection";
import { SyncSession } from "./session";
import { DEFAULT_SYNC_SETTINGS, validateSyncDestination } from "./settings";

const settings = {
  ...DEFAULT_SYNC_SETTINGS,
  serverUrl: "https://sync.example.test",
  managedVaultId: "11111111-1111-4111-8111-111111111111",
};
const json = (data: unknown) => Response.json({ result: { data } });
function transport(role = "editor") {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ protocolMajor: 1, buildId: "review" }))
    .mockResolvedValueOnce(json({ vaultId: settings.managedVaultId, role }));
}

describe("real server connection runtime", () => {
  it("clears health and rejects an in-flight result when account access is invalidated", async () => {
    let finish!: (response: Response) => void;
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ protocolMajor: 1 }))
      .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const runtime = new ServerConnectionRuntime({ request });
    const pending = runtime.execute({ type: "test-connection" }, settings, new AbortController().signal);
    const rejected = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
    runtime.invalidateConnection();
    finish(json({ vaultId: settings.managedVaultId, role: "owner" }));
    await rejected;
    expect(runtime.snapshot().destination).toMatchObject({ authenticated: false, authorized: false, status: "unconfigured" });
    runtime.dispose();
  });
  it("checks the protocol and authenticated vault without granting content authority", async () => {
    const request = transport();
    const runtime = new ServerConnectionRuntime({ request });
    const session = new SyncSession(runtime, () => settings);
    expect(await session.run({ type: "test-connection" })).toBe(true);
    expect(
      request.mock.calls.map(([url]) => new URL(String(url)).pathname),
    ).toEqual(["/api/trpc/system.info", "/api/trpc/vault.open"]);
    expect(request.mock.calls[1][1]).toMatchObject({
      credentials: "include",
      redirect: "error",
      cache: "no-store",
    });
    expect(
      JSON.parse(
        new URL(String(request.mock.calls[1][0])).searchParams.get("input")!,
      ),
    ).toEqual({ vaultId: settings.managedVaultId });
    expect(runtime.snapshot().destination).toMatchObject({
      authenticated: true,
      authorized: true,
      status: "healthy",
      managedVaultId: settings.managedVaultId,
    });
    expect(runtime.snapshot().security.enrolled).toBe(false);
    expect(runtime.snapshot().revisions).toEqual([]);
    expect(session.can("sync")).toBe(false);
    expect(session.can("checkpoint")).toBe(false);
    expect(session.snapshot().status).not.toBe("idle-clean");
    await session.dispose();
  });
  it.each([401, 403])(
    "reports account access rejection %s and clears previous success",
    async (status) => {
      const request = transport();
      const runtime = new ServerConnectionRuntime({ request });
      await runtime.execute(
        { type: "test-connection" },
        settings,
        new AbortController().signal,
      );
      request
        .mockResolvedValueOnce(json({ protocolMajor: 1 }))
        .mockResolvedValueOnce(
          Response.json(
            { error: { message: "private server details" } },
            { status },
          ),
        );
      await expect(
        runtime.execute(
          { type: "test-connection" },
          settings,
          new AbortController().signal,
        ),
      ).rejects.toThrow(status === 401 ? /Sign in/ : /access/);
      expect(runtime.snapshot().destination).toMatchObject({
        authorized: false,
        authenticated: status === 403,
        status: "error",
        lastSuccessAt: null,
      });
      expect(runtime.snapshot().destination.message).not.toContain(
        "private server details",
      );
    },
  );
  it("refuses viewer access, mismatched vaults and incompatible protocols", async () => {
    for (const request of [
      transport("viewer"),
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json({ protocolMajor: 1 }))
        .mockResolvedValueOnce(json({ vaultId: "different", role: "owner" })),
      vi.fn<typeof fetch>().mockResolvedValue(json({ protocolMajor: 2 })),
    ]) {
      const runtime = new ServerConnectionRuntime({ request });
      await expect(
        runtime.execute(
          { type: "test-connection" },
          settings,
          new AbortController().signal,
        ),
      ).rejects.toThrow();
      expect(runtime.snapshot().destination.authorized).toBe(false);
    }
  });
  it("reports offline, then recovers on a subsequent real request", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("fetch failed"));
    const runtime = new ServerConnectionRuntime({ request });
    await expect(
      runtime.execute(
        { type: "test-connection" },
        settings,
        new AbortController().signal,
      ),
    ).rejects.toThrow(/connect/);
    expect(runtime.snapshot().destination.status).toBe("offline");
    request.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await expect(
      runtime.execute(
        { type: "test-connection" },
        settings,
        new AbortController().signal,
      ),
    ).rejects.toThrow(/unavailable/);
    expect(runtime.snapshot().destination.status).toBe("offline");
    request
      .mockResolvedValueOnce(json({ protocolMajor: 1 }))
      .mockResolvedValueOnce(
        json({ vaultId: settings.managedVaultId, role: "owner" }),
      );
    await runtime.execute(
      { type: "test-connection" },
      settings,
      new AbortController().signal,
    );
    expect(runtime.snapshot().destination.status).toBe("healthy");
  });
  it("rejects unsafe URLs before making a request and limits development HTTP to loopback", async () => {
    const request = transport();
    const runtime = new ServerConnectionRuntime({ request });
    for (const serverUrl of [
      "http://sync.example.test",
      "https://user:secret@sync.example.test",
      "https://sync.example.test/?token=secret",
    ]) {
      await expect(
        runtime.execute(
          { type: "test-connection" },
          { ...settings, serverUrl },
          new AbortController().signal,
        ),
      ).rejects.toThrow();
    }
    expect(request).not.toHaveBeenCalled();
    expect(
      validateSyncDestination({
        ...settings,
        serverUrl: "http://localhost:8797",
      }),
    ).not.toBeNull();
    expect(
      validateSyncDestination(
        { ...settings, serverUrl: "http://localhost:8797" },
        { allowLoopbackHttp: true },
      ),
    ).toBeNull();
    expect(
      validateSyncDestination(
        { ...settings, serverUrl: "http://192.168.1.2" },
        { allowLoopbackHttp: true },
      ),
    ).not.toBeNull();
  });
  it("does not publish a late result after disposal", async () => {
    let finish!: (response: Response) => void;
    const request = vi.fn<typeof fetch>(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const runtime = new ServerConnectionRuntime({ request });
    const changed = vi.fn();
    runtime.subscribe(changed);
    const pending = runtime.execute(
      { type: "test-connection" },
      settings,
      new AbortController().signal,
    );
    const signal = request.mock.calls[0][1]!.signal!;
    runtime.dispose();
    const notifications = changed.mock.calls.length;
    expect(signal.aborted).toBe(true);
    finish(json({ protocolMajor: 1 }));
    await expect(pending).rejects.toThrow();
    expect(changed).toHaveBeenCalledTimes(notifications);
    expect(runtime.snapshot().destination.authorized).toBe(false);
  });
  it("requires a new check when settings change during a request", async () => {
    let current = { ...settings };
    let finish!: (response: Response) => void;
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ protocolMajor: 1 }))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const runtime = new ServerConnectionRuntime({ request });
    const session = new SyncSession(runtime, () => current);
    const pending = session.run({ type: "test-connection" });
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    current = {
      ...settings,
      managedVaultId: "22222222-2222-4222-8222-222222222222",
    };
    finish(json({ vaultId: settings.managedVaultId, role: "owner" }));
    expect(await pending).toBe(false);
    expect(session.snapshot().destination.authorized).toBe(false);
    expect(session.snapshot().lastError).toMatch(/destination changed/);
    await session.dispose();
  });

  it("bounds invalid response bodies and times out stalled requests", async () => {
    for (const response of [
      new Response("invalid JSON"),
      new Response("x".repeat(32769)),
      json(null),
    ]) {
      const runtime = new ServerConnectionRuntime({
        request: vi.fn<typeof fetch>().mockResolvedValue(response),
      });
      await expect(
        runtime.execute(
          { type: "test-connection" },
          settings,
          new AbortController().signal,
        ),
      ).rejects.toThrow(/response/);
      expect(runtime.snapshot().destination.authorized).toBe(false);
    }
    const request: typeof fetch = async (_input, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener(
          "abort",
          () => reject(init!.signal!.reason),
          { once: true },
        );
      });
    const runtime = new ServerConnectionRuntime({ request, timeoutMs: 5 });
    await expect(
      runtime.execute(
        { type: "test-connection" },
        settings,
        new AbortController().signal,
      ),
    ).rejects.toThrow(/timed out/);
    expect(runtime.snapshot().destination.status).toBe("offline");
  });
});

describe("managed vault discovery", () => {
  it("lists the signed-in account's active vaults without requiring a selected ID", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ protocolMajor: 1 }))
      .mockResolvedValueOnce(
        json([
          { id: settings.managedVaultId, name: "Atlas", role: "owner" },
          {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Shared research",
            role: "viewer",
          },
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Archived",
            role: "editor",
            archivedAt: 1,
          },
        ]),
      );
    const runtime = new ServerConnectionRuntime({ request });
    const vaults = await runtime.listManagedVaults(
      { ...settings, managedVaultId: "" },
      new AbortController().signal,
    );
    expect(vaults.map((v) => v.name)).toEqual(["Atlas", "Shared research"]);
    expect(new URL(String(request.mock.calls[1][0])).pathname).toBe(
      "/api/trpc/vault.list",
    );
    expect(
      JSON.parse(
        new URL(String(request.mock.calls[1][0])).searchParams.get("input")!,
      ),
    ).toEqual({ includeArchived: false });
    expect(runtime.snapshot().destination.authorized).toBe(false);
  });
  it("requires sign-in and rejects malformed discovery responses", async () => {
    for (const response of [
      new Response(null, { status: 401 }),
      json({ wrong: [] }),
      json([{ id: "invalid", name: "Atlas", role: "owner" }]),
    ]) {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json({ protocolMajor: 1 }))
        .mockResolvedValueOnce(response);
      const runtime = new ServerConnectionRuntime({ request });
      await expect(
        runtime.listManagedVaults(settings, new AbortController().signal),
      ).rejects.toThrow();
      expect(runtime.snapshot().destination.authorized).toBe(false);
    }
  });
});
