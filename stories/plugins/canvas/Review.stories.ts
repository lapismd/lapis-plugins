import { expandCanvasTools } from "./canvas-story-helpers";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { contrastRatio } from "./contrast-assertions";
import ViewingPanelDemo from "./panels/ViewingPanelDemo.svelte";

const meta = {
  title: "Plugins/Canvas/Review",
  component: ViewingPanelDemo,
  tags: ["visual-pending"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Responsive authoring, searchable selection, group outlines and measured card contrast in the real workspace.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: '<script lang="ts">\n  import type { App } from "@lapis-notes/api";\n  import { WorkspaceShell } from "@lapis-notes/workspace";\n  let { app }: { app: App } = $props();\n</script>\n<WorkspaceShell {app} />',
      },
    },
  },
} satisfies Meta<typeof ViewingPanelDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
const render = () => ({
  Component: ViewingPanelDemo,
  props: { layout: "middle-top-tabs" },
});
async function ready(canvas: HTMLElement) {
  await waitFor(
    () => expect(canvas.querySelector('[data-status="ready"]')).toBeVisible(),
    { timeout: 30_000 }
  );
  const root = canvas.querySelector<HTMLElement>(
    ".canvas-view-root:not([data-canvas-embed])"
  )!;
  await waitFor(
    () => expect(root.querySelector(".canvas-node-label")).toBeVisible(),
    { timeout: 30_000 }
  );
  await expandCanvasTools(root);
  return root;
}

export const AuthoringToolbar: Story = {
  name: "Authoring uses available width and collapses to one icon",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement),
      board = within(root);
    const surface = root.querySelector<HTMLElement>(".canvas-view-surface")!;
    const toolbar = board.getByRole("toolbar", {
      name: "Canvas authoring",
      exact: true,
    });
    if (surface.clientWidth >= 600) {
      expect(
        new Set(
          [...toolbar.querySelectorAll("button")].map(
            (button) => button.offsetTop
          )
        ).size
      ).toBe(1);
    }
    const collapse = board.getByRole("button", {
      name: "Collapse authoring tools",
      exact: true,
    });
    await userEvent.click(collapse);
    expect(
      within(toolbar).queryByRole("button", {
        name: "Add text card",
        exact: true,
      })
    ).toBeNull();
    const expand = board.getByRole("button", {
      name: "Expand authoring tools",
      exact: true,
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expand.focus();
    await userEvent.keyboard("{Enter}");
    expect(
      board.getByRole("button", { name: "Add text card", exact: true })
    ).toBeVisible();
    // A narrow pane constrains the toolbar by its own surface, not the window.
    const original = surface.style.width;
    surface.style.width = "280px";
    await waitFor(() =>
      expect(toolbar.getBoundingClientRect().right).toBeLessThanOrEqual(
        surface.getBoundingClientRect().right
      )
    );
    surface.style.width = original;
  },
};

export const SearchableSelection: Story = {
  name: "Command View searches and toggles several cards",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(root).getByRole("button", { name: "Select cards", exact: true })
    );
    const search = page.getByRole("combobox", {
      name: "Search cards",
      exact: true,
    });
    expect(search.closest('[data-ui-component="command-view"]')).not.toBeNull();
    await userEvent.type(search, "Canvas overview");
    const option = page.getByRole("checkbox", { name: /Canvas overview/ });
    await userEvent.click(option);
    expect(option).toBeChecked();
    expect(root.querySelector('[data-id="overview"]')).toHaveClass("selected");
    await userEvent.clear(search);
    await userEvent.type(search, "Canvas test group");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(root.querySelectorAll(".svelte-flow__node.selected")).toHaveLength(
      2
    );
    await userEvent.clear(search);
    await userEvent.type(search, "no matching card");
    expect(page.getByText("No cards found.", { exact: true })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(
      within(root).getByRole("button", { name: "Select cards", exact: true })
    ).toHaveFocus();
  },
};

export const GroupOutline: Story = {
  name: "Editing a group retains one stable outline",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement);
    const label = root.querySelector<HTMLInputElement>(
      ".canvas-group-label-input"
    )!;
    const shell = label.closest<HTMLElement>(".canvas-node-shell")!;
    const frame = shell.querySelector<HTMLElement>(".canvas-node-label-group")!;
    const before = getComputedStyle(frame).borderWidth;
    await userEvent.click(label);
    await userEvent.type(label, " edited");
    expect(getComputedStyle(frame).borderWidth).toBe(before);
    expect(getComputedStyle(label).borderWidth).toBe("0px");
    expect(getComputedStyle(label).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(frame).boxShadow).toBe("none");
  },
};

export const GroupNavigation: Story = {
  name: "Group navigation searches with Command View and compact glyphs",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement);
    const navigation = within(root).getByRole("toolbar", {
      name: "Canvas navigation",
      exact: true,
    });
    const select = within(navigation).getByRole("button", {
      name: "Jump to group",
      exact: true,
    });
    expect(select).toHaveAttribute("data-ui-component", "button");
    for (const icon of navigation.querySelectorAll("button > svg"))
      expect(icon.getBoundingClientRect().width).toBeLessThanOrEqual(16);
    await userEvent.click(select);
    const search = within(canvasElement.ownerDocument.body).getByRole("combobox", { name: "Search groups", exact: true });
    expect(search.closest('[data-ui-component="command-view"]')).not.toBeNull();
    await userEvent.type(search, "Canvas test group");
    await userEvent.click(
      within(canvasElement.ownerDocument.body).getByRole("option", {
        name: "Canvas test group",
        exact: true,
      })
    );
    await waitFor(() => expect(select).toHaveFocus());
  },
};

export const DefaultContrast: Story = {
  name: "Default card captions and group labels meet normal text contrast",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement),
      owner = root.ownerDocument;
    for (const label of root.querySelectorAll<HTMLElement>(
      ".canvas-node-file-label, .canvas-group-label-input, .canvas-node-meta-text"
    )) {
      const background = label.matches(".canvas-group-label-input")
        ? label.parentElement!
        : label.matches(".canvas-node-meta-text")
        ? label.closest<HTMLElement>(".canvas-node-label")!
        : label;
      expect(
        contrastRatio(
          owner,
          getComputedStyle(label).color,
          getComputedStyle(background).backgroundColor
        ),
        label.className
      ).toBeGreaterThanOrEqual(4.5);
    }
  },
};

export const NavigationCollapse: Story = {
  name: "Navigation collapses and owns icon-only card selection",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement),
      board = within(root);
    const toolbar = board.getByRole("toolbar", {
      name: "Canvas navigation",
      exact: true,
    });
    const select = within(toolbar).getByRole("button", {
      name: "Select cards",
      exact: true,
    });
    expect(select.textContent?.trim()).toBe("");
    const buttons = [
      ...toolbar.querySelectorAll<HTMLButtonElement>(
        'button:not([role="combobox"])'
      ),
    ];
    expect(
      new Set(buttons.map((button) => button.getBoundingClientRect().height))
        .size
    ).toBe(1);
    await userEvent.click(
      board.getByRole("button", {
        name: "Collapse navigation tools",
        exact: true,
      })
    );
    expect(within(toolbar).queryAllByRole("button")).toHaveLength(1);
    const expand = board.getByRole("button", {
      name: "Expand navigation tools",
      exact: true,
    });
    expand.focus();
    await userEvent.keyboard("{Enter}");
    expect(
      within(toolbar).getByRole("button", { name: "Select cards", exact: true })
    ).toBeVisible();
  },
};

export const RainbowPicker: Story = {
  name: "Custom colour picker has a circular rainbow swatch",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement);
    await userEvent.click(
      root.querySelector<HTMLElement>(
        '[data-id="overview"] .canvas-node-label'
      )!
    );
    await userEvent.click(
      within(root).getByRole("button", { name: "Set color", exact: true })
    );
    const picker = within(root).getByRole("button", {
      name: "Choose custom node color",
      exact: true,
    });
    expect(getComputedStyle(picker).backgroundImage).toContain(
      "conic-gradient"
    );
    expect(getComputedStyle(picker).borderRadius).toBe("999px");
  },
};

export const ControlRail: Story = {
  name: "Controls share a right rail and expose saved snapping settings",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement), board = within(root);
    const rail = root.querySelector<HTMLElement>(".canvas-control-rail");
    expect(rail).not.toBeNull();
    const authoring = board.getByRole("toolbar", { name: "Canvas authoring", exact: true });
    const navigation = board.getByRole("toolbar", { name: "Canvas navigation", exact: true });
    expect(rail!.contains(authoring)).toBe(true);
    expect(rail!.contains(navigation)).toBe(true);
    const zoom = board.getByRole("button", { name: "Zoom In", exact: true });
    expect(authoring.getBoundingClientRect().bottom).toBeLessThanOrEqual(zoom.getBoundingClientRect().top);
    expect(navigation.getBoundingClientRect().top).toBeGreaterThanOrEqual(zoom.getBoundingClientRect().bottom);
    await userEvent.click(board.getByRole("button", { name: "Canvas settings", exact: true }));
    const page = within(canvasElement.ownerDocument.body);
    const grid = page.getByRole("checkbox", { name: "Snap to grid", exact: true });
    const objects = page.getByRole("checkbox", { name: "Snap to objects", exact: true });
    expect(grid).not.toBeChecked(); expect(objects).toBeChecked();
    await userEvent.click(grid);
    await waitFor(() => expect(grid).toBeChecked());
    await waitFor(() => expect(objects).toBeEnabled());
    await userEvent.click(objects);
    await waitFor(() => expect(objects).not.toBeChecked());
    expect(grid).toBeChecked(); expect(objects).not.toBeChecked();
    await userEvent.keyboard("{Escape}");
  },
};

export const ToolbarTooltips: Story = {
  name: "Toolbar buttons use shared tooltips on keyboard focus",
  render,
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement), board = within(root);
    for (const toolbar of root.querySelectorAll('[role="toolbar"]')) {
      for (const button of toolbar.querySelectorAll('button[aria-label]')) expect(button.closest("[data-tooltip-trigger]")).not.toBeNull();
    }
    const add = board.getByRole("button", { name: "Add text card", exact: true });
    board.getByRole("button", { name: "Collapse authoring tools", exact: true }).focus();
    await userEvent.tab();
    expect(add).toHaveFocus();
    await waitFor(() => {
      const id = add.getAttribute("aria-describedby");
      expect(id).not.toBeNull();
      const tooltip = canvasElement.ownerDocument.getElementById(id!);
      expect(tooltip).toBeVisible();
      expect(tooltip).toHaveTextContent("Add text card");
      expect(tooltip).toHaveAttribute("data-ui-component", "tooltip");
      expect(add).toHaveAccessibleDescription("Add text card");
    });
    await userEvent.keyboard("{Escape}");
  },
};

export const CollapsedOnStart: Story = {
  name: "Both toolbars start collapsed in views and embeds",
  render,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-status="ready"]')).toBeVisible(), { timeout: 30_000 });
    const root = canvasElement.querySelector<HTMLElement>(".canvas-view-root:not([data-canvas-embed])")!;
    const board = within(root);
    expect(board.getByRole("button", { name: "Expand authoring tools", exact: true })).toHaveAttribute("aria-expanded", "false");
    expect(board.getByRole("button", { name: "Expand navigation tools", exact: true })).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Reading.md", exact: true }));
    const embed = await waitFor(() => {
      const node = canvasElement.querySelector<HTMLElement>("[data-canvas-embed]");
      expect(node).toBeVisible(); return node!;
    });
    expect(within(embed).getByRole("button", { name: "Expand navigation tools", exact: true })).toHaveAttribute("aria-expanded", "false");

  },
};

export const WebCards: Story = {
  name: "Website cards provide readable details before opt-in previews",
  render: () => ({ Component: ViewingPanelDemo, props: { layout: "middle-top-tabs", canvasPath: "Website.canvas", files: {
    "Website.canvas": JSON.stringify({ nodes: [
      { id: "website", type: "link", url: "https://example.com/salt-marsh", x: 0, y: 0, width: 420, height: 360 },
      { id: "unsafe", type: "link", url: "javascript:alert(1)", x: 520, y: 0, width: 300, height: 160 },
    ], edges: [] }),
  } } }),
  play: async ({ canvasElement }) => {
    const root = await ready(canvasElement), card = within(root.querySelector<HTMLElement>('[data-id="website"]')!);
    expect(card.getByText("Salt marsh", { exact: true })).toBeVisible();
    expect(card.getByRole("button", { name: "Load web preview", exact: true })).toBeEnabled();
    expect(root.querySelector("iframe")).toBeNull();
    expect(within(root.querySelector<HTMLElement>('[data-id="unsafe"]')!).queryByRole("button", { name: "Load web preview", exact: true })).toBeNull();
  },
};
