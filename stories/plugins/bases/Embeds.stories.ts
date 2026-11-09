import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import { basesEmbedsExampleSource } from "./BasesEmbeds.example-sources";
import BasesMarkdownEmbedsDemo from "./BasesMarkdownEmbedsDemo.svelte";

const meta = {
  title: "Plugins/Bases/Embeds",
  component: BasesMarkdownEmbedsDemo,
  tags: ["visual-pending", "test"],
  argTypes: { listProperties: { control: false } },
  parameters: {
    ...workspaceCatalogParameters("plugins-bases-embeds-markdown"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real App renders read-only Bases file and fenced embeds through the plugin registries.",
      },
      source: {
        code: basesEmbedsExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/bases/embeds/markdown-chromium.png",
      ],
    },
  },
} satisfies Meta<typeof BasesMarkdownEmbedsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectPopulatedEmbeds(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-embeds-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvas
          .getByTestId("bases-file-embed")
          .querySelector(
            '[data-ui-component="bases-view"][data-read-only="true"]',
          ),
      ).toBeVisible();
      expect(
        canvas
          .getByTestId("bases-fenced-embed")
          .querySelector(
            '[data-ui-component="bases-view"][data-read-only="true"]',
          ),
      ).toBeVisible();
      expect(canvas.getByText(/Unable to render this base:/u)).toBeVisible();
      const error = within(canvas.getByTestId("bases-invalid-embed")).getByRole(
        "alert",
      );
      expect(error).toHaveAttribute("data-ui-component", "alert");
      expect(error).toHaveAttribute("data-variant", "destructive");
      expect(error.querySelector("svg")).toBeVisible();
      expect(within(error).getByText("Unable to render base")).toBeVisible();
      for (const id of ["bases-file-embed", "bases-fenced-embed"]) {
        const host = canvas.getByTestId(id);
        const viewport = host.querySelector<HTMLElement>(
          '[data-ui-part="scroll-area-viewport"]',
        );
        expect(viewport).toBeVisible();
        expect(viewport!.clientHeight).toBeGreaterThan(0);
        const toolbar = host.querySelector<HTMLElement>(
          '[data-ui-component="bases-toolbar"]',
        )!;
        expect(toolbar).toBeVisible();
        const controls = toolbar.querySelector<HTMLElement>(
          ".bases-view__toolbar-controls",
        )!;
        expect(
          within(controls).getByRole("button", { name: "Search" }),
        ).toBeVisible();
        expect(
          within(controls).getByRole("button", { name: "Filter" }),
        ).toBeVisible();
        expect(
          within(toolbar).queryByRole("button", { name: "New", exact: true }),
        ).toBeNull();
        expect(
          toolbar.getBoundingClientRect().right -
            controls.getBoundingClientRect().right,
        ).toBeLessThanOrEqual(16);
        expect(within(toolbar).queryByText("Projects.base")).toBeNull();
        expect(
          within(host).getByRole("link", {
            name: "Aurora.md",
          }),
        ).toBeVisible();
      }
    },
    { timeout: 20_000 },
  );
  return canvas;
}

async function expectFileChip(canvasElement: HTMLElement) {
  const host = within(canvasElement).getByTestId("bases-file-embed");
  const chip = host.querySelector<HTMLElement>(".bases-embed__file-chip")!;
  expect(chip).toHaveTextContent("Projects.base");
  const search = within(host).getByRole("button", { name: "Search" });
  search.focus();
  await waitFor(() => expect(getComputedStyle(chip).opacity).toBe("1"));
  const bounds = host.getBoundingClientRect();
  const chipBounds = chip.getBoundingClientRect();
  expect(Math.abs(bounds.right - chipBounds.right)).toBeLessThan(1);
  expect(Math.abs(bounds.bottom - chipBounds.bottom)).toBeLessThan(1);
  expect(getComputedStyle(chip).borderTopRightRadius).toBe("0px");
  expect(getComputedStyle(chip).borderBottomRightRadius).toBe("0px");
  expect(getComputedStyle(chip).borderBottomLeftRadius).toBe("0px");
  search.blur();
}

async function expectEmbedQueryControls(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const root = canvas.getByTestId("bases-embeds-demo") as HTMLElement & {
    __lapisApp: App;
  };
  const source = root.__lapisApp.vault.getFileByPath("Bases/Projects.base")!;
  const original = await root.__lapisApp.vault.read(source);
  for (const id of ["bases-file-embed", "bases-fenced-embed"]) {
    const host = within(canvas.getByTestId(id));
    await userEvent.click(host.getByRole("button", { name: "Search" }));
    await userEvent.type(host.getByPlaceholderText("Find..."), "Harbor");
    await waitFor(() => {
      expect(host.getByRole("link", { name: "Harbor.md" })).toBeVisible();
      expect(host.queryByRole("link", { name: "Aurora.md" })).toBeNull();
    });
    await userEvent.click(host.getByRole("button", { name: "Clear search" }));
    await waitFor(() =>
      expect(host.getByRole("link", { name: "Aurora.md" })).toBeVisible(),
    );
    await userEvent.click(host.getByRole("button", { name: "Search" }));
    await userEvent.click(host.getByRole("button", { name: "Filter" }));
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.body.querySelector(
          '[data-bases-popover="filter"][data-state="open"]',
        ),
      ).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
  }
  expect(await root.__lapisApp.vault.read(source)).toBe(original);
}

export const Markdown: Story = {
  play: async ({ canvasElement, mount }) => {
    await mount(BasesMarkdownEmbedsDemo, { props: { listProperties: false } });
    const canvas = await expectPopulatedEmbeds(canvasElement);
    await expectFileChip(canvasElement);
    const table = canvas.getByTestId("bases-file-embed");
    const tableSurface = table.querySelector<HTMLElement>(
      ".bases-table__scroll-area",
    )!;
    const tableViewport = tableSurface.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    )!;
    expect(tableViewport.scrollHeight).toBeGreaterThan(
      tableViewport.clientHeight,
    );
    await waitFor(() =>
      expect(tableViewport.scrollWidth).toBeLessThanOrEqual(
        tableViewport.clientWidth + 1,
      ),
    );
    table.style.width = "360px";
    await waitFor(() =>
      expect(tableViewport.scrollWidth).toBeGreaterThan(tableViewport.clientWidth),
    );
    table.style.removeProperty("width");
    await waitFor(() =>
      expect(tableViewport.scrollWidth).toBeLessThanOrEqual(
        tableViewport.clientWidth + 1,
      ),
    );
    for (const track of tableSurface.querySelectorAll<HTMLElement>(
      '[data-ui-part="scroll-area-scrollbar"]',
    )) {
      expect(getComputedStyle(track).backgroundColor).toBe(
        getComputedStyle(tableSurface).backgroundColor,
      );
    }
    await expectEmbedQueryControls(canvasElement);

    const root = canvas.getByTestId("bases-embeds-demo") as HTMLElement & {
      __cleanupBasesEmbeds?: () => void;
    };
    root.__cleanupBasesEmbeds?.();
    expect(canvas.getByTestId("bases-file-embed")).toBeEmptyDOMElement();
    expect(canvas.getByTestId("bases-fenced-embed")).toBeEmptyDOMElement();
    expect(canvas.getByTestId("bases-invalid-embed")).toBeEmptyDOMElement();
    await mount(BasesMarkdownEmbedsDemo);
    await expectPopulatedEmbeds(canvasElement);
    const list = canvas.getByTestId("bases-fenced-embed");
    const listViewport = list.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    )!;
    await waitFor(() =>
      expect(listViewport.scrollWidth).toBeLessThanOrEqual(
        listViewport.clientWidth + 1,
      ),
    );
    const properties = [
      ...list.querySelectorAll<HTMLElement>(
        ".bases-list__record:first-child .bases-list__property",
      ),
    ];
    expect(properties.length).toBeGreaterThanOrEqual(7);
    expect(
      new Set(
        properties.map((property) =>
          Math.round(property.getBoundingClientRect().top),
        ),
      ).size,
    ).toBeGreaterThan(1);
    for (const property of properties) {
      const label = property.querySelector("dt")!.getBoundingClientRect();
      const value = property.querySelector("dd")!.getBoundingClientRect();
      expect(value.left - label.right).toBeGreaterThanOrEqual(7);
      expect(property.getBoundingClientRect().right).toBeLessThanOrEqual(
        listViewport.getBoundingClientRect().right + 1,
      );
    }
    for (const header of list.querySelectorAll<HTMLElement>(
      ".bases-list__group-header",
    )) {
      const chevron = header.querySelector<SVGElement>("button svg")!;
      expect(
        chevron.getBoundingClientRect().left - header.getBoundingClientRect().left,
      ).toBeGreaterThanOrEqual(8);
      const count = header.querySelector<HTMLElement>(".bases-list__count")!;
      expect(count).toBeVisible();
      expect(count.getBoundingClientRect().right).toBeLessThanOrEqual(
        listViewport.getBoundingClientRect().right,
      );
    }
    list.style.width = "360px";
    await waitFor(() => {
      expect(listViewport.scrollWidth).toBeLessThanOrEqual(
        listViewport.clientWidth + 1,
      );
      for (const property of properties) {
        expect(property.getBoundingClientRect().right).toBeLessThanOrEqual(
          listViewport.getBoundingClientRect().right + 1,
        );
      }
      const header = list.querySelector<HTMLElement>(".bases-list__group-header")!;
      const chevron = header.querySelector<SVGElement>("button svg")!;
      expect(
        chevron.getBoundingClientRect().left - header.getBoundingClientRect().left,
      ).toBeGreaterThanOrEqual(8);
      const count = list.querySelector<HTMLElement>(".bases-list__count")!;
      expect(count.getBoundingClientRect().right).toBeLessThanOrEqual(
        listViewport.getBoundingClientRect().right,
      );
    });
    list.style.removeProperty("width");
    const record = list.querySelector<HTMLElement>(".bases-list__record")!;
    const groups = list.querySelector<HTMLElement>(".bases-list__groups")!;
    expect(record.getBoundingClientRect().width).toBeCloseTo(
      groups.getBoundingClientRect().width,
      0,
    );
    expect(getComputedStyle(record).borderBottomWidth).toBe("1px");
    expect(
      record
        .querySelector(".bases-list__record-content")!
        .getBoundingClientRect().left - record.getBoundingClientRect().left,
    ).toBeGreaterThanOrEqual(32);
    expect(
      canvas
        .getByTestId("bases-file-embed")
        .querySelector('[data-ui-component="bases-table-view"]'),
    ).toBeVisible();
    expect(
      canvas
        .getByTestId("bases-fenced-embed")
        .querySelector('[data-ui-component="bases-list-view"]'),
    ).toBeVisible();
  },
};

async function expectBoardEmbeds(
  canvasElement: HTMLElement,
  component: string,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-embeds-status")).toHaveTextContent(
        "ready",
      );
      for (const id of ["bases-file-embed", "bases-fenced-embed"]) {
        const host = canvas.getByTestId(id);
        expect(
          host.querySelector(`[data-ui-component="${component}"]`),
        ).toBeVisible();
        expect(
          within(host).getAllByRole("button", { name: /^Open card:/ }).length,
        ).toBeGreaterThan(0);
        expect(
          within(host).getByRole("button", { name: "Search", exact: true }),
        ).toBeVisible();
        expect(
          within(host).getByRole("button", { name: "Filter", exact: true }),
        ).toBeVisible();
        expect(
          within(host).queryByRole("button", { name: "New", exact: true }),
        ).toBeNull();
      }
    },
    { timeout: 20_000 },
  );
}

export const Kanban: Story = {
  args: { scenario: "kanban" },
  parameters: workspaceCatalogParameters("plugins-bases-embeds-kanban"),
  play: async ({ canvasElement }) =>
    expectBoardEmbeds(canvasElement, "kanban-board"),
};

export const Activity: Story = {
  args: { scenario: "activity" },
  parameters: workspaceCatalogParameters("plugins-bases-embeds-activity"),
  play: async ({ canvasElement }) =>
    expectBoardEmbeds(canvasElement, "kanban-activity"),
};
