import { expect, it, vi } from "vitest";
import { createHostAgentRuntimes } from "./create-host-runtimes";
import { ControllerConnectionPool } from "./controller-connection";
const host = vi.hoisted(() => ({ available: false }));
vi.mock("@lapis-notes/api/desktop-native", () => ({ hasNativeDesktopCapability: () => host.available, getNativeDesktopBridge: () => null }));
it("gates live controller adapters on the host capability", async () => {
  const pool = new ControllerConnectionPool();
  try {
    host.available = false;
    expect(createHostAgentRuntimes(pool)).toEqual([]);
    host.available = true;
    const runtimes = createHostAgentRuntimes(pool);
    expect(runtimes.map((runtime) => runtime.id)).toEqual(["acp", "codex-native"]);
    expect(runtimes.every((runtime) => runtime.capabilities().preparesContext)).toBe(true);
    expect(await runtimes[0]!.supports({ prompt: "" })).toBe(false);
  } finally { pool.close(); }
});
