import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import {
  CsvTable,
  SAMPLE_CSV_PATH,
  SAMPLE_READING_NOTE_PATH,
} from "@lapis-notes/csv";
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

const QUOTED_NOTE = "Weed across the culvert, stick in the mouth";

const meta = {
  title: "Plugins/CSV/Panels/Table",
  component: CsvTable,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "A seeded CSV, with a quoted comma in one cell, in the shared workspace shell, in every governed panel placement. Middle (Top Tabs) also embeds that CSV in a note.",
      },
    },
  },
} satisfies Meta<typeof CsvTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const csvTableSource = `<script lang="ts">
  import type { App, TFile } from "@lapis-notes/api";
  import { CsvTable } from "@lapis-notes/csv";

  let { app, file }: { app: App; file: TFile } = $props();
</script>

<CsvTable {app} {file} />`;

function tableParameters(layout: PanelDemoLayout, description: string) {
  const { visualDelta: _visualDelta, ...parameters } = placementParameters(
    "csv",
    layout,
    csvTableSource,
    description,
  );
  return parameters;
}

function placementStory(layout: PanelDemoLayout, description: string): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: tableParameters(layout, description),
    render: () => ({
      Component: TablePanelDemo,
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
      const fileTable = await waitForTable(canvasElement, "file");
      expect(fileTable).toBeVisible();
      expectQuotedCell(fileTable);
      const host = fileTable.closest(
        `[data-ui-component="${PLACEMENT_HOST[layout]}"]`,
      );
      expect(host).not.toBeNull();
      expect(fileTable.closest("[data-workspace-surface]")).toHaveAttribute(
        "data-workspace-surface",
        PLACEMENT_SURFACE[layout],
      );
      expectSidebar(canvasElement, fileTable, "left", layout === "left-sidebar");
      expectSidebar(
        canvasElement,
        fileTable,
        "right",
        layout === "right-sidebar" || layout === "sidebar-group",
      );
      const fileLeaves = [...lapisApp.workspace.getLeavesOfType("lapis-csv")];
      if (layout === "middle-top-tabs") {
        const noteLeaf = markdownLeaf(lapisApp, SAMPLE_READING_NOTE_PATH);
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        const embed = await waitForTable(canvasElement, "embed");
        expectQuotedCell(embed);
        const caption = embed.closest("figure")?.querySelector("figcaption");
        expect(caption?.textContent).toContain("Sample.csv");
        const plain = await waitFor(
          () =>
            canvas.getByText(/This seed drives focused Markdown panel stories/),
          { timeout: 15_000 },
        );
        expect(plain.closest("[data-testid='csv-table']")).toBeNull();
        await closeCsvLeaves(lapisApp);
        await waitFor(() => {
          expect(
            canvasElement.querySelector("[data-csv-role='file']"),
          ).toBeNull();
          expect(embed.isConnected).toBe(true);
        });
        await noteLeaf.setViewState({ type: "empty", state: {} });
        await expectTableRemoved(canvasElement);
        await restoreCsvFile(fileLeaves);
        await noteLeaf.setViewState({
          type: "markdown",
          state: { file: SAMPLE_READING_NOTE_PATH, mode: "preview" },
        });
        lapisApp.workspace.setActiveLeaf(noteLeaf, { focus: false });
        expectQuotedCell(await waitForTable(canvasElement, "embed"));
      } else {
        await closeCsvLeaves(lapisApp);
        await expectTableRemoved(canvasElement);
        await restoreCsvFile(fileLeaves);
        const fileLeaf = fileLeaves[0];
        if (!fileLeaf) throw new Error("Missing CSV leaf");
        lapisApp.workspace.setActiveLeaf(fileLeaf, { focus: false });
        expectQuotedCell(await waitForTable(canvasElement, "file"));
      }
    },
  };
}

function expectQuotedCell(table: HTMLElement) {
  const cell = within(table).getByRole("cell", { name: QUOTED_NOTE });
  expect(cell.textContent).toBe(QUOTED_NOTE);
  const grid = table.querySelector("table.csv-data-table");
  const totalRows = Number(grid?.getAttribute("data-csv-row-count"));
  const renderedRows = Number(grid?.getAttribute("data-csv-rendered-rows"));
  expect(totalRows).toBeGreaterThan(1000);
  expect(renderedRows).toBeGreaterThan(0);
  expect(renderedRows).toBeLessThan(totalRows);
  expect(within(table).getByRole("columnheader", { name: "#" })).toBeVisible();
  expect(within(table).getByRole("columnheader", { name: /staff/ })).toBeVisible();
  expect(within(table).getByRole("columnheader", { name: /note/ })).toBeVisible();
  expect(
    within(table).getAllByRole("button", { name: "Column actions" }).length,
  ).toBeGreaterThan(0);
  expectStickyHeader(table);
}

function expectStickyHeader(table: HTMLElement) {
  const viewport = table.querySelector<HTMLElement>(
    '[data-slot="scroll-area-viewport"]',
  );
  const header = within(table).getByRole("columnheader", { name: /staff/ });
  expect(viewport).not.toBeNull();
  const before = header.getBoundingClientRect().top;
  viewport!.scrollTop = 400;
  expect(viewport!.scrollTop).toBeGreaterThan(0);
  expect(Math.abs(header.getBoundingClientRect().top - before)).toBeLessThan(2);
  viewport!.scrollTop = 0;
}

function expectSidebar(
  canvasElement: HTMLElement,
  table: HTMLElement,
  side: "left" | "right",
  containsTable: boolean,
) {
  const dock = canvasElement.querySelector(
    `[data-workspace-sidebar-side="${side}"]`,
  );
  expect(Boolean(dock?.contains(table))).toBe(containsTable);
}

async function expectTableRemoved(canvasElement: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(canvasElement.querySelector("[data-testid='csv-table']")).toBeNull();
    },
    { timeout: 5_000 },
  );
}

async function restoreCsvFile(leaves: WorkspaceLeaf[]): Promise<void> {
  for (const leaf of leaves) {
    await leaf.setViewState({
      type: "lapis-csv",
      state: { file: SAMPLE_CSV_PATH },
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

function markdownLeaf(app: App, path: string): WorkspaceLeaf {
  const leaf = app.workspace.getLeavesOfType("markdown").find((candidate) => {
    const view = candidate.view as { file?: { path?: string } };
    return view.file?.path === path;
  });
  if (!leaf) throw new Error(`Missing note leaf for ${path}`);
  return leaf;
}

async function waitForTable(
  canvasElement: HTMLElement,
  role: "file" | "embed",
): Promise<HTMLElement> {
  return waitFor(
    () => {
      const table = canvasElement.querySelector<HTMLElement>(
        `[data-testid="csv-table"][data-csv-role="${role}"]`,
      );
      expect(table).not.toBeNull();
      expect(table?.querySelector("[data-csv-error]")).toBeNull();
      expect(within(table!).getByRole("cell", { name: QUOTED_NOTE })).toBeVisible();
      return table!;
    },
    { timeout: 30_000 },
  );
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  "Open the seeded CSV in the middle pane, and embed that same file in a note beside an ordinary Markdown preview.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  "Open the seeded CSV in stacked tabs.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  "Open the seeded CSV in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  "Open the seeded CSV in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  "Open the seeded CSV in the bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  "Open the seeded CSV in a sidebar group.",
);
