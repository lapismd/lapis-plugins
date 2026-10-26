import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lapismd/mira/preview/frontmatter", () => ({
  createFrontmatterPropertyManager: (config: any = {}) => {
    const types = { ...(config.types ?? {}) };
    return {
      get config() {
        return { ...config, types };
      },
      resolveType(pathString: string, key: string, _value: unknown) {
        const configured = types[pathString] ?? types[key];
        if (typeof configured === "string") return configured;
        if (
          configured &&
          typeof configured === "object" &&
          "type" in configured
        ) {
          return configured.type;
        }
        return "text";
      },
      properties: () => [],
      typeOptions: () => [],
      resolveWidget(kind: string) {
        return (
          config.widgets?.find((widget: any) => widget.type === kind) ?? null
        );
      },
      coerceValue: (value: unknown) => value,
      defaultValue: () => "",
      setType(key: string, type: string) {
        types[key] = type;
      },
      rename: config.rename,
    };
  },
  FrontmatterController: class FrontmatterController {},
}));

vi.mock("@lapis-notes/api", () => ({
  getFrontMatterInfo: vi.fn(() => ({
    frontmatter: "status: external\nowner: outside",
  })),
  Notice: class Notice {
    constructor(public message: string) {}
  },
  normalizeMetadataValue: (type: string, value: unknown) => {
    if (type === "number" && typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  },
}));

import {
  commitLapisFrontmatterRecord,
  createLapisFrontmatterPropertyManager,
  syncLapisFrontmatterController,
} from "./lapis-frontmatter-adapter";
import { getFrontMatterInfo } from "@lapis-notes/api";

function createAppFixture(frontmatter: Record<string, unknown>) {
  const types: Record<string, { name: string; type: string }> = {
    count: { name: "count", type: "number" },
  };
  const registeredTypeWidgets = {
    text: {
      type: "text",
      name: "Text",
      icon: "lucide-text",
      default: () => "",
      validate: () => true,
      render: () => undefined,
    },
    tags: {
      type: "tags",
      name: "Tags",
      icon: "lucide-hash",
      default: () => [],
      validate: () => true,
      render: () => undefined,
    },
    aliases: {
      type: "aliases",
      name: "Aliases",
      icon: "lucide-at-sign",
      default: () => [],
      validate: () => true,
      render: () => undefined,
    },
    number: {
      type: "number",
      name: "Number",
      icon: "lucide-binary",
      default: () => 0,
      validate: () => true,
      render: () => undefined,
    },
  };
  let current = structuredClone(frontmatter);
  let rejectedDraft: Record<string, unknown> | undefined;

  return {
    app: {
      metadataTypeManager: {
        types,
        registeredTypeWidgets,
        properties: {
          title: { name: "title", type: "text", count: 1, files: new Set() },
        },
        getAllProperties() {
          return this.properties;
        },
        getValues(key: string) {
          if (key === "tags") return [["demo"], ["ideas", "project/beta"]];
          return [];
        },
        getValuesAsync: vi.fn(async (key: string) => {
          if (key === "tags") return [["demo"], ["ideas", "project/beta"]];
          return [];
        }),
        setType: vi.fn((key: string, type: string) => {
          types[key] = { name: key, type };
        }),
        rename: vi.fn(async (prev: string, next: string) => {
          if (types[prev]) {
            types[next] = { ...types[prev], name: next };
            delete types[prev];
          }
          return { updatedFiles: ["note.md"], failedFiles: [] };
        }),
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
              rejectedDraft = next;
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
    getRejectedDraft: () => rejectedDraft,
  };
}

describe("lapis frontmatter adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes Lapis definitions while preserving Mira native editors", async () => {
    const { app } = createAppFixture({ title: "Demo" });
    const manager = createLapisFrontmatterPropertyManager(app);

    expect(manager.resolveWidget("tags")?.label).toBe("Tags");
    expect(manager.resolveWidget("tags")?.icon).toBe("lucide-hash");
    expect(manager.resolveWidget("tags")?.render).toBeUndefined();
    expect(manager.resolveWidget("aliases")?.render).toBeUndefined();
    expect(manager.resolveType("count", "count", "2")).toBe("number");
    await expect(
      manager.config.valueSuggestions?.("tags", "ide")
    ).resolves.toEqual(["demo", "ideas", "project/beta"]);
    expect(app.metadataTypeManager.getValuesAsync).not.toHaveBeenCalled();

    manager.setType("status", "text");
    expect(app.metadataTypeManager.setType).toHaveBeenCalledWith(
      "status",
      "text"
    );
  });

  it("commits controller records through processFrontMatter with normalization", async () => {
    const { app, getFrontmatter } = createAppFixture({
      title: "Demo",
      count: "3",
    });

    await commitLapisFrontmatterRecord(app, { path: "note.md" } as any, {
      previousRecord: { title: "Demo", count: "3" },
      record: { title: "Updated", count: "4" },
      yaml: "title: Updated\ncount: 4\n",
      replacement: "---\ntitle: Updated\ncount: 4\n---\n",
      from: null,
      to: null,
    });

    expect(app.fileManager.processFrontMatter).toHaveBeenCalled();
    expect(getFrontmatter()).toEqual({
      title: "Updated",
      count: 4,
    });
  });

  it("passes the captured displayed frontmatter baseline without requiring whole-file equality", async () => {
    const previousRecord = Object.freeze({ status: "ready" });
    const { app, getFrontmatter } = createAppFixture({ status: "ready" });
    const commit = {
      previousRecord,
      record: { status: "local" },
      yaml: "status: local\n",
      replacement: "---\nstatus: local\n---\n",
      from: null,
      to: null,
    };

    await commitLapisFrontmatterRecord(app, { path: "note.md" } as any, commit);

    expect(app.fileManager.processFrontMatter).toHaveBeenCalledWith(
      { path: "note.md" },
      expect.any(Function),
      { expectedFrontmatter: previousRecord }
    );
    expect(getFrontmatter()).toEqual({ status: "local" });
  });

  it("refuses a stale whole-record replacement and retains newer external keys", async () => {
    const external = { status: "external", owner: "outside" };
    const { app, getFrontmatter, getRejectedDraft } =
      createAppFixture(external);
    const commit = {
      previousRecord: Object.freeze({ status: "ready" }),
      record: { status: "local" },
      yaml: "status: local\n",
      replacement: "---\nstatus: local\n---\n",
      from: null,
      to: null,
    };

    await commitLapisFrontmatterRecord(app, { path: "note.md" } as any, commit);

    expect(getFrontmatter()).toEqual(external);
    expect(getRejectedDraft()).toEqual({ status: "local" });
  });

  it("does not write when an older runtime omits the displayed baseline", async () => {
    const { app, getFrontmatter } = createAppFixture({ status: "ready" });
    const commit = {
      previousRecord: Object.freeze({ status: "ready" }),
      record: { status: "local" },
      yaml: "status: local\n",
      replacement: "---\nstatus: local\n---\n",
      from: null,
      to: null,
    };
    Reflect.deleteProperty(commit, "previousRecord");

    await commitLapisFrontmatterRecord(app, { path: "note.md" } as any, commit);

    expect(app.fileManager.processFrontMatter).not.toHaveBeenCalled();
    expect(getFrontmatter()).toEqual({ status: "ready" });
  });

  for (const target of ["note.md", "other.md"]) {
    it(`explicit recovery refreshes only its captured controller target (${target})`, async () => {
      const { app } = createAppFixture({ status: "ready" });
      const controller = {
        sourcePath: "note.md",
        getRecord: () => ({ status: "ready" }),
        update: vi.fn(),
        syncYaml: vi.fn(),
        syncRecord: vi.fn(),
      } as any;
      const file = { path: "note.md" } as any;
      syncLapisFrontmatterController(
        controller,
        app,
        file,
        createLapisFrontmatterPropertyManager(app),
        { status: "ready" }
      );
      const commit = {
        previousRecord: Object.freeze({ status: "ready" }),
        record: { status: "local" },
        yaml: "status: local\n",
        replacement: "---\nstatus: local\n---\n",
        from: null,
        to: null,
      };
      await controller.update.mock.calls[0][0].onRecordChange(commit);
      const options = app.fileManager.processFrontMatter.mock.calls[0][2];
      expect(options?.onReset).toBeTypeOf("function");

      controller.sourcePath = target;
      const saved = "---\nstatus: external\nowner: outside\n---\nNew body\n";
      options.onReset(saved);
      if (target === "note.md") {
        expect(getFrontMatterInfo).toHaveBeenCalledExactlyOnceWith(saved);
        expect(controller.syncYaml).toHaveBeenCalledExactlyOnceWith(
          "status: external\nowner: outside",
          { commit: false }
        );
      } else {
        expect(getFrontMatterInfo).not.toHaveBeenCalled();
        expect(controller.syncYaml).not.toHaveBeenCalled();
      }
    });
  }

  it("synchronizes from the refreshed metadata record instead of a stale cache", () => {
    const { app } = createAppFixture({ status: "planned" });
    const propertyManager = createLapisFrontmatterPropertyManager(app);
    const controller = {
      getRecord: () => ({ status: "planned" }),
      update: vi.fn(),
      syncRecord: vi.fn(),
    } as any;

    syncLapisFrontmatterController(
      controller,
      app,
      { path: "note.md" } as any,
      propertyManager,
      { status: "review" }
    );

    expect(controller.update).toHaveBeenCalled();
    expect(controller.syncRecord).toHaveBeenCalledWith(
      { status: "review" },
      { commit: false }
    );
  });
});
