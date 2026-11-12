import type { App } from "@lapis-notes/api";
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
} from "@lapis-notes/canvas";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const meta = {
  title: "Plugins/Canvas/Features",
  component: CanvasEmbed,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      context: {
        exclude: [".canvas-node-label", ".canvas-node-shell"],
      },
    },
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
    expect(root.querySelector("button")).toHaveTextContent("Open link");
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
