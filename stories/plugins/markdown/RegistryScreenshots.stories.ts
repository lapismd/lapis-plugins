import type { Meta, StoryObj } from "@storybook/svelte-vite";
import {
  BacklinksViewType,
  FilePropertiesViewType,
} from "@lapis-notes/markdown";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import PanelDemo from "../_shared/panels/PanelDemo.svelte";
import {
  openRegistryFile,
  registryPanelApp,
  waitForRegistrySurface,
} from "../_shared/registry/registry-story-helpers";

const meta = {
  title: "Plugins/Markdown/Registry Screenshots",
  component: PanelDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: WORKSPACE_SHELL_DOCS_PARAMETERS,
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function editorStory(
  mode: "live-preview" | "source" | "preview",
  kind: "explorer" | "outline" | "file-properties",
  layout: "left-sidebar" | "right-sidebar",
  sidebarSelector?: string
): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: { kind, layout, diagnostics: "none" },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await openRegistryFile(canvasElement, "Notes/Welcome.md", { mode });
      await waitForRegistrySurface(
        canvasElement,
        mode === "preview"
          ? '[data-ui-component="markdown-mira-preview"]'
          : ".markdown-view__editor"
      );
      if (sidebarSelector) {
        await waitForRegistrySurface(canvasElement, sidebarSelector);
      }
    },
  };
}

function sidebarStory(kind: "outline" | "backlinks", selector: string): Story {
  return {
    render: (() => ({
      Component: PanelDemo,
      props: { kind, layout: "right-sidebar", diagnostics: "none" },
    })) as Story["render"],
    play: async ({ canvasElement }) => {
      await registryPanelApp(canvasElement);
      await waitForRegistrySurface(canvasElement, selector);
    },
  };
}

export const LivePreview = editorStory(
  "live-preview",
  "outline",
  "right-sidebar",
  '[data-testid="outline-panel"]'
);
export const Source = editorStory(
  "source",
  "file-properties",
  "right-sidebar",
  '[data-testid="file-properties-panel"]'
);
export const Reading = editorStory("preview", "explorer", "left-sidebar");
export const BacklinksSidebar = sidebarStory(
  "backlinks",
  '[data-testid="backlinks-panel"]'
);

export const Overview: Story = {
  render: (() => ({
    Component: PanelDemo,
    props: {
      kind: "file-properties",
      layout: "right-sidebar",
      diagnostics: "none",
    },
  })) as Story["render"],
  play: async ({ canvasElement }) => {
    const { app } = await openRegistryFile(canvasElement, "Notes/Welcome.md", {
      mode: "live-preview",
    });
    const backlinks = app.workspace.ensureSideLeaf(BacklinksViewType, "left");
    await backlinks.setViewState({ type: BacklinksViewType });
    await app.workspace.revealLeaf(backlinks);
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="backlinks-panel"]'
    );
    await waitForRegistrySurface(
      canvasElement,
      '[data-testid="file-properties-panel"]'
    );
    await waitForRegistrySurface(canvasElement, ".markdown-view__editor");
    if (app.workspace.getLeavesOfType(FilePropertiesViewType).length !== 1) {
      throw new Error("Markdown Overview requires one File Properties panel");
    }
  },
};
