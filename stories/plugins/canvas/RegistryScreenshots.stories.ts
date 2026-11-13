import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
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
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed JSON Canvas, and the same file embedded in a note, with Explorer open.",
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

function expectExplorer(canvasElement: HTMLElement): void {
  const left = canvasElement.querySelector<HTMLElement>(
    '[data-workspace-surface="left-sidebar"]',
  );
  const right = canvasElement.querySelector<HTMLElement>(
    '[data-workspace-surface="right-sidebar"]',
  );
  expect(left?.getBoundingClientRect().width ?? 0).toBeGreaterThan(200);
  expect(
    within(left!).getByRole("button", { name: "Sample.canvas", exact: true }),
  ).toBeVisible();
  expect(right?.getBoundingClientRect().width ?? 0).toBeLessThan(2);
}

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The seeded canvas fills the shell beside its Explorer files.",
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
        expectExplorer(canvasElement);
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
        const node = embed?.querySelector<HTMLElement>(".svelte-flow__node");
        expect(embed?.querySelector(".svelte-flow")).not.toBeNull();
        expect(node?.getBoundingClientRect().width ?? 0).toBeGreaterThan(40);
        expectExplorer(canvasElement);
      },
      { timeout: 30_000 },
    );
  },
};
