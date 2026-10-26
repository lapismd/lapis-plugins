import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { canvasWorkspaceSource } from "./Canvas.example-sources";
import { SAMPLE_CSV_PATH, SAMPLE_READING_NOTE_PATH } from "@lapis-notes/csv";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";
import TablePanelDemo from "./TablePanelDemo.svelte";

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
  title: "Plugins/CSV/Panels/Canvas",
  component: WorkspaceShell,
  args: { app: undefined as unknown as App },
  argTypes: { app: { control: false } },
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      source: {
        code: canvasWorkspaceSource("middle-top-tabs"),
        language: "tsx",
        type: "code",
      },
      description: {
        component:
          "A seeded CSV canvas in the shared workspace shell, in every governed panel placement. Middle (Top Tabs) also embeds that canvas in a note.",
      },
    },
  },
} satisfies Meta<typeof WorkspaceShell>;

export default meta;
type Story = StoryObj<typeof meta>;

function canvasParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "csv",
    layout,
    canvasWorkspaceSource(layout),
    description
  );
  return parameters;
}

function placementStory(layout: PanelDemoLayout, description: string): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: canvasParameters(layout, description),
    render: () => ({
      Component: TablePanelDemo,
      props: { layout, mode: "canvas" },
    }),
    play: async ({ canvasElement }) => {
      await waitFor(
        () =>
          expect(
            canvasElement.querySelector('[data-status="ready"]')
          ).not.toBeNull(),
        { timeout: 30_000 }
      );
      const lapisApp = (
        canvasElement.querySelector(
          "[data-testid='panel-demo']"
        ) as HTMLDivElement & {
          __lapisApp?: App;
        }
      ).__lapisApp;
      if (!lapisApp) throw new Error("Missing panel app");
      const fileLeaves = [...lapisApp.workspace.getLeavesOfType("lapis-csv")];
      if (layout === "middle-top-tabs") {
        lapisApp.workspace.setActiveLeaf(csvCanvasLeaf(lapisApp), {
          focus: false,
        });
      }
      const sheet = await waitForSheet(canvasElement, "file");
      expect(canvasElement.querySelector(".csv-data-table")).toBeNull();
      const host = sheet.closest(
        `[data-ui-component="${PLACEMENT_HOST[layout]}"]`
      );
      expect(host).not.toBeNull();
      expect(sheet.closest("[data-workspace-surface]")).toHaveAttribute(
        "data-workspace-surface",
        PLACEMENT_SURFACE[layout]
      );
      expectSidebar(canvasElement, sheet, "left", layout === "left-sidebar");
      expectSidebar(
        canvasElement,
        sheet,
        "right",
        layout === "right-sidebar" || layout === "sidebar-group"
      );
      if (layout === "middle-top-tabs") {
        await editAndResize(canvasElement, lapisApp, sheet);
        const noteLeaf = markdownLeaf(lapisApp, SAMPLE_READING_NOTE_PATH);
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        const embed = await waitForSheet(canvasElement, "embed");
        const caption = embed.closest("figure")?.querySelector("figcaption");
        expect(caption?.textContent).toContain("Sample.csv");
        const plain = await waitFor(
          () =>
            within(canvasElement).getByText(
              /This seed drives focused Markdown panel stories/
            ),
          { timeout: 15_000 }
        );
        expect(plain.closest("[data-testid='csv-canvas']")).toBeNull();
        await closeCsvLeaves(lapisApp);
        await waitFor(() => {
          expect(
            canvasElement.querySelector("[data-csv-role='file']")
          ).toBeNull();
          expect(embed.isConnected).toBe(true);
        });
        await noteLeaf.setViewState({ type: "empty", state: {} });
        await expectSheetRemoved(canvasElement);
        await restoreCsvFile(fileLeaves);
        await noteLeaf.setViewState({
          type: "markdown",
          state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
        });
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        await waitForSheet(canvasElement, "embed");
      } else {
        await closeCsvLeaves(lapisApp);
        await expectSheetRemoved(canvasElement);
        await restoreCsvFile(fileLeaves);
        const fileLeaf = fileLeaves[0];
        if (!fileLeaf) throw new Error("Missing CSV leaf");
        lapisApp.workspace.setActiveLeaf(fileLeaf, { focus: false });
        await waitForSheet(canvasElement, "file");
      }
    },
  };
}

async function editAndResize(
  canvasElement: HTMLElement,
  app: App,
  sheet: HTMLElement
) {
  const file = app.vault.getFileByPath(SAMPLE_CSV_PATH);
  if (!file) throw new Error("Missing Sample.csv");
  const original = await app.vault.cachedRead(file);
  sheet.focus();
  await userEvent.keyboard("{ArrowDown}{Enter}");
  const editor = await waitFor(() => {
    const field = canvasElement.querySelector<HTMLInputElement>(
      "[data-testid='csv-sheet-editor']"
    );
    expect(field).not.toBeNull();
    return field as HTMLInputElement;
  });
  await userEvent.clear(editor);
  await userEvent.type(editor, "Basin mark{Enter}");
  await waitFor(async () => {
    expect(await app.vault.cachedRead(file)).toContain("Basin mark");
  });
  const boundary = sheet.getBoundingClientRect();
  const pointerY = boundary.top + 10;
  const pointerX = boundary.left + 48 + 120;
  await userEvent.pointer({
    target: sheet,
    coords: { clientX: pointerX, clientY: pointerY },
    keys: "[MouseLeft>]",
  });
  await userEvent.pointer({
    target: sheet,
    coords: { clientX: pointerX + 64, clientY: pointerY },
  });
  await userEvent.pointer({ keys: "[/MouseLeft]" });
  await waitFor(() => {
    expect(Number(sheet.getAttribute("data-column-width-0"))).toBeGreaterThan(
      140
    );
  });
  await app.vault.modify(file, original);
}

function expectSidebar(
  canvasElement: HTMLElement,
  sheet: HTMLElement,
  side: "left" | "right",
  containsSheet: boolean
) {
  const dock = canvasElement.querySelector(
    `[data-workspace-sidebar-side="${side}"]`
  );
  expect(Boolean(dock?.contains(sheet))).toBe(containsSheet);
}

async function expectSheetRemoved(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(
        canvasElement.querySelector("[data-testid='csv-canvas']")
      ).toBeNull();
    },
    { timeout: 5_000 }
  );
}

async function restoreCsvFile(leaves: WorkspaceLeaf[]): Promise<void> {
  for (const leaf of leaves) {
    await leaf.setViewState({
      type: "lapis-csv",
      state: { file: SAMPLE_CSV_PATH, mode: "canvas" },
    });
  }
}

async function closeCsvLeaves(app: App): Promise<void> {
  const leaves = app.workspace.getLeavesOfType("lapis-csv");
  if (leaves.length === 0) throw new Error("Missing CSV leaf");
  for (const leaf of leaves) {
    await leaf.setViewState({ type: "empty", state: {} });
  }
}

function csvCanvasLeaf(app: App): WorkspaceLeaf {
  const leaf = app.workspace.getLeavesOfType("lapis-csv").find((candidate) => {
    const view = candidate.view as { mode?: () => string };
    return view.mode?.() === "canvas";
  });
  if (!leaf) throw new Error("Missing CSV canvas leaf");
  return leaf;
}

function markdownLeaf(app: App, path: string): WorkspaceLeaf {
  const leaf = app.workspace.getLeavesOfType("markdown").find((candidate) => {
    const view = candidate.view as { file?: { path?: string } };
    return view.file?.path === path;
  });
  if (!leaf) throw new Error(`Missing note leaf for ${path}`);
  return leaf;
}

async function waitForSheet(
  canvasElement: HTMLElement,
  role: "file" | "embed"
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const frame = canvasElement.querySelector<HTMLElement>(
        `[data-testid="csv-canvas"][data-csv-role="${role}"]`
      );
      const sheet = frame?.querySelector<HTMLElement>(
        "[data-testid='csv-sheet']"
      );
      expect(frame).not.toBeNull();
      expect(frame?.querySelector("[data-csv-error]")).toBeNull();
      expect(sheet).not.toBeNull();
      expect(sheet?.clientWidth ?? 0).toBeGreaterThan(120);
      expect(frame?.querySelector("canvas")?.clientHeight ?? 0).toBeGreaterThan(
        80
      );
      return sheet!;
    },
    { timeout: 30_000 }
  );
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "Open the seeded CSV canvas in the middle pane, edit a cell, and embed that same sheet in a note."
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "Open the seeded CSV canvas in stacked tabs."
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "Open the seeded CSV canvas in the left sidebar."
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "Open the seeded CSV canvas in the right sidebar."
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "Open the seeded CSV canvas in the bottom panel."
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "Open the seeded CSV canvas in a sidebar group."
);
