import { describe, expect, it, vi } from "vitest";
import { returnToTranscriptSource } from "./return-to-source";

describe("returnToTranscriptSource", () => {
  it("activates the leaf recorded when the transcript was opened", async () => {
    const source = { id: "source-leaf" };
    const transcript = { id: "transcript-leaf" };
    const workspace = {
      getLeafById: vi.fn((id: string) => (id === source.id ? source : null)),
      activateLeaf: vi.fn(),
      revealLeaf: vi.fn(async () => undefined),
      requestSaveLayout: vi.fn(),
    };

    await returnToTranscriptSource(
      { workspace } as never,
      transcript as never,
      { id: source.id },
    );

    expect(workspace.activateLeaf).toHaveBeenCalledWith(source, {
      focusRootHost: false,
      source: "api",
      operation: "close-transcript",
    });
    expect(workspace.revealLeaf).toHaveBeenCalledWith(source);
    expect(workspace.requestSaveLayout).toHaveBeenCalledOnce();
  });

  it("leaves the workspace alone when the source leaf is gone", async () => {
    const workspace = {
      getLeafById: vi.fn(() => null),
      activateLeaf: vi.fn(),
      revealLeaf: vi.fn(),
      requestSaveLayout: vi.fn(),
    };

    await returnToTranscriptSource({ workspace } as never, { id: "leaf" } as never, {});

    expect(workspace.activateLeaf).not.toHaveBeenCalled();
  });
});
