import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import {
  DocxViewer,
  SAMPLE_DOCX_PATH,
  SAMPLE_READING_NOTE_PATH,
} from "@lapis-notes/docx";
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
  title: "Plugins/DOCX/Panels/Viewing",
  component: DocxViewer,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "A seeded Word document in the shared workspace shell, in every governed panel placement. Middle (Top Tabs) also embeds that document in a note.",
      },
    },
  },
} satisfies Meta<typeof DocxViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const docxViewingSource = `<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { DocxViewer } from "@lapis-notes/docx";

  let { app, file }: { app: App; file: TFile } = $props();
</script>

<DocxViewer {app} {file} />`;

function viewingParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "bookmarks",
    layout,
    docxViewingSource,
    description,
  );
  return {
    ...parameters,
    a11y: {
      context: {
        exclude: [
          "[data-testid='docx-viewer']",
          "input[type='color']",
          "input[type='range'][title='Zoom']",
        ],
      },
    },
  };
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
      const fileViewer = await waitForDocxPage(canvasElement, "file");
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
      const fileLeaves = [...lapisApp.workspace.getLeavesOfType("lapis-docx")];
      if (layout === "middle-top-tabs") {
        const noteLeaf = markdownLeaf(lapisApp, SAMPLE_READING_NOTE_PATH);
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        const embed = await waitForDocxPage(canvasElement, "embed");
        const caption = embed.closest("figure")?.querySelector("figcaption");
        expect(caption?.textContent).toContain("Sample.docx");
        const plain = await waitFor(
          () =>
            canvas.getByText(/This seed drives focused Markdown panel stories/),
          { timeout: 15_000 },
        );
        expect(plain.closest("[data-testid='docx-viewer']")).toBeNull();
        await closeDocxLeaves(lapisApp);
        await waitFor(() => {
          expect(
            canvasElement.querySelector("[data-docx-role='file']"),
          ).toBeNull();
          expect(embed.isConnected).toBe(true);
        });
        await noteLeaf.setViewState({ type: "empty", state: {} });
        await expectDocxRemoved(canvasElement);
        await restoreDocxFile(fileLeaves);
        await noteLeaf.setViewState({
          type: "markdown",
          state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
        });
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        expect(await waitForDocxPage(canvasElement, "embed")).toBeVisible();
      } else {
        await closeDocxLeaves(lapisApp);
        await expectDocxRemoved(canvasElement);
        await restoreDocxFile(fileLeaves);
        const fileLeaf = fileLeaves[0];
        if (!fileLeaf) throw new Error("Missing DOCX leaf");
        lapisApp.workspace.setActiveLeaf(fileLeaf, { focus: false });
        expect(await waitForDocxPage(canvasElement, "file")).toBeVisible();
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

async function expectDocxRemoved(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(canvasElement.querySelector("[data-testid='docx-viewer']")).toBeNull();
    },
    { timeout: 5_000 },
  );
}

async function restoreDocxFile(leaves: WorkspaceLeaf[]): Promise<void> {
  for (const leaf of leaves) {
    await leaf.setViewState({
      type: "lapis-docx",
      state: { file: SAMPLE_DOCX_PATH },
    });
  }
}

async function closeDocxLeaves(app: App): Promise<void> {
  const leaves = app.workspace.getLeavesOfType("lapis-docx");
  if (leaves.length === 0) throw new Error("Missing DOCX leaf");
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

async function waitForDocxPage(
  canvasElement: HTMLElement,
  role: "file" | "embed",
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const viewer = canvasElement.querySelector<HTMLElement>(
        `[data-testid="docx-viewer"][data-docx-role="${role}"]`,
      );
      expect(viewer).not.toBeNull();
      expect(viewer?.dataset.docxError ?? "").toBe("");
      expect(viewer?.querySelector("canvas")).not.toBeNull();
      const editorStatus = viewer?.querySelector<HTMLElement>(".cw-statusbar");
      const workspaceStatus = canvasElement.querySelector<HTMLElement>(
        "[data-workspace-status-bar], .ui-workspace-status-bar",
      );
      expect(editorStatus).not.toBeNull();
      expect(workspaceStatus).not.toBeNull();
      expect(getComputedStyle(editorStatus!).backgroundColor).toBe(
        getComputedStyle(workspaceStatus!).backgroundColor,
      );
      return viewer!;
    },
    { timeout: 45_000 },
  );
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "The sample Word document in the middle pane, with the same viewer embedded in a note.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "The sample Word document in stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "The sample Word document in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "The sample Word document in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "The sample Word document in the bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "The sample Word document inside a grouped right-sidebar item.",
);
