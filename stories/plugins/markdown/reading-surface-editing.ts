import type { Editor } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { openSearchPanel } from "@codemirror/search";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  openRegistryFile,
  registryPanelApp,
} from "../_shared/registry/registry-story-helpers";

async function editingNote(
  canvasElement: HTMLElement,
  mode: "live-preview" | "source"
) {
  const app = await registryPanelApp(canvasElement);
  const path = "Notes/Reading-surface.md";
  await app.vault.create(
    path,
    "# Short note\n\nThe reading surface fills its pane.\n"
  );
  const opened = await openRegistryFile(canvasElement, path, { mode });
  if (!opened.editor) throw new Error("Missing Markdown editor");
  return { app, editor: opened.editor };
}

async function assertTitleAligned(editor: Editor) {
  await waitFor(() => {
    const title = editor.view.dom
      .closest(".cm-sizer")!
      .querySelector<HTMLElement>(".cm-editor-inline-title")!;
    expect(title).not.toBeNull();
    const titleStart =
      title.getBoundingClientRect().left +
      parseFloat(getComputedStyle(title).paddingLeft);
    const contentStart = editor.view.contentDOM.getBoundingClientRect().left;
    expect(Math.abs(titleStart - contentStart)).toBeLessThanOrEqual(1);
    expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth + 1);
  });
}

export async function verifyEditingAlignment(
  canvasElement: HTMLElement,
  mode: "live-preview" | "source"
) {
  const { app, editor } = await editingNote(canvasElement, mode);
  const initial = app.configuration
    .getConfiguration()
    .get("editor.display.showLineNumbers");
  try {
    await assertTitleAligned(editor);
    await app.configuration.updateConfigurationOption(
      "editor.display.showLineNumbers",
      false
    );
    await assertTitleAligned(editor);
    await app.configuration.updateConfigurationOption(
      "editor.display.showLineNumbers",
      true
    );
    for (const count of [9, 1000, 4]) {
      editor.view.dispatch({
        changes: {
          from: 0,
          to: editor.view.state.doc.length,
          insert: Array.from({ length: count }, (_, i) => `Line ${i + 1}`).join(
            "\n"
          ),
        },
      });
      await assertTitleAligned(editor);
    }
    const title = editor.view.dom
      .closest(".cm-sizer")!
      .querySelector<HTMLElement>(".cm-editor-inline-title")!;
    await app.fileEditingSessions.guard(editor.file!.path, async () => {
      expect(title).toHaveAttribute("contenteditable", "false");
    });
    expect(title).toHaveAttribute("contenteditable", "true");
    await userEvent.click(title);
    await userEvent.clear(title);
    await userEvent.type(title, "Aligned{Enter}");
    await waitFor(() => expect(editor.file?.name).toBe("Aligned.md"));
    await assertTitleAligned(editor);

    // A second, independently configured source editor also exercises real
    // fold gutters and resizing through the workspace's owning split.
    const secondFile = await app.vault.create(
      "Notes/Alignment.yaml",
      `items:\n${Array.from({ length: 1000 }, (_, i) => `  - item-${i}`).join(
        "\n"
      )}`
    );
    const secondLeaf = app.workspace.getLeaf("split");
    await secondLeaf.openFile(secondFile);
    const secondEditor = (secondLeaf.view as { editor: Editor }).editor;
    expect(secondEditor).toBeDefined();
    const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
    const layout = renderer.getLayout();
    if (layout.main.kind !== "split") throw new Error("Expected editor split");
    const originalSizes = [...layout.main.sizes];
    try {
      expect(renderer.setSplitSizes(layout.main.id, [25, 75])).toBe(true);
      await assertTitleAligned(editor);
      await assertTitleAligned(secondEditor);
      expect(
        secondEditor.view.dom.querySelector(".cm-foldGutter")
      ).not.toBeNull();
      await app.configuration.updateConfigurationOption(
        "editor.display.showLineNumbers",
        false
      );
      await assertTitleAligned(editor);
      await assertTitleAligned(secondEditor);
    } finally {
      renderer.setSplitSizes(layout.main.id, originalSizes);
      secondLeaf.detach();
    }
  } finally {
    await app.configuration.updateConfigurationOption(
      "editor.display.showLineNumbers",
      initial
    );
  }
}

export async function verifySearchUnderSettings(canvasElement: HTMLElement) {
  const { editor } = await editingNote(canvasElement, "live-preview");
  const canvas = within(canvasElement);
  openSearchPanel(editor.view);
  const find = await canvas.findByRole("textbox", {
    name: "Find",
    exact: true,
  });
  await userEvent.type(find, "surface");
  await userEvent.click(canvas.getByRole("button", { name: "Toggle replace" }));
  const replace = canvas.getByRole("textbox", { name: "Replace", exact: true });
  await userEvent.type(replace, "column");
  await userEvent.click(
    canvas.getByRole("button", { name: "Settings", exact: true })
  );
  const dialog = await canvas.findByRole("dialog", {
    name: "Settings",
    exact: true,
  });
  await waitFor(() => {
    // Inert backgrounds already suppress hit testing even when painted above
    // Settings. Require actual editor containment as well as modal hit/focus.
    expect(getComputedStyle(editor.view.dom).isolation).toBe("isolate");
    expect(dialog.contains(canvasElement.ownerDocument.activeElement)).toBe(
      true
    );
    const bounds = dialog.getBoundingClientRect();
    const top = canvasElement.ownerDocument.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2
    );
    expect(dialog.contains(top)).toBe(true);
  });
  await userEvent.keyboard("{Tab}");
  expect(dialog.contains(canvasElement.ownerDocument.activeElement)).toBe(true);
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Close settings" })
  );
  expect(find).toHaveValue("surface");
  expect(replace).toHaveValue("column");
  await userEvent.click(canvas.getByRole("button", { name: "Next match" }));
  await userEvent.click(canvas.getByRole("button", { name: "Close search" }));
  await expect(
    canvas.queryByRole("textbox", { name: "Find", exact: true })
  ).toBeNull();
}
