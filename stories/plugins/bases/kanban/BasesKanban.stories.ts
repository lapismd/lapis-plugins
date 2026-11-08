import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../../workspace/docs-parameters";
import {
  renderScenario,
  storyParameters,
  demoApp,
  demoDocument,
  waitForView,
} from "../bases-view-story-helpers";
import type { BasesViewScenario } from "../bases-views-fixture";
const meta = {
  title: "Plugins/Bases/Views/Kanban",
  component: BasesViewSurface,
  args: {
    app: undefined as unknown as App,
    document: undefined as unknown as BasesDocument,
  },
  argTypes: {
    app: { control: false },
    document: { control: false },
    registrations: { control: false },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    catalogLayout: "full-viewport",
    docs: {
      canvas: { className: "bases-views-docs-canvas" },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
  },
} satisfies Meta<typeof BasesViewSurface>;
export default meta;
type Story = StoryObj<typeof meta>;

function expectCardBackground(element: HTMLElement) {
  const card = element.closest<HTMLElement>(".detail-main-card")!;
  expect(card).not.toBeNull();
  let painted: HTMLElement | null = element;
  while (
    painted &&
    getComputedStyle(painted).backgroundColor === "rgba(0, 0, 0, 0)"
  )
    painted = painted.parentElement;
  expect(painted).not.toBeNull();
  expect(getComputedStyle(painted!).backgroundColor).toBe(
    getComputedStyle(card).backgroundColor,
  );
}

export const Projects: Story = {
  parameters: storyParameters(
    "kanban",
    "A kanban board groups projects by status into collapsible lanes; moving a card to an adjacent lane with the keyboard persists the grouped frontmatter property and re-runs the query.",
  ),
  render: renderScenario("kanban"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "kanban", "kanban");
    await waitFor(() => {
      expect(
        canvasElement.querySelectorAll('[data-ui-component="kanban-column"]')
          .length,
      ).toBeGreaterThanOrEqual(2);
    });
    await expect(canvas.getByRole("heading", { name: "Active" })).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "Planning" }),
    ).toBeVisible();

    const card = canvas.getByRole("button", { name: /Open card: Aurora/ });
    await expect(card).toBeVisible();
    const app = demoApp(canvasElement);

    // The board is host-bounded to the view pane (design-core's
    // --kanban-board-height contract): lane shells and their selection rings
    // never overflow the content box, so borders cannot clip at the bottom.
    const content = canvasElement.querySelector(".bases-view__content");
    const shell = canvasElement.querySelector(".kanban-column .column-shell");
    expect(content).not.toBeNull();
    expect(shell).not.toBeNull();
    const contentRect = content!.getBoundingClientRect();
    const shellRect = shell!.getBoundingClientRect();
    expect(shellRect.bottom).toBeLessThanOrEqual(contentRect.bottom + 1);
    expect(shellRect.top).toBeGreaterThanOrEqual(contentRect.top - 1);

    // Aurora starts in the Active lane; moving it right targets Planning.
    await expect(
      within(
        canvas
          .getByRole("heading", { name: "Active" })
          .closest(".kanban-column") as HTMLElement,
      ).getByRole("button", { name: /Open card: Aurora/ }),
    ).toBeVisible();

    // Focus selects the card, then the board's Shift+Arrow move shortcut walks
    // it to the next lane, persisting the grouped property through frontmatter.
    await card.focus();
    await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");

    // The move writes the grouped status property on the note.
    await waitFor(
      async () => {
        const file = app.vault.getFileByPath("Projects/Aurora.md");
        expect(file).not.toBeNull();
        const content = await app.vault.read(file!);
        expect(content).toMatch(/status:\s*"?Planning"?/);
      },
      { timeout: 15_000 },
    );

    // The re-run query relocates the card into the Planning lane.
    await waitFor(
      () => {
        const planning = canvas
          .getByRole("heading", { name: "Planning" })
          .closest(".kanban-column") as HTMLElement;
        expect(planning).not.toBeNull();
        expect(
          within(planning).getByRole("button", { name: /Open card: Aurora/ }),
        ).toBeVisible();
      },
      { timeout: 15_000 },
    );

    // Making a hidden property visible in the view settings re-renders the
    // card metadata: each added property gets its own two-column grid cell.
    await userEvent.click(canvas.getByRole("button", { name: "Properties" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        body.getByRole("combobox", { name: "Filter properties" }),
      ).toBeVisible(),
    );
    await userEvent.click(body.getAllByText("Due").at(-1)!);
    const board = demoDocument(canvasElement).views.find(
      (view) => view.name === "Status board",
    )!;
    await waitFor(() => expect(board.order).toContain("note.due"));
    await waitFor(() => {
      const movedCard = canvas.getByRole("button", {
        name: /Open card: Aurora/,
      });
      expect(within(movedCard).getByText("94", { exact: true })).toBeVisible();
      expect(movedCard.querySelectorAll(".kanban-metadata > div").length).toBe(
        board.order.length - 1,
      );
      expect(
        [...movedCard.querySelectorAll(".kanban-metadata dd")].some((cell) =>
          /18/.test(cell.textContent ?? ""),
        ),
      ).toBe(true);
    });
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      canvas.getByRole("button", { name: /Open card: Aurora/ }),
    );
    await waitFor(() =>
      expect(body.getByRole("button", { name: /^Edit$/ })).toBeVisible(),
    );
    await userEvent.click(body.getByRole("button", { name: /^Edit$/ }));
    const properties = await waitFor(() => {
      const element = canvasElement.ownerDocument.querySelector<HTMLElement>(
        ".cm-editor .mira-rich-widget--frontmatter .md-frontmatter__trigger",
      );
      expect(element).not.toBeNull();
      return element!;
    });
    expectCardBackground(properties);
    expectCardBackground(properties.closest<HTMLElement>(".mira-rich-widget")!);
    const heading = properties
      .closest<HTMLElement>(".mira-rich-widget")!
      .querySelector<HTMLElement>("h1");
    expect(heading).not.toBeNull();
    expectCardBackground(heading!);
    await userEvent.click(properties);
    await waitFor(() =>
      expect(
        body.getByRole("button", { name: "Collapse properties" }),
      ).toBeVisible(),
    );
    expectCardBackground(properties.closest<HTMLElement>(".md-frontmatter")!);
    await userEvent.click(body.getByRole("button", { name: /Back ESC/ }));
  },
};

function referenceStory(scenario: BasesViewScenario, title: string): Story {
  return {
    parameters: storyParameters(
      scenario,
      "Markdown-backed reference data with configurable phase and title metadata; no status field is required.",
    ),
    render: renderScenario(scenario),
    play: async ({ canvasElement }) => {
      const canvas = await waitForView(canvasElement, scenario, "kanban");
      await waitFor(
        () =>
          expect(
            canvas.getByRole("button", { name: "16 results" }),
          ).toBeVisible(),
        { timeout: 15_000 },
      );
      if (scenario === "kanban-tasks") {
        const collapsed = canvas.queryByRole("button", {
          name: /Expand .*Doing/,
        });
        if (collapsed) await userEvent.click(collapsed);
      }
      await waitFor(
        () =>
          expect(
            canvas.getAllByRole("button", {
              name: new RegExp("Open card: " + title),
            })[0],
          ).toBeVisible(),
        { timeout: 15_000 },
      );
      expect(demoDocument(canvasElement).views[0].groupBy?.property).toBe(
        "note.phase",
      );
      const card = canvas.getAllByRole("button", {
        name: new RegExp("Open card: " + title),
      })[0]!;
      await waitFor(() =>
        expect(
          card.querySelector(".kanban-card__summary")?.textContent?.length ?? 0,
        ).toBeGreaterThan(20),
      );
      await userEvent.click(card);
      const page = within(canvasElement.ownerDocument.body);
      await waitFor(() =>
        expect(page.getByRole("button", { name: /^Edit$/ })).toBeVisible(),
      );
      const previewSurface =
        canvasElement.ownerDocument.querySelector<HTMLElement>(
          '[data-ui-part="markdown-detail"] .mira-markdown-preview',
        )!;
      expect(previewSurface).not.toBeNull();
      const properties =
        previewSurface.querySelector<HTMLElement>(".md-frontmatter")!;
      expect(properties).not.toBeNull();
      let painted: HTMLElement | null = properties;
      while (
        painted &&
        getComputedStyle(painted).backgroundColor === "rgba(0, 0, 0, 0)"
      )
        painted = painted.parentElement;
      expect(painted).not.toBeNull();
      expect(getComputedStyle(painted!).backgroundColor).toBe(
        getComputedStyle(
          previewSurface.closest<HTMLElement>(".detail-main-card")!,
        ).backgroundColor,
      );

      expect(getComputedStyle(previewSurface).backgroundColor).toBe(
        getComputedStyle(
          previewSurface.closest<HTMLElement>(".detail-main-card")!,
        ).backgroundColor,
      );
      await userEvent.click(page.getByRole("button", { name: /^Edit$/ }));
      const editor = await waitFor(
        () => {
          const element =
            canvasElement.ownerDocument.querySelector<HTMLElement>(
              '[data-ui-part="markdown-detail"] .cm-content[contenteditable="true"]',
            );
          expect(element).not.toBeNull();
          return element!;
        },
        { timeout: 15_000 },
      );
      const editorRoot = editor.closest<HTMLElement>(".cm-editor")!;
      const cardRoot = editor.closest<HTMLElement>(".detail-main-card")!;
      for (const widget of editorRoot.querySelectorAll<HTMLElement>(
        ".mira-rich-widget",
      ))
        expectCardBackground(widget);
      expect(getComputedStyle(editorRoot).backgroundColor).toBe(
        getComputedStyle(cardRoot).backgroundColor,
      );
      await expect(
        within(editorRoot).getByRole("button", { name: "Expand properties" }),
      ).toBeVisible();
      await userEvent.click(editor);
      await userEvent.keyboard("{Control>}{End}{/Control}");
      await userEvent.type(editor, " Verified during board review.");
      await userEvent.click(page.getByRole("button", { name: /Back ESC/ }));
      const filePath =
        scenario === "kanban-roles"
          ? "Roles/Atlas.md"
          : scenario === "kanban-notes"
            ? "Research/Fieldwork.md"
            : "Tasks/Review.md";
      const app = demoApp(canvasElement);
      await waitFor(async () =>
        expect(
          await app.vault.read(app.vault.getFileByPath(filePath)!),
        ).toContain("Verified during board review."),
      );
      await expect(page.queryByRole("dialog")).toBeNull();
      await userEvent.click(
        canvas.getByRole("button", { name: new RegExp("Open card: " + title) }),
      );
      await userEvent.click(
        page.getByRole("button", {
          name: new RegExp("Edit card title: " + title),
        }),
      );
      const titleInput = page.getByRole("textbox", { name: "Card title" });
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, title + " — reviewed");
      await userEvent.keyboard("{Enter}");
      await waitFor(async () =>
        expect(
          await app.vault.read(app.vault.getFileByPath(filePath)!),
        ).toContain(title + " — reviewed"),
      );
      if (scenario === "kanban-tasks") {
        const detail = page.getByRole("dialog");
        const detailCard =
          detail.querySelector<HTMLElement>(".detail-main-card")!;
        const originalColour = getComputedStyle(detailCard).backgroundColor;
        await userEvent.click(
          within(detail).getByRole("button", { name: /^Ready$/ }),
        );
        await waitFor(async () =>
          expect(
            await app.vault.read(app.vault.getFileByPath(filePath)!),
          ).toMatch(/phase:\s*"?Ready"?/),
        );
        await waitFor(() => {
          expect(detail).toBeVisible();
          expect(
            within(detail).getByRole("button", { name: /^Ready$/ }),
          ).toBeDisabled();
          expect(getComputedStyle(detailCard).backgroundColor).not.toBe(
            originalColour,
          );
          const preview = detail.querySelector<HTMLElement>(
            ".mira-markdown-preview",
          )!;
          expect(getComputedStyle(preview).backgroundColor).toBe(
            getComputedStyle(detailCard).backgroundColor,
          );
        });
      }
      await userEvent.click(page.getByRole("button", { name: /Back ESC/ }));
      if (scenario === "kanban-tasks") {
        const collapsed = canvas.queryByRole("button", {
          name: /Expand .*Ready/,
        });
        if (collapsed) await userEvent.click(collapsed);
      }
      await waitFor(() =>
        expect(
          canvas.getByRole("button", {
            name: new RegExp("Open card: " + title + " — reviewed"),
          }),
        ).toBeVisible(),
      );
    },
  };
}
export const Roles = referenceStory(
  "kanban-roles",
  "Engineering Manager, Infrastructure",
);
export const Notes = referenceStory("kanban-notes", "Field observations");
export const Tasks = referenceStory("kanban-tasks", "Review the release notes");

export const Scroll: Story = {
  name: "Horizontal and vertical scrolling",
  parameters: storyParameters(
    "kanban-scroll",
    "A bounded board with 24 consumer-derived groups and 16 Markdown files per group demonstrates horizontal board scrolling and vertical lane scrolling.",
  ),
  render: renderScenario("kanban-scroll"),
  play: async ({ canvasElement }) => {
    await waitForView(canvasElement, "kanban-scroll", "kanban");
    await waitFor(
      () =>
        expect(
          canvasElement.querySelectorAll('[data-ui-component="kanban-column"]')
            .length,
        ).toBe(24),
      { timeout: 20_000 },
    );
    let horizontal: HTMLElement | undefined;
    let vertical: HTMLElement | undefined;
    await waitFor(
      () => {
        const viewports = [
          ...canvasElement.querySelectorAll<HTMLElement>(
            '[data-ui-part="scroll-area-viewport"]',
          ),
        ];
        horizontal = viewports.find(
          (element) => element.scrollWidth > element.clientWidth + 5,
        );
        vertical = viewports.find(
          (element) =>
            element.closest(".column-stack-scroll") &&
            element.scrollHeight > element.clientHeight + 5,
        );
        expect(horizontal).toBeDefined();
        expect(vertical).toBeDefined();
      },
      { timeout: 15_000 },
    );
    horizontal!.scrollLeft = 180;
    fireEvent.scroll(horizontal!);
    vertical!.scrollTop = 280;
    fireEvent.scroll(vertical!);
    expect(horizontal!.scrollLeft).toBeGreaterThan(0);
    expect(vertical!.scrollTop).toBeGreaterThan(0);
    horizontal!.scrollLeft = 0;
    vertical!.scrollTop = 0;
  },
};

export const Activity: Story = {
  parameters: storyParameters(
    "activity",
    "Activity groups Markdown records by the first date field, with shared cards and inline file details.",
  ),
  render: renderScenario("activity"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "activity", "activity");
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-ui-component="kanban-activity"]'),
      ).not.toBeNull(),
    );
    await expect(
      canvas.getByRole("heading", { name: "Undated" }),
    ).toBeVisible();
    const firstDay = canvasElement.querySelector<HTMLElement>(
      ".kanban-activity__day",
    )!;
    const header = firstDay.querySelector<HTMLElement>(
      ".kanban-activity__column > h3",
    )!;
    expect(getComputedStyle(header).position).toBe("sticky");
    expect(header.querySelector("time")?.getAttribute("datetime")).toMatch(
      /^2026-/,
    );
    const viewport = firstDay
      .closest(".kanban-activity")!
      .querySelector<HTMLElement>('[data-ui-part="scroll-area-viewport"]')!;
    const headers = firstDay.querySelectorAll<HTMLElement>(
      ".kanban-activity__column > h3",
    );
    viewport.scrollTop = 120;
    await fireEvent.scroll(viewport);
    await waitFor(() => {
      expect(viewport.scrollTop).toBe(120);
      for (const heading of headers) {
        const style = getComputedStyle(heading);
        expect(style.borderBlockStartWidth).toBe("1px");
        expect(style.borderBlockStartStyle).toBe("solid");
        expect(style.borderBlockStartColor).toBe(style.borderBlockEndColor);
        expect(
          Math.abs(
            heading.getBoundingClientRect().top -
              viewport.getBoundingClientRect().top,
          ),
        ).toBeLessThan(2);
      }
    });
    viewport.scrollTop = 0;
    await fireEvent.scroll(viewport);
    const card = canvas.getByRole("button", {
      name: /Open card: Field observations/,
    });
    await userEvent.click(card);
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() =>
      expect(
        body.getByRole("button", { name: "Edit Fieldwork.md" }),
      ).toBeVisible(),
    );
    await userEvent.click(body.getByRole("button", { name: /Back ESC/ }));
  },
};

const notesPlay = Notes.play!;
Notes.play = async (context) => {
  await notesPlay(context);
  const { canvasElement } = context;
  const canvas = within(canvasElement);
  const page = within(canvasElement.ownerDocument.body);
  const document = demoDocument(canvasElement);
  const view = document.views[0]!;
  const collect = canvas
    .getByRole("heading", { name: /^Collect$/ })
    .closest<HTMLElement>(".kanban-column")!;
  const groupId = collect
    .getAttribute("aria-labelledby")!
    .replace(/-title$/, "");
  const originalCount = collect.querySelectorAll(
    '[data-ui-component="kanban-card"]',
  ).length;
  expect(originalCount).toBeGreaterThan(0);
  view.columnFilters = {
    [groupId]: {
      and: [
        { column: "note.owner", op: "=", value: "Nobody matches this column" },
      ],
    },
  };
  await waitFor(() =>
    expect(within(collect).getByText("No cards")).toBeVisible(),
  );
  await expect(
    within(collect).getByLabelText(`0 of ${originalCount} cards`),
  ).toBeVisible();
  expect(document.filters).toEqual({ and: [] });
  expect(view.filter).toEqual({ and: [] });
  expect(
    canvasElement.querySelectorAll('[data-ui-component="kanban-card"]').length,
  ).toBeGreaterThan(0);
  await userEvent.click(
    canvas.getByRole("button", { name: "Filter Collect column" }),
  );
  await waitFor(() =>
    expect(page.getByText("Filter cards in Collect")).toBeVisible(),
  );
  await userEvent.keyboard("{Escape}");
  view.columnFilters = {};
  await waitFor(() =>
    expect(
      within(collect).getByRole("button", {
        name: /Open card: Field observations/,
      }),
    ).toBeVisible(),
  );
  await userEvent.click(
    canvas.getByRole("button", { name: /^Markdown board$/ }),
  );
  await userEvent.click(
    page.getByRole("button", { name: "Edit current view" }),
  );
  expect(canvasElement.querySelector(".bases-kanban-settings")).toBeNull();
  await waitFor(() =>
    expect(page.getByText("Title property", { exact: true })).toBeVisible(),
  );
  const propertyLabel = page.getByText("Title property", { exact: true });
  expect(getComputedStyle(propertyLabel).opacity).toBe("1");
  const settingsViewport = page.getByRole("group", { name: "View settings" });
  const editor = settingsViewport.closest<HTMLElement>(
    '[data-ui-component="bases-view-editor"]',
  )!;
  const header = within(editor).getByRole("button", {
    name: /^Edit Markdown board/,
  });
  const headerTop = header.getBoundingClientRect().top;
  expect(editor.getBoundingClientRect().height).toBeLessThanOrEqual(577);
  expect(settingsViewport.tabIndex).toBe(0);
  expect(settingsViewport.scrollHeight).toBeGreaterThan(
    settingsViewport.clientHeight,
  );
  const rows = [
    "Layout",
    "Group by",
    "Always-open column",
    "Title property",
    "Card chip property",
  ].map((name) => ({
    label: page.getByText(name, { exact: true }).getBoundingClientRect(),
    control: page
      .getByRole("combobox", { name, exact: true })
      .getBoundingClientRect(),
  }));
  for (const [index, row] of rows.entries()) {
    expect(row.control.top - row.label.bottom).toBeCloseTo(8, 0);
    if (index)
      expect(row.label.top - rows[index - 1]!.control.bottom).toBeCloseTo(
        16,
        0,
      );
  }
  settingsViewport.scrollTop = settingsViewport.scrollHeight;
  await fireEvent.scroll(settingsViewport);
  await waitFor(() => {
    expect(settingsViewport.scrollTop).toBeGreaterThan(0);
    expect(header.getBoundingClientRect().top).toBeCloseTo(headerTop, 0);
    const lastControl = page.getByLabelText("Badge colour color value");
    expect(lastControl.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      settingsViewport.getBoundingClientRect().bottom,
    );
  });
  settingsViewport.scrollTop = 0;
  await fireEvent.scroll(settingsViewport);
  const propertyControls = [
    ...page
      .getAllByRole("combobox")
      .filter((element) => element.closest(".bases-view-settings")),
    page.getByLabelText("Title property"),
  ];
  for (const control of propertyControls) {
    const style = getComputedStyle(control);
    expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
    expect(style.borderTopStyle).toBe("solid");
    expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThan(0);
  }
  await userEvent.click(
    page.getByRole("combobox", { name: "Card chip property" }),
  );
  const fileReference = page.getByRole("option", {
    name: "file reference file.file",
    exact: true,
  });
  const propertyId = within(fileReference).getByText("file.file", {
    exact: true,
  });
  expect(getComputedStyle(propertyId).fontFamily).toBe(
    getComputedStyle(fileReference).fontFamily,
  );
  expect(getComputedStyle(propertyId).letterSpacing).toBe(
    getComputedStyle(fileReference).letterSpacing,
  );
  await userEvent.type(
    page.getByRole("combobox", { name: "Find property" }),
    "Owner",
  );
  await userEvent.click(page.getByRole("option", { name: /Owner/ }));
  await waitFor(() => expect(view.chipProperty).toBe("note.owner"));
  await userEvent.click(
    page.getByRole("button", { name: "Clear card chip property" }),
  );
  await waitFor(() => expect(view.chipProperty).toBe(""));
  expect(
    page.getByRole("combobox", { name: "Card chip property" }),
  ).toHaveTextContent("Title");
  const nativeColour = page.getByLabelText("Badge colour color picker");
  await fireEvent.input(nativeColour, { target: { value: "#6d28d9" } });
  await waitFor(() => expect(view.badgeColor).toBe("#6d28d9"));
  await userEvent.click(
    page.getByRole("combobox", { name: "Always-open column" }),
  );
  await userEvent.click(page.getByRole("option", { name: /^None$/ }));
  await waitFor(() => expect(view.anchorColumnId).toBeNull());
  await waitFor(() =>
    expect(page.queryByRole("option", { name: /^None$/ })).toBeNull(),
  );
  await userEvent.keyboard("{Escape}");
  await waitFor(() =>
    expect(page.queryByText("Title property", { exact: true })).toBeNull(),
  );
  await expect(
    within(collect).getByRole("button", { name: /Collapse .*Collect/ }),
  ).toBeEnabled();
  await userEvent.click(
    canvas.getByRole("button", { name: /^Markdown board$/ }),
  );
  await waitFor(() =>
    expect(page.getByRole("combobox", { name: "Group by" })).toBeVisible(),
  );
  await userEvent.click(page.getByRole("combobox", { name: "Group by" }));
  await userEvent.type(
    page.getByRole("combobox", { name: "Find property" }),
    "Owner",
  );
  await userEvent.click(page.getByRole("option", { name: /Owner/ }));
  await waitFor(() => expect(view.groupBy?.property).toBe("note.owner"));
  await waitFor(() =>
    expect(page.queryByRole("option", { name: /Owner/ })).toBeNull(),
  );
  await userEvent.keyboard("{Escape}");
  await waitFor(() =>
    expect(page.queryByText("Title property", { exact: true })).toBeNull(),
  );
  await waitFor(
    () => {
      expect(
        canvas.queryByRole("heading", { name: /^Maya Chen$/ }) ??
          canvas.getByRole("button", { name: /Expand .*Maya Chen/ }),
      ).toBeVisible();
    },
    { timeout: 15_000 },
  );
  const collapsedOwner = canvas.queryByRole("button", {
    name: /Expand .*Maya Chen/,
  });
  if (collapsedOwner) await userEvent.click(collapsedOwner);
  await expect(
    canvas.getByRole("heading", { name: /^Maya Chen$/ }),
  ).toBeVisible();
};
