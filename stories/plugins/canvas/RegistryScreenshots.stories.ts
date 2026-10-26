import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryPanelApp } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import RegistryDemo from "./RegistryDemo.svelte";

const registrySource = pluginWorkspaceSource(
  "@lapis-notes/canvas",
  "CanvasPlugin",
);

const meta = {
  title: "Plugins/Canvas/Registry Screenshots",
  component: RegistryDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      context: {
        exclude: [".canvas-node-label", ".canvas-node-shell"],
      },
    },
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed JSON Canvas, and the same file embedded in a note. Both sidebars stay closed.",
      },
    },
  },
} satisfies Meta<typeof RegistryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function shellRender(document: "file" | "embedded"): Story["render"] {
  return (() => ({
    Component: RegistryDemo,
    props: { document },
  })) as Story["render"];
}

function expectClosedSidebars(canvasElement: HTMLElement): void {
  for (const side of ["left-sidebar", "right-sidebar"]) {
    const surface = canvasElement.querySelector<HTMLElement>(
      `[data-workspace-surface="${side}"]`,
    );
    expect(surface?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
  }
}

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The seeded canvas fills the shell with both sidebars closed.",
  ),
  render: shellRender("file"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(
      () => {
        const status =
          canvasElement.querySelector("[data-testid='panel-demo-status']")
            ?.textContent ?? "";
        const view = canvasElement.querySelector<HTMLElement>(
          ".canvas-view-root:not([data-canvas-embed])",
        );
        expect(view, status).not.toBeNull();
        expect(view?.querySelector(".svelte-flow"), status).not.toBeNull();
        expectClosedSidebars(canvasElement);
      },
      { timeout: 20_000 },
    );
  },
};

export const Embedded: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A reading note keeps the same canvas inside a Markdown embed.",
  ),
  render: shellRender("embedded"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(
      () => {
        const embed = canvasElement.querySelector("[data-canvas-embed]");
        expect(embed?.querySelector(".svelte-flow")).not.toBeNull();
        expectClosedSidebars(canvasElement);
      },
      { timeout: 30_000 },
    );
  },
};
