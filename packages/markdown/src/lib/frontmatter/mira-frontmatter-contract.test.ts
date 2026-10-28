import { describe, expect, it, vi } from "vitest";

vi.mock("@lapis-notes/api", () => ({
  getFrontMatterInfo: vi.fn(() => ({ frontmatter: "" })),
  Notice: class Notice {
    constructor(public message: string) {}
  },
  normalizeMetadataValue: (_type: string, value: unknown) => value,
}));

// Deliberately unmocked: this contract binds the adapter to the real Mira
// runtime that ships in the installed candidate. A Mira build without the
// displayed-record contract must fail here with an actionable message instead
// of silently refusing every File Properties write at story level.
import { FrontmatterController } from "@lapismd/mira/preview/frontmatter";
import type { FrontmatterControllerCommit } from "@lapismd/mira/preview/frontmatter";

import {
  commitLapisFrontmatterRecord,
  createLapisFrontmatterPropertyManager,
} from "./lapis-frontmatter-adapter";

function createGuardedAppFixture(frontmatter: Record<string, unknown>) {
  let current = structuredClone(frontmatter);
  return {
    app: {
      metadataTypeManager: {
        types: {},
        registeredTypeWidgets: {},
        properties: {},
        getAllProperties() {
          return this.properties;
        },
        getValues: () => [],
        getValuesAsync: async () => [],
        setType: () => undefined,
        rename: async () => ({ updatedFiles: [], failedFiles: [] }),
      },
      fileManager: {
        processFrontMatter: vi.fn(
          async (
            _file: { path: string },
            mutate: (data: Record<string, unknown>) => void,
            options?: {
              expectedFrontmatter?: Readonly<Record<string, unknown>>;
            }
          ) => {
            const next = structuredClone(current);
            mutate(next);
            if (
              options?.expectedFrontmatter !== undefined &&
              JSON.stringify(current) !==
                JSON.stringify(options.expectedFrontmatter)
            ) {
              throw Object.assign(new Error("Displayed properties changed"), {
                code: "ECONFLICT",
              });
            }
            current = next;
          }
        ),
      },
      metadataCache: {
        getCache: () => ({ frontmatter: structuredClone(current) }),
      },
    } as any,
    getFrontmatter: () => current,
  };
}

describe("Mira frontmatter commit contract", () => {
  it("supplies the immutable displayed previousRecord on every committed edit", async () => {
    const commits: FrontmatterControllerCommit[] = [];
    const controller = new FrontmatterController({
      record: { status: "ready" },
      sourcePath: "note.md",
      onRecordChange: (commit) => {
        commits.push(commit);
      },
    });

    controller.commitRecord({ status: "local" });
    await vi.waitFor(() => expect(commits).toHaveLength(1));

    const commit = commits[0]!;
    // A Mira runtime without this contract makes every panel commit refuse its
    // write ("Properties could not verify the displayed version."), leaving
    // frontmatter edits unobservable in the vault.
    expect(
      commit.previousRecord,
      "installed Mira must carry the displayed-record contract (R7 candidate per .pnpmfile.cjs)"
    ).not.toBeNull();
    expect(commit.previousRecord).toEqual({ status: "ready" });
    expect(Object.isFrozen(commit.previousRecord)).toBe(true);
    expect(commit.record).toEqual({ status: "local" });
  });

  it("forwards the real controller baseline into the guarded frontmatter write", async () => {
    const { app, getFrontmatter } = createGuardedAppFixture({
      status: "ready",
    });
    const commits: FrontmatterControllerCommit[] = [];
    const controller = new FrontmatterController({
      record: { status: "ready" },
      propertyManager: createLapisFrontmatterPropertyManager(app),
      sourcePath: "note.md",
      onRecordChange: (commit) => {
        commits.push(commit);
      },
    });

    controller.commitRecord({ status: "local" });
    await vi.waitFor(() => expect(commits).toHaveLength(1));
    await commitLapisFrontmatterRecord(
      app,
      { path: "note.md" } as any,
      commits[0]!
    );

    expect(app.fileManager.processFrontMatter).toHaveBeenCalledWith(
      { path: "note.md" },
      expect.any(Function),
      expect.objectContaining({ expectedFrontmatter: { status: "ready" } })
    );
    expect(getFrontmatter()).toEqual({ status: "local" });
  });
});
