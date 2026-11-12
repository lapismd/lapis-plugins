import { mountComponent, type App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CanvasEmbed } from "@lapis-notes/canvas";
import {
  SAMPLE_CONNECTORS_CANVAS_PATH,
  SAMPLE_FILE_CANVAS_PATH,
  SAMPLE_GROUP_CANVAS_PATH,
  SAMPLE_LINK_CANVAS_PATH,
  SAMPLE_SECTION_CANVAS_PATH,
  SAMPLE_TEXT_CANVAS_PATH,
  SAMPLE_READING_NOTE_PATH,
} from "@lapis-notes/canvas";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const meta = {
  title: "Plugins/Canvas/Features",
  component: CanvasEmbed,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "One story for each canvas feature from the legacy sample vault: text, whole-file notes, a heading section, a link, a group, labeled connectors, and the note embed.",
      },
    },
  },
} satisfies Meta<typeof ViewingPanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

const featureSource = `<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { CanvasPlugin } from "@lapis-notes/canvas";

  let { app }: { app: App } = $props();
</script>

<WorkspaceShell {app} />`;

function featureParameters(description: string) {
  return {
    docs: {
      description: { story: description },
      source: {
        code: featureSource,
        language: "tsx",
        type: "code",
      },
    },
  };
}

function featureStory(
  name: string,
  description: string,
  props: { canvasPath?: string; focus?: "canvas" | "note"; files?: Record<string, string> },
  assert: (root: HTMLElement) => void,
): Story {
  return {
    name,
    parameters: featureParameters(description),
    render: () => ({
      Component: ViewingPanelDemo,
      props: { layout: "middle-top-tabs", ...props },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]'),
          ).not.toBeNull(),
        { timeout: 30_000 },
      );
      const root = await waitFor(
        () => {
          const view = canvasElement.querySelector<HTMLElement>(
            props.focus === "note"
              ? ".markdown-preview-view, .markdown-reading-view"
              : ".canvas-view-root:not([data-canvas-embed])",
          );
          expect(view).not.toBeNull();
          return view!;
        },
        { timeout: 30_000 },
      );
      await waitFor(() => assert(root), { timeout: 30_000 });
    },
  };
}

function expectText(root: HTMLElement, text: string) {
  expect(root.textContent).toContain(text);
}

export const Text = featureStory(
  "Text",
  "A colored text node renders its markdown inside the card.",
  { canvasPath: SAMPLE_TEXT_CANVAS_PATH },
  (root) => {
    expectText(root, "Canvas overview");
    expectText(root, "Text nodes should render markdown and retain their color.");
  },
);

export const File = featureStory(
  "File",
  "A colored file node shows the note name and its markdown.",
  { canvasPath: SAMPLE_FILE_CANVAS_PATH },
  (root) => {
    expectText(root, "Markdown Feature Tour.md");
    expectText(root, "A file node keeps this note's markdown inside the card.");
  },
);

export const Section = featureStory(
  "Section",
  "A file node with a heading subpath stays on the read-only section.",
  { canvasPath: SAMPLE_SECTION_CANVAS_PATH },
  (root) => {
    expectText(root, "Lists");
    expectText(root, "Lists stay in the card");
  },
);

export const Link = featureStory(
  "Link",
  "A colored link node shows the host and an open action.",
  { canvasPath: SAMPLE_LINK_CANVAS_PATH },
  (root) => {
    expectText(root, "app.lapis.md");
    const link = within(root).getByRole("link", { name: "Open link", exact: true });
    expect(link).toHaveAttribute("href", expect.stringContaining("https://app.lapis.md"));
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(root).getByRole("button", { name: "Load web preview", exact: true })).toBeVisible();
    expect(root.querySelector("iframe")).toBeNull();
  },
);

export const Group = featureStory(
  "Group",
  "A colored group keeps its label and contains a text node.",
  { canvasPath: SAMPLE_GROUP_CANVAS_PATH },
  (root) => {
    const label = root.querySelector<HTMLInputElement>(
      ".canvas-group-label-input",
    );
    expect(label?.value).toBe("Canvas test group");
    expectText(root, "Canvas overview");
  },
);

export const Connectors = featureStory(
  "Connectors",
  "Labeled connectors join nodes, including an arrow-ended connector.",
  { canvasPath: SAMPLE_CONNECTORS_CANVAS_PATH },
  (root) => {
    expectText(root, "embeds");
    expectText(root, "references");
    expect(root.querySelector(".svelte-flow__edge")).not.toBeNull();
  },
);

export const Embed = featureStory(
  "Embed",
  "A note embeds the feature canvas beside a plain markdown paragraph.",
  { focus: "note" },
  (root) => {
    const embed = root.querySelector("[data-canvas-embed]");
    const node = embed?.querySelector<HTMLElement>(".svelte-flow__node");
    expect(embed).not.toBeNull();
    expect(node?.getBoundingClientRect().width ?? 0).toBeGreaterThan(40);
    expectText(root, "A plain paragraph stays a Markdown preview.");
    expectText(root, "Canvas test group");
  },
);

const importedDocument = JSON.stringify({
  metadata: { origin: "JSON Canvas" },
  nodes: [
    { id: "small", type: "text", x: 0, y: 0, width: 80, height: 60, text: "Imported" },
    { id: "target", type: "text", x: 220, y: 0, width: 200, height: 120, text: "Target" },
  ],
  edges: [{ id: "default-arrow", fromNode: "small", fromSide: "right", toNode: "target", toSide: "left" }],
});

export const ImportedGeometry = featureStory(
  "Imported geometry and default arrow",
  "An imported small card keeps its dimensions and an omitted target endpoint renders an arrow.",
  { canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  (root) => {
    const small = root.querySelector<HTMLElement>('.svelte-flow__node[data-id="small"]');
    expect(small?.style.width).toBe("80px");
    expect(small?.style.height).toBe("60px");
    expect(root.querySelectorAll(".canvas-flow-edge-arrow")).toHaveLength(1);
  },
);

export const InvalidDocument: Story = {
  name: "Invalid document stays protected",
  parameters: featureParameters("A malformed document shows an error instead of a writable empty board."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Invalid.canvas", files: { "Invalid.canvas": "[]" } },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('[data-status="ready"]')).not.toBeNull();
      expect(canvasElement.querySelector(".canvas-view-error")?.textContent).toContain("Canvas document must be an object");
      expect(canvasElement.querySelector(".canvas-view-surface")).toBeNull();
    }, { timeout: 30_000 });
  },
};

export const GroupImportedCards: Story = {
  name: "Group imported cards below their content",
  parameters: featureParameters("Grouping imported cards keeps the new frame below both cards."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const root = await waitFor(() => {
      expect(canvasElement.querySelector('[data-status="ready"]')).not.toBeNull();
      const board = canvasElement.querySelector<HTMLElement>(".canvas-view-root");
      expect(board?.querySelectorAll(".svelte-flow__node")).toHaveLength(2);
      return board!;
    }, { timeout: 30_000 });
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="small"] .canvas-node-label')!);
    await userEvent.keyboard('[ControlLeft>]');
    await userEvent.click(root.querySelector<HTMLElement>('[data-id="target"] .canvas-node-label')!);
    await userEvent.keyboard('[/ControlLeft]');
    const group = await within(root).findByRole("button", { name: "Create group", exact: true });
    await userEvent.click(group);
    await waitFor(() => expect(root.querySelectorAll(".svelte-flow__node")).toHaveLength(3));
    await userEvent.click(root.querySelector<HTMLElement>(".svelte-flow__pane")!);
    await waitFor(() => {
      const frame = root.querySelector<HTMLElement>('.svelte-flow__node:has(.canvas-node-label-group)')!;
      const small = root.querySelector<HTMLElement>('[data-id="small"]')!;
      expect(Number(getComputedStyle(frame).zIndex)).toBeLessThan(Number(getComputedStyle(small).zIndex));
    });
  },
};

async function canvasOwner(element: HTMLElement): Promise<App> {
  return waitFor(() => {
    const host = element.querySelector<HTMLElement>('[data-panel-kind="canvas"][data-status="ready"]') as (HTMLElement & { __lapisApp?: App }) | null;
    expect(host?.__lapisApp).toBeDefined();
    return host!.__lapisApp!;
  }, { timeout: 30_000 });
}

export const SaveBeforeSwitch: Story = {
  name: "Save stays on its original file during a switch",
  parameters: featureParameters("Switching boards waits for the pending source write and leaves the destination document unchanged."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const nextRaw = JSON.stringify({ nodes: [{ id: "next", type: "text", x: 0, y: 0, width: 260, height: 160, text: "Next board" }] });
    const nextFile = await app.vault.create("Next.canvas", nextRaw);
    const original = app.vault.modifyIfUnchanged.bind(app.vault);
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => { finish = resolve; });
    let began!: () => void;
    const started = new Promise<void>((resolve) => { began = resolve; });
    app.vault.modifyIfUnchanged = async (file, data, expected, options) => {
      if (file.path === "Imported.canvas") {
        began();
        await gate;
      }
      return original(file, data, expected, options);
    };
    let switching: Promise<void> | undefined;
    try {
      const board = within(canvasElement);
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="small"] .canvas-node-label')!);
      await userEvent.click(await board.findByRole("button", { name: "Set color", exact: true }));
      await userEvent.click(board.getByRole("button", { name: "Set node color 4", exact: true }));
      const leaf = app.workspace.activeLeaf!;
      switching = leaf.openFile(nextFile);
      await started;
      expect((leaf.view as unknown as { file: { path: string } }).file.path).toBe("Imported.canvas");
      finish();
      await switching;
      await waitFor(() => expect(canvasElement.textContent).toContain("Next board"));
      expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Imported.canvas")!)).nodes[0].color).toBe("4");
      expect(await app.vault.read(nextFile)).toBe(nextRaw);
    } finally {
      finish();
      try {
        await switching;
      } finally {
        app.vault.modifyIfUnchanged = original;
      }
    }
  },
};

export const RetrySave: Story = {
  name: "Failed save retains the board and retries",
  parameters: featureParameters("A failed write keeps the board visible and the Retry save action persists the retained draft."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const original = app.vault.modifyIfUnchanged.bind(app.vault);
    let rejectNext = true;
    app.vault.modifyIfUnchanged = async (file, data, expected, options) => {
      if (file.path === "Imported.canvas" && rejectNext) {
        rejectNext = false;
        throw new Error("Storage temporarily unavailable");
      }
      return original(file, data, expected, options);
    };
    try {
      const board = within(canvasElement);
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="small"] .canvas-node-label')!);
      await userEvent.click(await board.findByRole("button", { name: "Set color", exact: true }));
      await userEvent.click(board.getByRole("button", { name: "Set node color 4", exact: true }));
      const alert = await board.findByRole("alert");
      expect(alert).toHaveTextContent("Storage temporarily unavailable");
      expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2);
      expect(canvasElement.querySelector(".canvas-view-error")).toBeNull();
      await userEvent.click(board.getByRole("button", { name: "Retry save", exact: true }));
      await waitFor(async () => {
        const value = JSON.parse(await app.vault.read(app.vault.getFileByPath("Imported.canvas")!));
        expect(value.nodes[0].color).toBe("4");
        expect(board.queryByRole("alert")).toBeNull();
      });
    } finally {
      app.vault.modifyIfUnchanged = original;
    }
  },
};

export const ExternalConflict: Story = {
  name: "External changes require a reviewed recovery",
  parameters: featureParameters("A stale Canvas save preserves external bytes and publishes the App-owned conflict; keeping the local board uses the reviewed external baseline."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const file = app.vault.getFileByPath("Imported.canvas")!;
    const external = JSON.parse(importedDocument);
    external.nodes[0].text = "Externally changed card";
    const externalRaw = JSON.stringify(external);
    await app.vault.modify(file, externalRaw);
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="small"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Set color", exact: true }));
    await userEvent.click(board.getByRole("button", { name: "Set node color 4", exact: true }));
    await waitFor(() => expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1));
    expect(await app.vault.read(file)).toBe(externalRaw);
    expect(app.fileEditingSessions.textConflicts.entries[0].external).toBe(externalRaw);
    expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2);
    await app.fileEditingSessions.textConflicts.entries[0].resolve("keep-local");
    await waitFor(() => expect(board.queryByRole("alert")).toBeNull());
    const saved = JSON.parse(await app.vault.read(file));
    expect(saved.nodes[0]).toMatchObject({ text: "Imported", color: "4" });
    expect(saved.metadata).toEqual({ origin: "JSON Canvas" });
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
  },
};

const editableTextDocument = JSON.stringify({ nodes: [{ id: "draft", type: "text", x: 0, y: 0, width: 360, height: 240, text: "Original card text" }] });

export const TextBeforeSwitch: Story = {
  name: "Pending text-card edits flush before switching",
  parameters: featureParameters("A real Mira text-card draft belongs to the parent Canvas writer before its debounce, and switching files drains both editor and JSON persistence."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Draft.canvas", files: { "Draft.canvas": editableTextDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const next = await app.vault.create("After draft.canvas", JSON.stringify({ nodes: [{ id: "after", type: "text", x: 0, y: 0, width: 260, height: 160, text: "After the draft" }] }));
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    const editor = await waitFor(() => {
      const editor = canvasElement.querySelector<HTMLElement>('[data-id="draft"] [contenteditable="true"]');
      expect(editor).not.toBeNull();
      return editor!;
    });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}Pending card draft");
    expect(app.fileEditingSessions.hasDirty("Draft.canvas")).toBe(true);
    await app.workspace.activeLeaf!.openFile(next);
    await waitFor(() => expect(canvasElement.textContent).toContain("After the draft"));
    const saved = JSON.parse(await app.vault.read(app.vault.getFileByPath("Draft.canvas")!));
    expect(saved.nodes[0].text.trim()).toBe("Pending card draft");
    expect(app.fileEditingSessions.hasDirty("Draft.canvas")).toBe(false);
  },
};

export const TextBeforeRename: Story = {
  name: "Pending text-card edits follow a guarded rename",
  parameters: featureParameters("The public file manager guards and flushes pending card text before rename; the existing Canvas view rebinds its writer to the new file."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Draft.canvas", files: { "Draft.canvas": editableTextDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    const editor = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>('[data-id="draft"] [contenteditable="true"]');
      expect(value).not.toBeNull();
      return value!;
    });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}Renamed card draft");
    await app.fileManager.renameFile(app.vault.getFileByPath("Draft.canvas")!, "Renamed.canvas");
    await waitFor(() => expect((app.workspace.activeLeaf!.view as unknown as { file: { path: string } }).file.path).toBe("Renamed.canvas"));
    expect(app.vault.getFileByPath("Draft.canvas")).toBeNull();
    expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Renamed.canvas")!)).nodes[0].text.trim()).toBe("Renamed card draft");
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Set color", exact: true }));
    await userEvent.click(board.getByRole("button", { name: "Set node color 4", exact: true }));
    await app.fileEditingSessions.flush("Renamed.canvas");
    expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Renamed.canvas")!)).nodes[0].color).toBe("4");
    expect(app.fileEditingSessions.hasDirty("Draft.canvas")).toBe(false);
  },
};

export const PendingTextConflict: Story = {
  name: "Pending text-card conflicts retain the complete draft",
  parameters: featureParameters("A real Mira draft participates in Canvas conflict review and becomes clean only after the complete JSON document is durably acknowledged."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Draft.canvas", files: { "Draft.canvas": editableTextDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const file = app.vault.getFileByPath("Draft.canvas")!;
    const external = JSON.parse(editableTextDocument);
    external.nodes[0].text = "External card text";
    const externalRaw = JSON.stringify(external);
    await app.vault.modify(file, externalRaw);
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    const editor = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>('[data-id="draft"] [contenteditable="true"]');
      expect(value).not.toBeNull();
      return value!;
    });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}Reviewed pending card draft");
    await waitFor(() => expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1));
    const conflict = app.fileEditingSessions.textConflicts.entries[0];
    expect(JSON.parse(conflict.local).nodes[0].text.trim()).toBe("Reviewed pending card draft");
    expect(await app.vault.read(file)).toBe(externalRaw);
    await conflict.resolve("keep-local");
    expect(JSON.parse(await app.vault.read(file)).nodes[0].text.trim()).toBe("Reviewed pending card draft");
    expect(app.fileEditingSessions.hasDirty("Draft.canvas")).toBe(false);
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
  },
};

export const PendingTextUseExternal: Story = {
  name: "Reviewed external text resets the card editor buffer",
  parameters: featureParameters("Accepting the external version updates the live editor and graph together; a stale text-card effect must not queue the discarded draft again."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Draft.canvas", files: { "Draft.canvas": editableTextDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const file = app.vault.getFileByPath("Draft.canvas")!;
    const external = JSON.parse(editableTextDocument);
    external.nodes[0].text = "Accepted external card text";
    const externalRaw = JSON.stringify(external);
    await app.vault.modify(file, externalRaw);
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    const editor = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>('[data-id="draft"] [contenteditable="true"]');
      expect(value).not.toBeNull();
      return value!;
    });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}Discard this local draft");
    await waitFor(() => expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1));
    await app.fileEditingSessions.textConflicts.entries[0].resolve("use-external");
    await app.fileEditingSessions.flush("Draft.canvas");
    expect(await app.vault.read(file)).toBe(externalRaw);
    await waitFor(() => expect(canvasElement.querySelector('[data-id="draft"]')).toHaveTextContent("Accepted external card text"));
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    await waitFor(() => expect(canvasElement.querySelector('[data-id="draft"] [contenteditable="true"]')).toHaveTextContent("Accepted external card text"));
    expect(app.fileEditingSessions.hasDirty("Draft.canvas")).toBe(false);
  },
};

export const EmptyBoardAuthoring: Story = {
  name: "Empty boards create cards with undo and redo",
  parameters: featureParameters("Accessible authoring controls populate a new empty board and creation participates in persistent board history."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Empty.canvas", files: { "Empty.canvas": '{"nodes":[],"edges":[]}' } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const board = within(canvasElement);
    await userEvent.click(await board.findByRole("button", { name: "Add text card", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(1));
    await userEvent.click(board.getByRole("button", { name: "Add group", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await userEvent.click(board.getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(1));
    await userEvent.click(board.getByRole("button", { name: "Redo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await app.fileEditingSessions.flush("Empty.canvas");
    const saved = JSON.parse(await app.vault.read(app.vault.getFileByPath("Empty.canvas")!));
    expect(saved.nodes.map((node: { type: string }) => node.type).sort()).toEqual(["group", "text"]);
  },
};

export const FileAndWebAuthoring: Story = {
  name: "File and web creation respects App input protection",
  parameters: featureParameters("Vault-file and HTTP(S) authoring use accessible dialogs, and App guards protect modal input along with the board."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Empty.canvas", files: { "Empty.canvas": '{"nodes":[],"edges":[]}' } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const file = await app.vault.create("Picker note.md", "# Picker note");
    const board = within(canvasElement);
    await userEvent.click(await board.findByRole("button", { name: "Add vault file", exact: true }));
    const dialog = board.getByRole("dialog", { name: "Add vault file", exact: true });
    await userEvent.selectOptions(within(dialog).getByLabelText("Vault file"), file.path);
    let release!: () => void;
    let began!: () => void;
    const started = new Promise<void>((resolve) => { began = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const guarded = app.fileEditingSessions.guard("Empty.canvas", async () => { began(); await gate; });
    try {
      await started;
      expect((dialog as HTMLDialogElement).inert).toBe(true);
    } finally {
      release();
      await guarded;
    }
    expect((dialog as HTMLDialogElement).inert).toBe(false);
    await userEvent.click(within(dialog).getByRole("button", { name: "Add card", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(1));
    await userEvent.click(board.getByRole("button", { name: "Add web page", exact: true }));
    const web = board.getByRole("dialog", { name: "Add web page", exact: true });
    await userEvent.type(within(web).getByLabelText("Web address"), "https://example.com/canvas");
    await userEvent.click(within(web).getByRole("button", { name: "Add card", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await app.fileEditingSessions.flush("Empty.canvas");
    const saved = JSON.parse(await app.vault.read(app.vault.getFileByPath("Empty.canvas")!));
    expect(saved.nodes).toEqual(expect.arrayContaining([expect.objectContaining({ type: "file", file: file.path }), expect.objectContaining({ type: "link", url: "https://example.com/canvas" })]));
  },
};

export const ClipboardHistory: Story = {
  name: "Selection clipboard remaps cards and connectors with history",
  parameters: featureParameters("Duplicate, cut and paste keep the selected subgraph and remap IDs and internal edges; undo and redo restore the complete document."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const board = within(canvasElement);
    const node = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-id="${id}"] .canvas-node-label`)!;
    await userEvent.click(node("small"));
    await userEvent.keyboard("{Control>}");
    await userEvent.click(node("target"));
    await userEvent.keyboard("{/Control}");
    await userEvent.click(board.getByRole("button", { name: "Duplicate selection", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(4));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__edge")).toHaveLength(2));
    await userEvent.click(board.getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await userEvent.click(board.getByRole("button", { name: "Redo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(4));
    // History restores document state; explicitly select the duplicate pair.
    const added = Array.from(canvasElement.querySelectorAll<HTMLElement>(".svelte-flow__node")).filter((element) => !["small", "target"].includes(element.dataset.id!));
    await userEvent.click(added[0].querySelector<HTMLElement>(".canvas-node-label")!);
    await userEvent.keyboard("{Control>}");
    await userEvent.click(added[1].querySelector<HTMLElement>(".canvas-node-label")!);
    await userEvent.keyboard("{/Control}");
    const removedIds = added.map((element) => element.dataset.id);
    await userEvent.click(board.getByRole("button", { name: "Cut selection", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await userEvent.click(board.getByRole("button", { name: "Paste cards", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(4));
    await app.fileEditingSessions.flush("Imported.canvas");
    const saved = JSON.parse(await app.vault.read(app.vault.getFileByPath("Imported.canvas")!));
    expect(new Set(saved.nodes.map((node: { id: string }) => node.id)).size).toBe(4);
    expect(saved.nodes.some((node: { id: string }) => removedIds.includes(node.id))).toBe(false);
    expect(saved.edges).toHaveLength(2);
    expect(saved.metadata).toEqual({ origin: "JSON Canvas" });
    for (const edge of saved.edges) {
      expect(saved.nodes.some((node: { id: string }) => node.id === edge.fromNode)).toBe(true);
      expect(saved.nodes.some((node: { id: string }) => node.id === edge.toNode)).toBe(true);
    }
  },
};

export const TextEditingHistory: Story = {
  name: "Text editor undo and board history keep their own sessions",
  parameters: featureParameters("Editor shortcuts operate on text, and a completed text session becomes one board history entry after its pending draft is drained."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Draft.canvas", files: { "Draft.canvas": editableTextDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const board = within(canvasElement);
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="draft"] .canvas-node-label')!);
    await userEvent.click(await board.findByRole("button", { name: "Edit node", exact: true }));
    const editor = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>('[data-id="draft"] [contenteditable="true"]');
      expect(value).not.toBeNull(); return value!;
    });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}First text draft");
    await app.fileEditingSessions.flush("Draft.canvas");
    const beforeEditorUndo = editor.textContent;
    await userEvent.keyboard("{Control>}z{/Control}");
    await waitFor(() => expect(editor.textContent).not.toBe(beforeEditorUndo));
    expect(editor.isConnected).toBe(true);
    await userEvent.keyboard("{Control>}a{/Control}Completed text draft");
    await app.fileEditingSessions.flush("Draft.canvas");
    await userEvent.click(board.getByRole("button", { name: "Undo", exact: true }));
    await app.fileEditingSessions.flush("Draft.canvas");
    expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Draft.canvas")!)).nodes[0].text).toBe("Original card text");
    await userEvent.click(board.getByRole("button", { name: "Redo", exact: true }));
    await app.fileEditingSessions.flush("Draft.canvas");
    expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Draft.canvas")!)).nodes[0].text.trim()).toBe("Completed text draft");
  },
};

export const DropAndContextAuthoring: Story = {
  name: "Vault paths and URLs drop at the pointer and context actions create groups",
  parameters: featureParameters("A standard URI list creates vault-file and HTTP(S) cards at the drop point; comments and unsafe protocols are ignored. Context creation is available without a selection."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Empty.canvas", files: { "Empty.canvas": '{"nodes":[],"edges":[]}' } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    await app.vault.create("Dropped note.md", "# Dropped note");
    await within(canvasElement).findByRole("toolbar", { name: "Canvas authoring", exact: true });
    const pane = await waitFor(() => {
      const value = canvasElement.querySelector<HTMLElement>(".svelte-flow__pane");
      expect(value).not.toBeNull(); return value!;
    });
    const rect = pane.getBoundingClientRect();
    const transfer = new DataTransfer();
    transfer.setData("text/uri-list", "# Canvas drop\nhttps://example.com/dropped\nDropped note.md\njavascript:alert(1)");
    const toolbar = within(canvasElement).getByRole("toolbar", { name: "Canvas authoring", exact: true });
    expect(toolbar.closest(".canvas-view-root")?.contains(pane), "drop pane belongs to the editable board").toBe(true);
    const dropped = new DragEvent("drop", { bubbles: true, cancelable: true, clientX: rect.left + rect.width / 3, clientY: rect.top + rect.height / 3, dataTransfer: transfer });
    pane.dispatchEvent(dropped);
    expect(dropped.defaultPrevented, "board consumes the drop").toBe(true);
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    await app.fileEditingSessions.flush("Empty.canvas");
    const saved = JSON.parse(await app.vault.read(app.vault.getFileByPath("Empty.canvas")!));
    expect(saved.nodes[0]).toMatchObject({ type: "link", url: "https://example.com/dropped" });
    expect(saved.nodes[1]).toMatchObject({ type: "file", file: "Dropped note.md", x: saved.nodes[0].x + 40, y: saved.nodes[0].y + 40 });
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(0));
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Redo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(2));
    const current = pane.getBoundingClientRect();
    pane.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: current.left + 100, clientY: current.top + 120, button: 2 }));
    const menu = await within(canvasElement).findByRole("dialog", { name: "Create canvas card", exact: true });
    await userEvent.click(within(menu).getByRole("button", { name: "Add group", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(3));
    expect(within(canvasElement).queryByRole("dialog", { name: "Create canvas card", exact: true })).toBeNull();
  },
};

export const PlainTextPaste: Story = {
  name: "Plain Markdown paste creates a text card",
  parameters: featureParameters("Pasting text on the board creates a text card while editor paste remains untouched; creation can be undone."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Empty.canvas", files: { "Empty.canvas": '{"nodes":[],"edges":[]}' } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const button = await within(canvasElement).findByRole("button", { name: "Paste cards", exact: true });
    button.focus();
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "# Pasted card\nA Markdown paragraph.");
    button.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(1));
    await app.fileEditingSessions.flush("Empty.canvas");
    expect(JSON.parse(await app.vault.read(app.vault.getFileByPath("Empty.canvas")!)).nodes[0]).toMatchObject({ type: "text", text: "# Pasted card\nA Markdown paragraph." });
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Undo", exact: true }));
    await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(0));
  },
};

export const CrossBoardClipboard: Story = {
  name: "Clipboard fallback follows the owning App across boards",
  parameters: featureParameters("When browser clipboard permission is unavailable, copied Canvas cards still paste into another board in the same App without crossing vault ownership."),
  render: () => ({
    Component: ViewingPanelDemo,
    props: { layout: "middle-top-tabs", canvasPath: "Imported.canvas", files: { "Imported.canvas": importedDocument } },
  }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const native = navigator.clipboard;
    const read = native.readText;
    const write = native.writeText;
    native.readText = async () => { throw new DOMException("Clipboard unavailable", "NotAllowedError"); };
    native.writeText = async () => { throw new DOMException("Clipboard unavailable", "NotAllowedError"); };
    try {
      const board = within(canvasElement);
      await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-id="small"] .canvas-node-label')!);
      await userEvent.click(board.getByRole("button", { name: "Copy selection", exact: true }));
      await waitFor(() => expect(board.getByRole("status")).toHaveTextContent("Selection copied within this vault"));
      const next = await app.vault.create("Clipboard destination.canvas", '{"nodes":[],"edges":[]}');
      await app.workspace.activeLeaf!.openFile(next);
      await userEvent.click(await board.findByRole("button", { name: "Paste cards", exact: true }));
      await waitFor(() => expect(canvasElement.querySelectorAll(".svelte-flow__node")).toHaveLength(1));
      await app.fileEditingSessions.flush(next.path);
      expect(JSON.parse(await app.vault.read(next)).nodes[0]).toMatchObject({ type: "text", text: "Imported", width: 80, height: 60 });
    } finally {
      native.readText = read;
      native.writeText = write;
    }
  },
};

const liveEmbedDocument = JSON.stringify({ metadata: { preserve: true }, nodes: [
  { id: "live-text", type: "text", x: 0, y: 0, width: 260, height: 180, text: "Canvas before update" },
  { id: "live-file", type: "file", x: 320, y: 0, width: 260, height: 180, file: "Live note.md" },
], edges: [{ id: "live-edge", fromNode: "live-text", toNode: "live-file" }] });
const liveEmbedFiles = { "Live.canvas": liveEmbedDocument, "Live note.md": "# Live file body\nOriginal file content.", [SAMPLE_READING_NOTE_PATH]: "# Live embed\n![[Live.canvas]]" };

export const LiveCanvasSource: Story = {
  name: "Note embeds update with their canvas and recover invalid sources",
  parameters: featureParameters("A mounted note embed follows source modifications, rejects invalid documents without changing disk, recovers, and opens the original canvas."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", focus: "note", files: liveEmbedFiles } }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const embed = await waitFor(() => { const value = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]"); expect(value).not.toBeNull(); return value!; });
    await waitFor(() => expect(embed).toHaveTextContent("Canvas before update"));
    const file = app.vault.getFileByPath("Live.canvas")!;
    const next = JSON.parse(liveEmbedDocument); next.nodes[0].text = "Canvas after update";
    const raw = JSON.stringify(next);
    await app.vault.modify(file, raw);
    await waitFor(() => expect(embed).toHaveTextContent("Canvas after update"));
    await app.vault.modify(file, "[]");
    await waitFor(() => expect(embed.querySelector("[data-canvas-embed-error]")).not.toBeNull());
    expect(await app.vault.read(file)).toBe("[]");
    await app.vault.modify(file, raw);
    await waitFor(() => expect(embed).toHaveTextContent("Canvas after update"));
    expect(await app.vault.read(file)).toBe(raw);
    expect(within(embed).queryByRole("button", { name: "Toggle Interactivity", exact: true })).toBeNull();
    await userEvent.click(within(embed).getByRole("button", { name: "Open original canvas", exact: true }));
    await waitFor(() => expect(canvasElement.querySelector(".canvas-view-root:not([data-canvas-embed])")).not.toBeNull());
  },
};

export const LiveEmbedFileContent: Story = {
  name: "Note embeds resolve live vault-file content",
  parameters: featureParameters("Read-only Canvas file cards resolve their note body through the owning App and update when that file changes."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", focus: "note", files: liveEmbedFiles } }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const embed = await waitFor(() => { const value = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]"); expect(value).not.toBeNull(); return value!; });
    await waitFor(() => expect(embed).toHaveTextContent("Live file body"));
    await app.vault.modify(app.vault.getFileByPath("Live note.md")!, "# Live file updated\nFresh body.");
    await waitFor(() => expect(embed).toHaveTextContent("Live file updated"));
    expect(await app.vault.read(app.vault.getFileByPath("Live.canvas")!)).toBe(liveEmbedDocument);
  },
};

export const ProvidedEmbedContent: Story = {
  name: "Controlled embed previews override vault content",
  parameters: featureParameters("The public fileContents input keeps its controlled-preview precedence even when an App is supplied for navigation and Markdown rendering."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs" } }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const file = await app.vault.create("Override.md", "# Actual vault body");
    const host = canvasElement.ownerDocument.createElement("div");
    host.style.cssText = "position:absolute;inset:20px;z-index:10;width:600px;height:360px";
    canvasElement.append(host);
    const component = mountComponent(CanvasEmbed, { target: host, props: {
      app, value: { nodes: [{ id: "override", type: "file", file: file.path, x: 0, y: 0, width: 360, height: 240 }] }, fileContents: { [file.path]: "# Injected preview body" },
    } });
    try {
      await waitFor(() => expect(host).toHaveTextContent("Injected preview body"));
      expect(host).not.toHaveTextContent("Actual vault body");
      expect(await app.vault.read(file)).toBe("# Actual vault body");
    } finally { component.destroy(); host.remove(); }
  },
};


export const RecursiveCanvasEmbeds: Story = {
  name: "Nested Canvas previews stop direct and Markdown cycles",
  parameters: featureParameters("The owned source chain spans Markdown and independent component mounts. Repeated references stop with open-original navigation without modifying any source."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", focus: "note", files: {
    [SAMPLE_READING_NOTE_PATH]: "# Recursive previews\n![[Recursive.canvas]]",
    "Recursive.canvas": JSON.stringify({ nodes: [
      { id: "direct", type: "file", file: "Recursive.canvas", x: 0, y: 0, width: 320, height: 240 },
      { id: "indirect", type: "file", file: "Loop.md", x: 360, y: 0, width: 320, height: 240 },
    ], edges: [] }),
    "Loop.md": "# Indirect chain\n![[Recursive.canvas]]",
  } } }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const source = app.vault.getFileByPath("Recursive.canvas")!;
    const before = await app.vault.read(source);
    await waitFor(() => expect(within(canvasElement).getAllByRole("note").filter((element) => element.textContent?.includes("already appears"))).toHaveLength(2));
    expect(canvasElement.querySelectorAll("[data-canvas-embed]")).toHaveLength(1);
    expect(within(canvasElement).getAllByRole("button", { name: "Open original canvas", exact: true })).toHaveLength(3);
    expect(await app.vault.read(source)).toBe(before);
  },
};

export const LiveEmbedGeometry: Story = {
  name: "Live Canvas embeds refit changed source geometry",
  parameters: featureParameters("A live source change outside the previous camera bounds remains visible in the responsive read-only frame."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", focus: "note", files: liveEmbedFiles } }),
  play: async ({ canvasElement }) => {
    const app = await canvasOwner(canvasElement);
    const embed = await waitFor(() => { const value = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]"); expect(value).not.toBeNull(); return value!; });
    await waitFor(() => expect(embed).toHaveTextContent("Canvas before update"));
    const next = JSON.parse(liveEmbedDocument); next.nodes[0].x = 12000;
    await app.vault.modify(app.vault.getFileByPath("Live.canvas")!, JSON.stringify(next));
    await waitFor(() => {
      const card = embed.querySelector<HTMLElement>('[data-id="live-text"]')!.getBoundingClientRect();
      const frame = embed.querySelector<HTMLElement>(".canvas-view-surface")!.getBoundingClientRect();
      expect(card.left).toBeGreaterThanOrEqual(frame.left - 1);
      expect(card.right).toBeLessThanOrEqual(frame.right + 1);
      expect(card.width).toBeGreaterThan(0);
    });
  },
};


export const CanvasCameraStability: Story = {
  name: "Canvas fitting preserves an explicit zoom choice",
  parameters: featureParameters("Once the board is initialized, late startup timers cannot reset the reader's explicit zoom choice."),
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", focus: "note", files: liveEmbedFiles } }),
  play: async ({ canvasElement }) => {
    await canvasOwner(canvasElement);
    const embed = await waitFor(() => { const value = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]"); expect(value).not.toBeNull(); return value!; });
    await waitFor(() => expect(embed).toHaveTextContent("Canvas before update"));
    const viewport = embed.querySelector<HTMLElement>(".svelte-flow__viewport")!;
    const initial = Number(viewport.style.transform.match(/scale\(([^)]+)\)/)?.[1]);
    await userEvent.click(within(embed).getByRole("button", { name: "Zoom Out", exact: true }));
    await waitFor(() => expect(Number(viewport.style.transform.match(/scale\(([^)]+)\)/)?.[1])).toBeCloseTo(initial / 1.2, 6));
    const chosen = viewport.style.transform;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(viewport.style.transform).toBe(chosen);
  },
};
