// @vitest-environment node
import { expect, it, vi } from "vitest";
import { ControllerClient } from "@lapismd/ai-controller/client";
import { ControllerConnectionPool } from "./controller-connection";
import type { NativeDesktopBridge } from "@lapis-notes/api/desktop-native";
const descriptor = {
  url: "ws://127.0.0.1:7347",
  token: "controller-test-token-long-enough",
  workspace: "default",
};
function bridge(invoke = vi.fn(async () => descriptor)) {
  return { runtime: "deno-desktop", invoke } as unknown as NativeDesktopBridge;
}
it("shares concurrent connection requests and closes the client with its plugin", async () => {
  const host = bridge();
  const pool = new ControllerConnectionPool(() => host);
  const [first, second] = await Promise.all([
    pool.get("/vault"),
    pool.get("/vault"),
  ]);
  expect(first).toBe(second);
  expect(host.invoke).toHaveBeenCalledOnce();
  const dispose = vi.spyOn(first.client, "dispose");
  pool.close();
  await Promise.resolve();
  expect(dispose).toHaveBeenCalledOnce();
  await expect(pool.get()).rejects.toThrow("closed");
});
it("invalidates pending connections when the host is replaced", async () => {
  let finish!: (value: typeof descriptor) => void;
  let host = bridge(
    vi.fn(
      () =>
        new Promise<typeof descriptor>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  const pool = new ControllerConnectionPool(() => host);
  const pending = pool.get("/vault");
  const rejected = expect(pending).rejects.toThrow("changed during startup");
  host = bridge();
  const current = await pool.get("/vault");
  finish(descriptor);
  await rejected;
  expect(current.client).toBeInstanceOf(ControllerClient);
  expect(await pool.get("/vault")).toBe(current);
  pool.close();
});
it("rejects malformed descriptors and allows a later retry", async () => {
  const invoke = vi
    .fn()
    .mockResolvedValueOnce({ ...descriptor, workspace: 42 })
    .mockResolvedValueOnce(descriptor);
  const pool = new ControllerConnectionPool(() => host);
  const host = bridge(invoke);
  try {
    await expect(pool.get()).rejects.toThrow("invalid");
    expect((await pool.get()).workspace).toBe("default");
    expect(invoke).toHaveBeenCalledTimes(2);
  } finally {
    pool.close();
  }
});
