import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { FileProperties } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelDemoApp } from "../../_shared/panels/panel-story-helpers";

type Story = StoryObj<Meta<typeof FileProperties>>;

const render = (() => ({
  Component: PanelDemo,
  props: {
    kind: "file-properties",
    layout: "middle-top-tabs",
    hideSidebars: true,
    diagnostics: "none",
  },
})) as NonNullable<Story["render"]>;

async function prepare(canvasElement: HTMLElement) {
  const panel = await within(canvasElement).findByTestId(
    "file-properties-panel"
  );
  const status = within(panel).getByRole("combobox", { name: "status value" });
  await waitFor(() => expect(status).toHaveTextContent("ready"));
  const app = panelDemoApp(canvasElement);
  const file = app.vault.getFileByPath("Notes/Welcome.md");
  if (!file) throw new Error("Missing Properties fixture note");
  const adapter = app.vault.adapter;
  Object.assign(adapter, {
    getCapabilities: () => ({ conditionalTextWrite: true }),
    async writeTextIfUnchanged(
      path: string,
      text: string,
      expected: string | null
    ) {
      const current = (await adapter.exists(path))
        ? await adapter.read(path)
        : null;
      if (current !== expected)
        throw Object.assign(new Error("File changed"), { code: "ECONFLICT" });
      await adapter.write(path, text);
    },
  });
  const original = await app.vault.read(file);
  await userEvent.click(status);
  await userEvent.clear(status);
  await userEvent.type(status, "local");
  expect(status).toHaveTextContent("local");
  return { app, file, status, original };
}

const staleStory: Story = {
  tags: ["visual-pending", "!autodocs", "test"],
  render,
  parameters: {
    docs: {
      description: {
        story:
          "A focused Properties draft survives a newer saved record, refuses its stale replacement, appears in Problems, and explicitly recovers without erasing the external owner key.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const { app, file, status, original } = await prepare(canvasElement);
    const external = original.replace(
      "status: ready",
      "status: external\nowner: outside"
    );
    expect(external).not.toBe(original);
    await app.vault.modify(file, external);
    await waitFor(() =>
      expect(app.metadataCache.getCache(file.path)?.frontmatter).toMatchObject({
        status: "external",
        owner: "outside",
      })
    );
    expect(status).toHaveTextContent("local");
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(1)
    );
    expect(await app.vault.read(file)).toBe(external);
    const conflict = app.fileEditingSessions.textConflicts.entries[0];
    expect(conflict.local).toContain("status: local");
    await getWorkspaceHostBinding(app.workspace).controller.commands.execute(
      "app-shell:show-problems"
    );
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-ui-component="workspace-problems"]')
      ).not.toBeNull()
    );

    await conflict.resolve("use-external");
    await waitFor(() => expect(status).toHaveTextContent("external"));
    expect(await app.vault.read(file)).toBe(external);
    await userEvent.click(status);
    await userEvent.clear(status);
    await userEvent.type(status, "after recovery");
    await userEvent.keyboard("{Enter}");
    await app.fileEditingSessions.settleOperations();
    await app.fileEditingSessions.guard(undefined, async () => {});
    expect(await app.vault.read(file)).toContain("status: after recovery");
    expect(await app.vault.read(file)).toContain("owner: outside");
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
  },
};

const bodyStory: Story = {
  tags: ["visual-pending", "!autodocs", "test"],
  render,
  parameters: {
    docs: {
      description: {
        story:
          "A separate body-only edit remains compatible with a focused Properties edit; the existing guarded writer preserves both changes without a conflict.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const { app, file, status, original } = await prepare(canvasElement);
    const changed = `${original}\nA separately saved body change.\n`;
    await app.vault.modify(file, changed);
    expect(status).toHaveTextContent("local");
    await userEvent.keyboard("{Enter}");
    await app.fileEditingSessions.settleOperations();
    await app.fileEditingSessions.guard(undefined, async () => {});
    const saved = await app.vault.read(file);
    expect(saved).toContain("status: local");
    expect(saved).toContain("A separately saved body change.");
    expect(app.fileEditingSessions.textConflicts.entries).toHaveLength(0);
  },
};

export function propertiesPersistenceStory(scenario: "stale" | "body"): Story {
  return scenario === "stale" ? staleStory : bodyStory;
}
