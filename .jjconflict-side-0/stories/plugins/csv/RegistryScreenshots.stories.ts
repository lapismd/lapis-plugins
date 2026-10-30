import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_PARAMETERS } from "../../workspace/docs-parameters";
import { registryPanelApp } from "../_shared/registry/registry-story-helpers";
import {
  pluginWorkspaceSource,
  registryStoryParameters,
} from "../_shared/registry/registry-docs";
import RegistryDemo from "./RegistryDemo.svelte";

const registrySource = pluginWorkspaceSource("@lapis-notes/csv", "CSVPlugin");
const QUOTED_NOTE = "Weed across the culvert, stick in the mouth";

const meta = {
  title: "Plugins/CSV/Registry Screenshots",
  component: RegistryDemo,
  tags: ["registry-media", "visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...WORKSPACE_SHELL_DOCS_PARAMETERS,
      description: {
        component:
          "An app-backed CSV table, its canvas sheet, coloured source, find, and the table and canvas embedded in a note. Both sidebars stay closed.",
      },
    },
  },
} satisfies Meta<typeof RegistryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function shellRender(
  document: "table" | "source" | "embedded" | "canvas" | "embedded-canvas",
): Story["render"] {
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

function expectActionsInView(table: HTMLElement): void {
  const actions = table.querySelector("td.csv-data-table__cell--actions");
  const viewport = table.querySelector("[data-slot='scroll-area-viewport']");
  if (!(actions instanceof HTMLElement) || !(viewport instanceof HTMLElement)) {
    throw new Error("Missing CSV row actions");
  }
  const cellBox = actions.getBoundingClientRect();
  const viewBox = viewport.getBoundingClientRect();
  expect(cellBox.width).toBeGreaterThan(0);
  expect(cellBox.left).toBeGreaterThanOrEqual(viewBox.left - 1);
  expect(cellBox.right).toBeLessThanOrEqual(viewBox.right + 1);
}

async function expectRowActionsOnHover(table: HTMLElement): Promise<void> {
  const button = table.querySelector<HTMLElement>(
    "tr.csv-data-table__row .csv-data-table__row-actions",
  );
  const row = button?.closest("tr");
  const viewport = table.querySelector("[data-slot='scroll-area-viewport']");
  if (!button || !row || !(viewport instanceof HTMLElement)) {
    throw new Error("Missing CSV row actions");
  }
  await userEvent.hover(button);
  expect(row.getAttribute("data-csv-hover")).toBe("true");
  await waitFor(() => {
    expect(Number(getComputedStyle(button).opacity)).toBeGreaterThan(0.9);
  });
  const buttonBox = button.getBoundingClientRect();
  const viewBox = viewport.getBoundingClientRect();
  expect(buttonBox.right).toBeLessThanOrEqual(viewBox.right + 1);
}

export const Overview: Story = {
  name: "Overview",
  parameters: registryStoryParameters(
    registrySource,
    "The seeded table fills the shell with both sidebars closed.",
  ),
  render: shellRender("table"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    const table = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>(
        '[data-testid="csv-table"][data-csv-role="file"]',
      );
      expect(found?.checkVisibility()).toBe(true);
      expect(canvas.getByRole("cell", { name: QUOTED_NOTE })).toBeVisible();
      expect(canvas.getByRole("columnheader", { name: /staff/ })).toBeVisible();
      expect(canvas.getByTestId("csv-status-bar").textContent).toContain(
        "2,501 rows",
      );
      expectActionsInView(found!);
      expectClosedSidebars(canvasElement);
      return found!;
    }, { timeout: 20_000 });
    await expectRowActionsOnHover(table);
  },
};

export const Source: Story = {
  parameters: {
    ...registryStoryParameters(
      registrySource,
      "The same file opens as coloured CSV source, with both sidebars closed.",
    ),
    a11y: {
      context: { exclude: [".cm-scroller"] },
    },
  },
  render: shellRender("source"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        const editor = canvasElement.querySelector<HTMLElement>(
          ".cm-editor.csv-source-view",
        );
        expect(editor?.checkVisibility()).toBe(true);
        expect(editor?.querySelector(".cm-csv-cell1")).not.toBeNull();
        expect(editor?.textContent).toContain("North");
        expect(editor?.textContent).toContain("culvert");
        expect(canvas.getByRole("button", { name: "View CSV table" })).toBeVisible();
        expectClosedSidebars(canvasElement);
      },
      { timeout: 20_000 },
    );
  },
};

export const Canvas: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "The seeded canvas fills the shell with both sidebars closed.",
  ),
  render: shellRender("canvas"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    await waitFor(() => {
      const frame = canvasElement.querySelector<HTMLElement>(
        '[data-testid="csv-canvas"][data-csv-role="file"]',
      );
      const sheet = frame?.querySelector<HTMLElement>("[data-testid='csv-sheet']");
      expect(frame?.checkVisibility()).toBe(true);
      expect(sheet?.clientWidth ?? 0).toBeGreaterThan(200);
      expect(frame?.querySelector("canvas")?.clientHeight ?? 0).toBeGreaterThan(80);
      expect(canvasElement.querySelector(".csv-data-table")).toBeNull();
      expect(
        within(frame!).getByTestId("csv-status-bar").textContent,
      ).toContain("columns");
      expectClosedSidebars(canvasElement);
    }, { timeout: 20_000 });
  },
};

export const EmbeddedCanvas: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A staff-readings note keeps the canvas sheet inside a Markdown embed.",
  ),
  render: shellRender("embedded-canvas"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(() => {
      const frame = canvasElement.querySelector<HTMLElement>(
        '[data-testid="csv-canvas"][data-csv-role="embed"]',
      );
      const sheet = frame?.querySelector<HTMLElement>("[data-testid='csv-sheet']");
      expect(frame?.checkVisibility()).toBe(true);
      expect(sheet?.clientWidth ?? 0).toBeGreaterThan(120);
      expect(frame?.querySelector("canvas")?.clientHeight ?? 0).toBeGreaterThan(80);
      expect(
        frame?.closest(".mira-embed")?.querySelector("figcaption")?.textContent,
      ).toContain("Sample.csv");
      expect(canvas.getAllByText("The south basin kept the late tide.").length).toBeGreaterThan(0);
      expect(canvasElement.querySelector(".csv-data-table")).toBeNull();
      expectClosedSidebars(canvasElement);
    }, { timeout: 20_000 });
  },
};

export const Embedded: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A staff-readings note keeps the same table inside a Markdown embed.",
  ),
  render: shellRender("embedded"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    const table = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>(
        '[data-testid="csv-table"][data-csv-role="embed"]',
      );
      expect(found?.checkVisibility()).toBe(true);
      expect(
        found?.closest(".mira-embed")?.querySelector("figcaption")?.textContent,
      ).toContain("Sample.csv");
      expect(canvas.getByRole("cell", { name: QUOTED_NOTE })).toBeVisible();
      expect(canvas.getAllByText("The south basin kept the late tide.").length).toBeGreaterThan(0);
      expectActionsInView(found!);
      expectClosedSidebars(canvasElement);
      return found!;
    }, { timeout: 20_000 });
    await expectRowActionsOnHover(table);
  },
};

export const Find: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "Find stays open on the one quoted cell, with both sidebars closed.",
  ),
  render: shellRender("table"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    const table = await waitFor(() => {
      const found = canvasElement.querySelector<HTMLElement>(
        '[data-testid="csv-table"][data-csv-role="file"]',
      );
      expect(found?.checkVisibility()).toBe(true);
      return found!;
    });
    await userEvent.click(
      within(table).getByRole("button", { name: "Find and replace" }),
    );
    await userEvent.type(
      within(table).getByRole("textbox", { name: "Find" }),
      "culvert",
    );
    await waitFor(() => {
      expect(within(table).getAllByText("1 of 1").length).toBeGreaterThan(0);
      expect(
        table.querySelector('[data-csv-search="active"]'),
      ).not.toBeNull();
      expect(within(table).getByRole("textbox", { name: "Find" })).toBeVisible();
      expectClosedSidebars(canvasElement);
    });
  },
};
