import { afterEach, expect, it, vi } from "vitest";
import { MemoryServerAccount } from "./server-account";

const accounts: MemoryServerAccount[] = [];
afterEach(async () => {
  await Promise.all(accounts.splice(0).map((account) => account.dispose()));
});
const origin = "https://sync.example.test";
const requestId = "r".repeat(43),
  token = "t".repeat(43);
function fixture() {
  let approved = false,
    deny = false;
  const request = vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith("/start"))
      return Response.json(
        {
          requestId,
          expiresAt: Date.now() + 299_000,
          verificationUrl: `${origin}/?authorize_client=${requestId}`,
        },
        { status: 201 }
      );
    if (path.endsWith("/token"))
      return deny
        ? new Response(null, { status: 403 })
        : approved
        ? Response.json({
            status: "authorized",
            accessToken: token,
            tokenType: "Bearer",
          })
        : Response.json({ status: "pending" }, { status: 202 });
    if (path.endsWith("auth.current")) {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        `Bearer ${token}`
      );
      expect(init?.credentials).toBe("omit");
      return Response.json({
        result: { data: { user: { id: "owner-id", username: "owner" } } },
      });
    }
    return Response.json({ ok: true });
  });
  const account = new MemoryServerAccount(request);
  accounts.push(account);
  account.configure(origin);
  return {
    account,
    request,
    approve: () => {
      approved = true;
    },
    deny: () => {
      deny = true;
    },
  };
}
it("keeps credentials outside presentation and uses the granted session for account requests and sign-out", async () => {
  const f = fixture();
  f.approve();
  await f.account.signIn();
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-in"));
  expect(f.account.snapshot().username).toBe("owner");
  expect(JSON.stringify(f.account.snapshot())).not.toContain(token);
  expect(JSON.stringify(f.account.snapshot())).not.toContain("verifier");
  expect(
    (await f.account.request("https://other.example/api/trpc/auth.current"))
      .status
  ).toBe(401);
  expect(
    f.request.mock.calls.filter(([input]) =>
      String(input).includes("other.example")
    )
  ).toHaveLength(0);
  await f.account.signOut();
  expect(f.account.snapshot().status).toBe("signed-out");
  expect(
    (await f.account.request(`${origin}/api/trpc/auth.current`)).status
  ).toBe(401);
});
it("shows cancellation and rejects denied handoffs", async () => {
  const f = fixture();
  await f.account.signIn();
  expect(f.account.snapshot()).toMatchObject({
    status: "signing-in",
    verificationUrl: `${origin}/?authorize_client=${requestId}`,
  });
  await f.account.cancel();
  expect(f.account.snapshot()).toMatchObject({
    status: "signed-out",
    verificationUrl: null,
  });
  expect(
    f.request.mock.calls.some(([input]) => String(input).endsWith("/cancel"))
  ).toBe(true);
  f.deny();
  await f.account.signIn();
  await vi.waitFor(() =>
    expect(f.account.snapshot().message).toMatch(/rejected/)
  );
});
it("revokes a late grant after the destination changes and never applies it to the new server", async () => {
  const f = fixture();
  let finish!: (response: Response) => void;
  const normal = f.request.getMockImplementation()!;
  f.request.mockImplementation((input, init) =>
    String(input).endsWith("/token")
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : normal(input, init)
  );
  await f.account.signIn();
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  f.account.configure("https://new.example");
  finish(
    Response.json({
      status: "authorized",
      accessToken: token,
      tokenType: "Bearer",
    })
  );
  await vi.waitFor(() =>
    expect(
      f.request.mock.calls.some(
        ([input]) => String(input) === `${origin}/api/trpc/auth.logout`
      )
    ).toBe(true)
  );
  expect(f.account.snapshot()).toMatchObject({
    serverUrl: "https://new.example",
    status: "signed-out",
    username: null,
  });
});
it("rejects a verification URL on a different server and exposes retryable offline failure", async () => {
  const f = fixture();
  f.request.mockResolvedValueOnce(
    Response.json({
      requestId,
      expiresAt: Date.now() + 299_000,
      verificationUrl: "https://other.example/",
    })
  );
  await f.account.signIn();
  expect(f.account.snapshot()).toMatchObject({
    status: "error",
    verificationUrl: null,
  });
  f.request.mockRejectedValueOnce(new Error("sensitive server details"));
  await f.account.signIn();
  expect(f.account.snapshot().message).toMatch(/Check the server address/);
  expect(JSON.stringify(f.account.snapshot())).not.toContain("sensitive");
});

it("revokes a grant cancelled while its account details are still loading", async () => {
  const f = fixture();
  f.approve();
  let finish!: (response: Response) => void;
  const normal = f.request.getMockImplementation()!;
  f.request.mockImplementation((input, init) =>
    String(input).endsWith("auth.current")
      ? new Promise<Response>(resolve => { finish = resolve; })
      : normal(input, init),
  );
  await f.account.signIn();
  await vi.waitFor(() => expect(finish).toBeTypeOf("function"));
  await f.account.cancel();
  finish(Response.json({ result: { data: { user: { username: "owner" } } } }));
  await vi.waitFor(() => expect(f.account.snapshot().status).toBe("signed-out"));
  expect((await f.account.request(`${origin}/api/trpc/auth.current`)).status).toBe(401);
});
