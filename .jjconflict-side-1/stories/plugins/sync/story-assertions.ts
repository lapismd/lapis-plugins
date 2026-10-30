import { expect, userEvent, waitFor, within } from "storybook/test";
import type { App } from "@lapis-notes/api";
import { SyncPlugin, type SyncPaneKind } from "@lapis-notes/lapis-plugin-sync";
import type { PreviewSyncRuntime } from "./preview-runtime";
import type { SyncPlacement } from "./workspace-layout";
export function syncStoryOwner(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<
    HTMLElement & {
      __lapisApp?: App;
      __syncPlugin?: SyncPlugin;
      __syncRuntime?: PreviewSyncRuntime | null;
    }
  >('[data-testid="sync-workspace-demo"]');
  if (!root?.__lapisApp || !root.__syncPlugin)
    throw new Error("Missing owned Sync App.");
  return {
    app: root.__lapisApp,
    plugin: root.__syncPlugin,
    runtime: root.__syncRuntime ?? null,
    root,
  };
}
export async function expectSyncReady(canvasElement: HTMLElement) {
  await waitFor(
    () => {
      expect(
        canvasElement.querySelector('[data-testid="sync-workspace-demo"]'),
      ).toHaveAttribute("data-status", "ready");
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull();
    },
    { timeout: 30_000 },
  );
  const owner = syncStoryOwner(canvasElement);
  expect(owner.plugin).toBeInstanceOf(SyncPlugin);
  return owner;
}
export async function expectSyncPlacement(
  canvasElement: HTMLElement,
  kind: SyncPaneKind,
  placement: SyncPlacement,
) {
  const owner = await expectSyncReady(canvasElement);
  const panels = canvasElement.querySelectorAll<HTMLElement>(
    `[data-sync-pane="${kind}"]`,
  );
  expect(panels).toHaveLength(1);
  const panel = panels[0]!;
  const expectedHost = {
    "middle-top-tabs": "workspace-tabs",
    "stacked-tabs": "workspace-stacked-tabs",
    "left-sidebar": "workspace-sidebar",
    "right-sidebar": "workspace-sidebar",
    "bottom-panel": "workspace-bottom-panel-group",
    "sidebar-group": "workspace-sidebar-group",
  }[placement];
  expect(panel.closest(`[data-ui-component="${expectedHost}"]`)).not.toBeNull();
  const host = panel.closest<HTMLElement>(
    '[data-ui-component="workspace-view-host"]',
  );
  expect(host).not.toBeNull();
  expect(
    canvasElement.querySelector('[data-workspace-view-type="markdown"]'),
  ).toBeNull();
  const box = panel.getBoundingClientRect(),
    hostBox = host!.getBoundingClientRect();
  expect(Math.abs(box.width - hostBox.width)).toBeLessThan(1);
  expect(Math.abs(box.height - hostBox.height)).toBeLessThan(1);
  const directSidebar =
    placement === "left-sidebar" || placement === "right-sidebar";
  const paint = directSidebar
    ? panel.closest<HTMLElement>("[data-workspace-surface]")
    : canvasElement.querySelector<HTMLElement>(
        '[data-workspace-surface="body"]',
      );
  expect(paint).not.toBeNull();
  expect(getComputedStyle(host!).backgroundColor).toBe(
    getComputedStyle(paint!).backgroundColor,
  );
  if (placement === "bottom-panel" || placement === "sidebar-group")
    expect(
      panel
        .closest(`[data-ui-component="${expectedHost}"]`)
        ?.querySelector('button[data-ui-part="panel-header"]'),
    ).toHaveAttribute("aria-expanded", "true");
  return { ...owner, panel, canvas: within(panel) };
}
export async function exerciseSyncPane(
  canvasElement: HTMLElement,
  kind: SyncPaneKind,
  placement: SyncPlacement,
) {
  const owner = await expectSyncPlacement(canvasElement, kind, placement);
  if (kind === "sync") {
    expect(
      owner.canvas.getByRole("region", { name: "Pending changes" }),
    ).toBeVisible();
    await userEvent.click(
      owner.canvas.getByRole("button", { name: "Create Checkpoint" }),
    );
    await waitFor(() =>
      expect(owner.runtime?.calls.some((a) => a.type === "checkpoint")).toBe(
        true,
      ),
    );
    expect(owner.plugin.session.snapshot().revisions[0]?.message).toBe(
      "History checkpoint",
    );
  } else {
    const button = owner.canvas
      .getAllByRole("button")
      .find((b) => b.hasAttribute("data-revision-id"));
    if (!button) throw new Error("No revision row was rendered.");
    await userEvent.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true"),
    );
    const files = owner.canvas.getByTestId("sync-changed-files");
    const file = within(files).getByRole("button", { name: /README\.md/ });
    if (kind === "history") await userEvent.click(file);
    await waitFor(() =>
      expect(owner.canvas.getByTestId("sync-file-diff")).toBeVisible(),
    );
    const toolbar = owner.canvas.getByTestId("sync-compare-toolbar");
    const header = owner.canvas.getByTestId("sync-diff-header");
    expect(header).toContainElement(toolbar);
    expect(owner.canvas.getByTestId("sync-file-diff")).not.toContainElement(
      toolbar,
    );
    const sections = Array.from(header.children) as HTMLElement[];
    expect(sections).toHaveLength(3);
    expect(sections[0]).toHaveTextContent("README.md");
    expect(sections[1]).toContainElement(toolbar);
    expect(
      within(sections[2]!).getByRole("button", {
        name: "Close README.md column",
      }),
    ).toBeVisible();
    expect(getComputedStyle(header).justifyContent).toBe("space-between");
    expect(getComputedStyle(header).flexWrap).toBe("wrap");
    const headerBox = header.getBoundingClientRect();
    for (const section of sections) {
      const box = section.getBoundingClientRect();
      expect(box.left).toBeGreaterThanOrEqual(headerBox.left);
      expect(box.right).toBeLessThanOrEqual(headerBox.right + 1);
    }
    await userEvent.click(
      owner.canvas.getByRole("button", { name: "Unified diff" }),
    );
    expect(
      owner.canvas.getByRole("button", { name: "Split diff" }),
    ).toBeVisible();
    await userEvent.click(
      owner.canvas.getByRole("button", { name: "Wrap text" }),
    );
    expect(
      owner.canvas.getByRole("button", { name: "Wrap text" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(button);
    await waitFor(() =>
      expect(owner.canvas.queryByTestId("sync-changed-files")).toBeNull(),
    );
    expect(owner.canvas.queryByTestId("sync-file-diff")).toBeNull();
  }
  const count = owner.app.workspace.getLeavesOfType(
    kind === "sync" ? "sync" : `sync-${kind}`,
  ).length;
  await owner.plugin.openPane(kind);
  expect(
    owner.app.workspace.getLeavesOfType(
      kind === "sync" ? "sync" : `sync-${kind}`,
    ),
  ).toHaveLength(count);
}
