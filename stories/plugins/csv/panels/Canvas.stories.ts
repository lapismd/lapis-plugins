import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { SAMPLE_CSV_PATH } from "@lapis-notes/csv";
import TablePanelDemo from "./TablePanelDemo.svelte";

const meta = {
  title: "Plugins/CSV/Panels/Canvas",
  component: TablePanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TablePanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sheet: Story = {
  name: "Canvas sheet",
  render: () => ({
    Component: TablePanelDemo,
    props: { layout: "middle-top-tabs", mode: "canvas" },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(canvasElement.querySelector('[data-status="ready"]')).not.toBeNull(),
      { timeout: 30_000 },
    );
    const lapisApp = (
      canvasElement.querySelector("[data-testid='panel-demo']") as HTMLDivElement & {
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
