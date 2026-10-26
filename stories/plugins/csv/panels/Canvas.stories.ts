import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { SAMPLE_CSV_PATH } from "@lapis-notes/csv";
import { WorkspaceShell } from "@lapis-notes/workspace";
import { PANEL_DOCS_PARAMETERS, placementParameters } from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";
import { canvasWorkspaceSource } from "./Canvas.example-sources";
import TablePanelDemo from "./TablePanelDemo.svelte";

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
      description: {
        component:
          "The public workspace shell opens a CSVPlugin file view in canvas mode. File persistence and selection use the same App and CSV grid as the table view.",
      },
      source: { code: canvasWorkspaceSource, language: "tsx", type: "code" },
    },
  },
} satisfies Meta<typeof WorkspaceShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const { visualDelta: _visualDelta, ...canvasParameters } = placementParameters(
  "csv",
  "middle-top-tabs",
  canvasWorkspaceSource,
  "Open Sample.csv as a canvas, edit a cell through the real grid, resize its first column, and verify the saved CSV text.",
);

export const Sheet: Story = {
  name: "Canvas sheet",
  parameters: {
    ...canvasParameters,
    docs: {
      ...canvasParameters.docs,
      source: { code: canvasWorkspaceSource, language: "tsx", type: "code" },
    },
  },
  render: () => ({
    Component: TablePanelDemo,
    props: { layout: "middle-top-tabs", mode: "canvas" },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-status="ready"]'),
        ).not.toBeNull(),
      { timeout: 30_000 },
    );
    const lapisApp = (
      canvasElement.querySelector(
        "[data-testid='panel-demo']",
      ) as HTMLDivElement & {
        __lapisApp?: App;
      }
    ).__lapisApp;
    if (!lapisApp) throw new Error("Missing panel app");
    const sheet = await waitFor(() => {
      const node = canvasElement.querySelector<HTMLElement>(
        "[data-testid='csv-sheet']",
      );
      expect(node).not.toBeNull();
      expect(node?.clientWidth ?? 0).toBeGreaterThan(200);
      return node as HTMLElement;
    });
    expect(canvasElement.querySelector(".csv-data-table")).toBeNull();

    sheet.focus();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    const editor = await waitFor(() => {
      const field = canvasElement.querySelector<HTMLInputElement>(
        "[data-testid='csv-sheet-editor']",
      );
      expect(field).not.toBeNull();
      return field as HTMLInputElement;
    });
    await userEvent.clear(editor);
    await userEvent.type(editor, "Basin mark{Enter}");

    const file = lapisApp.vault.getFileByPath(SAMPLE_CSV_PATH);
    if (!file) throw new Error("Missing Sample.csv");
    await waitFor(async () => {
      expect(await lapisApp.vault.cachedRead(file)).toContain("Basin mark");
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
        140,
      );
    });
  },
};
