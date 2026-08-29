import { describe, expect, it } from "vitest";
import {
  createHarperLinterForRuntime,
  type HarperLinterLike,
  shouldUseHarperWorker,
} from "./harper";

function createMockLinter(options: {
  setup?: () => Promise<void>;
  dispose?: () => Promise<void>;
}): HarperLinterLike {
  return {
    setup: options.setup ?? (async () => undefined),
    lint: async () => [],
    applySuggestion: async (text) => text,
    setDialect: async () => undefined,
    getDefaultLintConfig: async () => ({}),
    setLintConfig: async () => undefined,
    importWords: async () => undefined,
    clearWords: async () => undefined,
    importIgnoredLints: async () => undefined,
    clearIgnoredLints: async () => undefined,
    contextHash: async () => 0n,
    dispose: options.dispose,
  };
}

describe("Harper runtime selection", () => {
  it("uses the worker linter only when the renderer provides Worker", () => {
    expect(
      shouldUseHarperWorker({ nodeRuntime: false, workerAvailable: true }),
    ).toBe(true);
    expect(
      shouldUseHarperWorker({ nodeRuntime: false, workerAvailable: false }),
    ).toBe(false);
    expect(
      shouldUseHarperWorker({ nodeRuntime: true, workerAvailable: true }),
    ).toBe(false);
  });

  it("falls back when the worker setup never settles", async () => {
    let workerDisposed = false;
    const workerLinter = createMockLinter({
      setup: () => new Promise(() => undefined),
      dispose: async () => {
        workerDisposed = true;
      },
    });
    const localLinter = createMockLinter({});

    await expect(
      createHarperLinterForRuntime({
        nodeRuntime: false,
        workerAvailable: true,
        workerSetupTimeoutMs: 1,
        createWorker: () => workerLinter,
        createLocal: () => localLinter,
      }),
    ).resolves.toBe(localLinter);
    expect(workerDisposed).toBe(true);
  });

  it("falls back when constructing the worker linter fails", async () => {
    const localLinter = createMockLinter({});

    await expect(
      createHarperLinterForRuntime({
        nodeRuntime: false,
        workerAvailable: true,
        createWorker: () => {
          throw new Error("module workers unavailable");
        },
        createLocal: () => localLinter,
      }),
    ).resolves.toBe(localLinter);
  });

  it("keeps a worker that becomes ready before the deadline", async () => {
    let workerDisposed = false;
    const workerLinter = createMockLinter({
      dispose: async () => {
        workerDisposed = true;
      },
    });

    await expect(
      createHarperLinterForRuntime({
        nodeRuntime: false,
        workerAvailable: true,
        workerSetupTimeoutMs: 10,
        createWorker: () => workerLinter,
        createLocal: () => createMockLinter({}),
      }),
    ).resolves.toBe(workerLinter);
    expect(workerDisposed).toBe(false);
  });
});
