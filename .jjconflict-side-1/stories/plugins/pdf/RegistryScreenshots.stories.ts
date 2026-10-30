import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryPanelApp } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import RegistryDemo from "./RegistryDemo.svelte";

const registrySource = pluginWorkspaceSource("@lapis-notes/pdf", "PDFPlugin");

const meta = {
  title: "Plugins/PDF/Registry Screenshots",
  component: RegistryDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      context: { exclude: [".cm-gutters", "embedpdf-container"] },
    },
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed PDF, and the same file embedded in a note. Both sidebars stay closed.",
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

function renderedPage(root: ParentNode): Element | null {
  const nodes: ParentNode[] = [root];
  while (nodes.length > 0) {
    const current = nodes.shift();
    if (!current) continue;
    if (current instanceof Element) {
      const pageImage =
        current.tagName === "IMG" &&
        (current.getAttribute("src") ?? "").startsWith("blob:");
      if (
        current.tagName === "CANVAS" ||
        pageImage ||
        current.hasAttribute("data-page-index")
      ) {
        return current;
      }
      if (current.shadowRoot) nodes.push(current.shadowRoot);
    }
    for (const child of current.children ?? []) nodes.push(child);
    if (current instanceof HTMLIFrameElement && current.contentDocument) {
      nodes.push(current.contentDocument);
    }
  }
  return null;
}

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The seeded PDF fills the shell with both sidebars closed.",
  ),
  render: shellRender("file"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(
      () => {
        const viewer = canvasElement.querySelector<HTMLElement>(
          '[data-testid="pdf-viewer"][data-pdf-role="file"]',
        );
        expect(viewer?.dataset.pdfReady).toBe("true");
        expect(renderedPage(viewer!)).not.toBeNull();
        expectClosedSidebars(canvasElement);
      },
      { timeout: 30_000 },
    );
  },
};

export const Embedded: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A harbor note keeps the same PDF inside a Markdown embed.",
  ),
  render: shellRender("embedded"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(
      () => {
        const viewer = canvasElement.querySelector<HTMLElement>(
          '[data-testid="pdf-viewer"][data-pdf-role="embed"]',
        );
        expect(viewer?.dataset.pdfReady).toBe("true");
        expect(renderedPage(viewer!)).not.toBeNull();
        expect(
          viewer?.closest(".mira-embed")?.querySelector("figcaption")
            ?.textContent,
        ).toContain("Sample.pdf");
        expectClosedSidebars(canvasElement);
      },
      { timeout: 30_000 },
    );
  },
};
