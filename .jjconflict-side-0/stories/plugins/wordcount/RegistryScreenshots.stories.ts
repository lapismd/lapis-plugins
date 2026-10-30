import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { openRegistryFile } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/wordcount",
  "WordCountPlugin"
);

const meta = {
  title: "Plugins/Word Count/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed Markdown editor with live word and character counts in the status bar.",
      },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorWithFocusedStatusBar: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "The focused editor updates word and character totals for the active note."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "explorer",
      layout: "left-sidebar",
      hideSidebars: true,
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await openRegistryFile(canvasElement, "Notes/Word count draft.md", {
      mode: "live-preview",
    });
    await waitFor(
      () => {
        const item = canvasElement.querySelector<HTMLElement>(
          '[data-status-bar-item-id="wordcount:status"]'
        );
        expect(item).not.toBeNull();
        expect(item).toHaveTextContent(/words/);
        expect(item).toHaveTextContent(/characters/);
        const leftSidebar = canvasElement.querySelector<HTMLElement>(
          '[data-workspace-surface="left-sidebar"]'
        );
        const rightSidebar = canvasElement.querySelector<HTMLElement>(
          '[data-workspace-surface="right-sidebar"]'
        );
        expect(leftSidebar?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
        expect(rightSidebar?.getBoundingClientRect().width ?? 0).toBeLessThan(
          2
        );
      },
      { timeout: 12_000 }
    );
  },
};

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The Word Count overview focuses the editor and its status-bar totals."
  ),
  render: EditorWithFocusedStatusBar.render,
  play: EditorWithFocusedStatusBar.play,
};
