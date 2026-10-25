import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import {
  PdfViewer,
  SAMPLE_PDF_PATH,
  SAMPLE_READING_NOTE_PATH,
} from "@lapis-notes/pdf";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";
import ViewingPanelDemo from "./ViewingPanelDemo.svelte";

const PLACEMENT_HOST: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "workspace-tabs",
  "stacked-tabs": "workspace-stacked-tabs",
  "left-sidebar": "workspace-sidebar",
  "right-sidebar": "workspace-sidebar",
  "bottom-panel": "workspace-bottom-panel-group",
  "sidebar-group": "workspace-sidebar-group",
};

const PLACEMENT_SURFACE: Record<PanelDemoLayout, string> = {
  "middle-top-tabs": "body",
  "stacked-tabs": "body",
  "left-sidebar": "left-sidebar",
  "right-sidebar": "right-sidebar",
  "bottom-panel": "bottom-panel",
  "sidebar-group": "right-sidebar",
};

const meta = {
  title: "Plugins/PDF/Panels/Viewing",
  component: PdfViewer,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    a11y: {
      context: { exclude: [".cm-gutters", "embedpdf-container"] },
    },
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "A seeded PDF, with a photograph, two columns, and a table, in the shared workspace shell, in every governed panel placement. Middle (Top Tabs) also embeds that PDF in a note.",
      },
    },
  },
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const pdfViewingSource = `<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { PdfViewer } from "@lapis-notes/pdf";

  let { app, file }: { app: App; file: TFile } = $props();
</script>

<PdfViewer {app} {file} />`;

function viewingParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "pdf",
    layout,
    pdfViewingSource,
    description,
  );
  return parameters;
}

function placementStory(layout: PanelDemoLayout, description: string): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: viewingParameters(layout, description),
    render: () => ({
      Component: ViewingPanelDemo,
      props: { layout },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]'),
          ).not.toBeNull(),
        { timeout: 30_000 },
      );
      const canvas = within(canvasElement);
      const lapisApp = (
        canvas.getByTestId("panel-demo") as HTMLDivElement & {
          __lapisApp?: App;
        }
      ).__lapisApp;
      if (!lapisApp) throw new Error("Missing panel app");
      const fileViewer = await waitForPdfPage(canvasElement, "file");
      expect(fileViewer).toBeVisible();
      const host = fileViewer.closest(
        `[data-ui-component="${PLACEMENT_HOST[layout]}"]`,
      );
      expect(host).not.toBeNull();
      expect(fileViewer.closest("[data-workspace-surface]")).toHaveAttribute(
        "data-workspace-surface",
        PLACEMENT_SURFACE[layout],
      );
      expectSidebar(canvasElement, fileViewer, "left", layout === "left-sidebar");
      expectSidebar(
        canvasElement,
        fileViewer,
        "right",
        layout === "right-sidebar" || layout === "sidebar-group",
      );
      const fileLeaves = [...lapisApp.workspace.getLeavesOfType("lapis-pdf")];
      if (layout === "middle-top-tabs") {
        const noteLeaf = markdownLeaf(lapisApp, SAMPLE_READING_NOTE_PATH);
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        const embed = await waitForPdfPage(canvasElement, "embed");
        const caption = embed.closest("figure")?.querySelector("figcaption");
        expect(caption?.textContent).toContain("Sample.pdf");
        const plain = await waitFor(
          () =>
            canvas.getByText(/This seed drives focused Markdown panel stories/),
          { timeout: 15_000 },
        );
        expect(plain.closest("[data-testid='pdf-viewer']")).toBeNull();
        await closePdfLeaves(lapisApp);
        await waitFor(() => {
          expect(
            canvasElement.querySelector("[data-pdf-role='file']"),
          ).toBeNull();
          expect(embed.isConnected).toBe(true);
        });
        await noteLeaf.setViewState({ type: "empty", state: {} });
        await expectPdfRemoved(canvasElement);
        await restorePdfFile(fileLeaves);
        await noteLeaf.setViewState({
          type: "markdown",
          state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
        });
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        expect(await waitForPdfPage(canvasElement, "embed")).toBeVisible();
      } else {
        await closePdfLeaves(lapisApp);
        await expectPdfRemoved(canvasElement);
        await restorePdfFile(fileLeaves);
        const fileLeaf = fileLeaves[0];
        if (!fileLeaf) throw new Error("Missing PDF leaf");
        lapisApp.workspace.setActiveLeaf(fileLeaf, { focus: false });
        expect(await waitForPdfPage(canvasElement, "file")).toBeVisible();
      }
    },
  };
}

function expectSidebar(
  canvasElement: HTMLElement,
  viewer: HTMLElement,
  side: "left" | "right",
  containsViewer: boolean,
) {
  const dock = canvasElement.querySelector(
    `[data-workspace-sidebar-side="${side}"]`,
  );
  expect(Boolean(dock?.contains(viewer))).toBe(containsViewer);
}

async function expectPdfRemoved(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(canvasElement.querySelector("[data-testid='pdf-viewer']")).toBeNull();
    },
    { timeout: 5_000 },
  );
}

async function restorePdfFile(leaves: WorkspaceLeaf[]): Promise<void> {
  for (const leaf of leaves) {
    await leaf.setViewState({
      type: "lapis-pdf",
      state: { file: SAMPLE_PDF_PATH },
    });
  }
}

async function closePdfLeaves(app: App): Promise<void> {
  const leaves = app.workspace.getLeavesOfType("lapis-pdf");
  if (leaves.length === 0) throw new Error("Missing PDF leaf");
  for (const leaf of leaves) {
    await leaf.setViewState({ type: "empty", state: {} });
  }
}

function markdownLeaf(app: App, path: string): WorkspaceLeaf {
  const leaf = app.workspace.getLeavesOfType("markdown").find((candidate) => {
    const view = candidate.view as { file?: { path?: string } };
    return view.file?.path === path;
  });
  if (!leaf) throw new Error(`Missing note leaf for ${path}`);
  return leaf;
}

async function waitForPdfPage(
  canvasElement: HTMLElement,
  role: "file" | "embed",
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const viewer = canvasElement.querySelector<HTMLElement>(
        `[data-testid="pdf-viewer"][data-pdf-role="${role}"]`,
      );
      expect(viewer).not.toBeNull();
      expect(viewer?.dataset.pdfError ?? "").toBe("");
      expect(renderedPage(viewer!)).not.toBeNull();
      return viewer!;
    },
    { timeout: 30_000 },
  );
}

function renderedPage(root: ParentNode): Element | null {
  const queue: ParentNode[] = [root];
  const seen = new Set<ParentNode>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    for (const child of childrenOf(current)) {
      if (isRenderedPage(child)) return child;
      if (child.shadowRoot) queue.push(child.shadowRoot);
      if (child instanceof HTMLIFrameElement && child.contentDocument) {
        queue.push(child.contentDocument);
      }
      queue.push(child);
    }
  }
  return null;
}

function childrenOf(current: ParentNode): Element[] {
  if (current instanceof Document) return Array.from(current.body?.children ?? []);
  return Array.from(current.children);
}

function isRenderedPage(element: Element): boolean {
  const pageImage =
    element.tagName === "IMG" &&
    (element.getAttribute("src") ?? "").startsWith("blob:");
  return (
    element.tagName === "CANVAS" ||
    pageImage ||
    element.hasAttribute("data-page-index")
  );
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "The sample PDF in the middle pane, with the same viewer embedded in a note.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "The sample PDF in stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "The sample PDF in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "The sample PDF in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "The sample PDF in the bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "The sample PDF inside a grouped right-sidebar item.",
);
