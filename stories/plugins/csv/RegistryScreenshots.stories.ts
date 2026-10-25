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
          "An app-backed CSV table, its coloured source, find, and the same table embedded in a note. Both sidebars stay closed.",
      },
    },
  },
} satisfies Meta<typeof RegistryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function shellRender(
  document: "table" | "source" | "embedded",
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
    await waitFor(
      () => {
        const table = canvasElement.querySelector<HTMLElement>(
          '[data-testid="csv-table"][data-csv-role="file"]',
        );
        expect(table?.checkVisibility()).toBe(true);
        expect(canvas.getByRole("cell", { name: QUOTED_NOTE })).toBeVisible();
        expect(canvas.getByRole("columnheader", { name: /staff/ })).toBeVisible();
        expect(canvas.getByTestId("csv-status-bar").textContent).toContain(
          "2,501 rows",
        );
        expectActionsInView(table!);
        expectClosedSidebars(canvasElement);
      },
      { timeout: 20_000 },
    );
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

export const Embedded: Story = {
  parameters: registryStoryParameters(
    registrySource,
    "A staff-readings note keeps the same table inside a Markdown embed.",
  ),
  render: shellRender("embedded"),
  play: async ({ canvasElement }) => {
    await registryPanelApp(canvasElement);
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        const table = canvasElement.querySelector<HTMLElement>(
          '[data-testid="csv-table"][data-csv-role="embed"]',
        );
        expect(table?.checkVisibility()).toBe(true);
        expect(
          table?.closest(".mira-embed")?.querySelector("figcaption")?.textContent,
        ).toContain("Sample.csv");
        expect(canvas.getByRole("cell", { name: QUOTED_NOTE })).toBeVisible();
        expect(canvas.getAllByText("The south basin kept the late tide.").length).toBeGreaterThan(0);
        expectActionsInView(table!);
        expectClosedSidebars(canvasElement);
      },
      { timeout: 20_000 },
    );
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
