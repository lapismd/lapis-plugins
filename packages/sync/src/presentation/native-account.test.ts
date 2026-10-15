import { expect, it, vi } from "vitest";
import { NativeSyncAccount } from "./native-account";

const server = "https://server.example",
  sessionId = "11111111-1111-4111-8111-111111111111";
function fixture() {
  const state = {
    status: "signed-in",
    serverOrigin: server,
    username: "owner",
    message: "Signed in as owner.",
    verificationUrl: null,
  };
  const invoke = vi.fn(
    async (
      command: string,
      payload?: Record<string, unknown>
    ): Promise<unknown> => {
      if (command.endsWith("_open")) return { sessionId, state };
      if (command.endsWith("_close")) return;
      if (payload?.operation === "request")
        return { status: 200, body: '{"result":{"data":[]}}', state };
      if (payload?.operation === "signOut") state.status = "signed-out";
      return { ...state };
    }
  );
  const account = new NativeSyncAccount({ invoke: invoke as never }, "profile");
  return { account, invoke, state };
}
it("restores account presentation through an admitted native session and proxies only same-origin reads", async () => {
  const f = fixture();
  f.account.configure(server);
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  expect(f.invoke).toHaveBeenCalledWith(
    "desktop_server_account_open",
    expect.objectContaining({ profileId: "profile", serverOrigin: server })
  );
  const response = await f.account.request(`${server}/api/trpc/vault.list`);
  expect(await response.json()).toEqual({ result: { data: [] } });
  await expect(
    f.account.request("https://evil.example/api/trpc/vault.list")
  ).rejects.toThrow(/request/);
  await f.account.signOut();
  expect(f.account.snapshot().status).toBe("signed-out");
  await f.account.dispose();
  expect(f.invoke).toHaveBeenLastCalledWith("desktop_server_account_close", {
    sessionId,
  });
});
it("clears state immediately on destination change and closes the old session before opening another", async () => {
  const f = fixture();
  f.account.configure(server);
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  f.state.serverOrigin = "https://other.example";
  f.account.configure(f.state.serverOrigin);
  expect(f.account.snapshot()).toMatchObject({
    status: "signed-out",
    username: null,
  });
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  expect(f.invoke.mock.calls.map(([command]) => command)).toEqual([
    "desktop_server_account_open",
    "desktop_server_account_close",
    "desktop_server_account_open",
  ]);
  await f.account.dispose();
});
it("fails closed on an older host without the native account protocol", async () => {
  const f = fixture();
  f.invoke.mockRejectedValue(new Error("Unimplemented command"));
  f.account.configure(server);
  await vi.waitFor(() =>
    expect(f.account.snapshot().status).toBe("unavailable")
  );
  expect(f.account.snapshot().message).toContain("Update the desktop host");
  await f.account.dispose();
});
it("does not announce unchanged account state after discovery reads", async () => {
  const f = fixture();
  f.account.configure(server);
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  const changed = vi.fn();
  f.account.subscribe(changed);
  await f.account.request(`${server}/api/trpc/system.info`);
  await f.account.request(`${server}/api/trpc/vault.list`);
  expect(changed).not.toHaveBeenCalled();
  await f.account.dispose();
});
it("rejects a discovery response that arrives after sign-out", async () => {
  const f = fixture();
  f.account.configure(server);
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  const original = f.invoke.getMockImplementation()!;
  let release!: (value: unknown) => void;
  f.invoke.mockImplementation((command, payload) =>
    payload?.operation === "request"
      ? new Promise((resolve) => {
          release = resolve;
        })
      : original(command, payload)
  );
  const request = f.account.request(`${server}/api/trpc/vault.list`);
  await vi.waitFor(() => expect(release).toBeTypeOf("function"));
  await f.account.signOut();
  release({
    status: 200,
    body: '{"result":{"data":[]}}',
    state: { ...f.state, status: "signed-in" },
  });
  await expect(request).rejects.toThrow(/session changed/);
  expect(f.account.snapshot().status).toBe("signed-out");
  await f.account.dispose();
});
