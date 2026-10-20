import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SearchPanel } from "@lapis-notes/search";
import SearchPanelDemo from "./panels/SearchPanelDemo.svelte";
import FederatedSearchDemo from "./FederatedSearchDemo.svelte";

const meta = {
  title: "Plugins/Search/Federated results",
  component: SearchPanel,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
  render: () => ({ Component: FederatedSearchDemo, props: {} }),
} satisfies Meta<typeof SearchPanel>;
export default meta;
export const IncrementalSavedVersions: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector("[data-federated-ready=true]"),
        ).not.toBeNull(),
      { timeout: 60_000 },
    );
    const view = within(canvasElement);
    await waitFor(
      () =>
        expect(
          view.getByRole("treeitem", { name: /Notes\/Welcome.md,/ }),
        ).toBeVisible(),
      { timeout: 15000 },
    );
    const file = view.getByRole("treeitem", { name: /Notes\/Welcome.md,/ });
    await userEvent.click(file);
    const version = await view.findByRole("treeitem", {
      name: /History Preserve the welcome/,
    });
    await userEvent.click(
      within(version).getByRole("button", { name: /^History / }),
    );

    await expect(
      await within(version).findByRole("treeitem", {
        name: /Welcome to the earlier saved notes/,
      }),
    ).toBeVisible();
    await userEvent.click(
      view.getByRole("button", { name: "Load remaining history" }),
    );
    await waitFor(() => expect(view.getByText("2 checkpoints")).toBeVisible());
    await expect(file).toHaveAttribute("aria-expanded", "true");
    await expect(
      await within(version).findByRole("treeitem", {
        name: /Welcome to the earlier saved notes/,
      }),
    ).toBeVisible();
    await expect(
      view.getByRole("treeitem", { name: /Archive\/Deleted welcome.md/ }),
    ).toBeVisible();
    await userEvent.click(
      view.getByRole("button", { name: /Open saved version Preserve/ }),
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-opened-revision='1']"),
      ).not.toBeNull(),
    );
  },
};

export const CurrentFilesNativeScroll: StoryObj<typeof meta> = {
  render: () => ({
    Component: SearchPanelDemo,
    props: { layout: "left-sidebar", diagnostics: "none" },
  }),
  beforeEach: () => {
    const previous = document.documentElement.dataset.uiScrollStrategy;
    document.documentElement.dataset.uiScrollStrategy = "native";
    return () => {
      if (previous === undefined)
        delete document.documentElement.dataset.uiScrollStrategy;
      else document.documentElement.dataset.uiScrollStrategy = previous;
    };
  },
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(
          canvasElement.querySelector('[data-search-placement-ready="true"]'),
        ).not.toBeNull(),
      { timeout: 30000 },
    );
    const panel = canvasElement.querySelector<HTMLElement>(
      '[data-testid="search-panel"]',
    )!;
    const view = within(panel);
    await userEvent.type(
      view.getByRole("searchbox", { name: "Search vault" }),
      "Welcome",
    );
    const row = await view.findByRole("treeitem", {
      name: /Notes\/Welcome.md,.*matches/,
    });
    await expect(row).toBeVisible();
    const viewport = panel.querySelector<HTMLElement>(
      '.search-panel__scroll-area > [data-ui-part="scroll-area-viewport"]',
    )!;
    const bounds = viewport.getBoundingClientRect();
    expect(bounds.height).toBeGreaterThan(40);
    expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(bounds.top);
    expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      bounds.bottom,
    );
    expect(
      getComputedStyle(panel.querySelector(".search-panel__sort-label")!)
        .display,
    ).toBe("none");
    await userEvent.click(
      view.getByRole("button", { name: "Filename (A to Z)" }),
    );
    const descending = await within(
      canvasElement.ownerDocument.body,
    ).findByRole("button", { name: "Filename (Z to A)" });
    await waitFor(() => expect(descending).toBeVisible());
  },
};
