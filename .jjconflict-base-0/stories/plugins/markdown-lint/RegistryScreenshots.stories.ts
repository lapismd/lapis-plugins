import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import { showRegistryProblems } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/markdown-lint",
  "MarkdownLintPlugin"
);

const meta = {
  title: "Plugins/Markdown Lint/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "App-backed Markdown lint diagnostics shown in the editor and Problems surface.",
      },
    },
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditorDiagnosticsWithProblems: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "Markdown lint diagnostics are highlighted in the editor and collected in Problems."
  ),
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "explorer",
      layout: "left-sidebar",
      hideSidebars: true,
      diagnostics: "markdownlint",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    await showRegistryProblems(
      canvasElement,
      "Notes/Editorial review.md",
      "markdownlint"
    );
  },
};

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The focused editor overview shows the Markdown lint Problems workflow."
  ),
  render: EditorDiagnosticsWithProblems.render,
  play: EditorDiagnosticsWithProblems.play,
};
