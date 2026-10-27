import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
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
  props: { canvasPath?: string; focus?: "canvas" | "note" },
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
