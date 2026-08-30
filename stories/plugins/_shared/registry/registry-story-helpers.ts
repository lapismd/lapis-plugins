import type { App, Editor } from "@lapis-notes/api";
import { refreshLanguageServiceDiagnostics } from "@lapis-notes/api/editor/language-service";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { MarkdownView } from "@lapis-notes/markdown";
import { expect, waitFor, within } from "storybook/test";

type MarkdownMode = "live-preview" | "source" | "preview";

interface RegistryFileOptions {
  mode?: MarkdownMode;
}

export async function registryPanelApp(canvasElement: HTMLElement): Promise<App> {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("panel-demo-status")).toHaveTextContent("ready");
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull();
    },
    { timeout: 20_000 },
  );
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="panel-demo"]',
  );
  if (!root?.__lapisApp) throw new Error("Registry story has no active Lapis app");
  return root.__lapisApp;
}

export async function openRegistryFile(
  canvasElement: HTMLElement,
  path: string,
  options: RegistryFileOptions = {},
): Promise<{ app: App; editor?: Editor }> {
  const app = await registryPanelApp(canvasElement);
  const file = app.vault.getFileByPath(path);
  if (!file) throw new Error(`Registry fixture is missing ${path}`);
  const leaf = app.workspace.getLeaf(false);
  await leaf.openFile(file);
  app.workspace.setActiveLeaf(leaf, { focus: false });
  await app.workspace.revealLeaf(leaf);
  if (options.mode !== undefined) {
    if (!(leaf.view instanceof MarkdownView)) {
      throw new Error(`Registry fixture ${path} did not open as Markdown`);
    }
    await leaf.view.setState({ ...leaf.view.getState(), mode: options.mode });
  }
  await waitFor(() => {
    expect(app.workspace.getActiveFile()?.path).toBe(path);
  });
  return {
    app,
    editor: (leaf.view as { editor?: Editor }).editor,
  };
}

export async function showRegistryProblems(
  canvasElement: HTMLElement,
  path: string,
): Promise<void> {
  const { app, editor } = await openRegistryFile(canvasElement, path, {
    mode: "source",
  });
  if (!editor) throw new Error(`Registry fixture ${path} has no active editor`);
  await refreshLanguageServiceDiagnostics(editor.view, {
    languageId: "markdown",
  });
  await getWorkspaceHostBinding(
    app.workspace,
  ).controller.commands.execute("app-shell:show-problems");
  await waitFor(
    () => {
      expect(
        canvasElement.querySelector('[data-ui-component="workspace-problems"]'),
      ).not.toBeNull();
    },
    { timeout: 12_000 },
  );
}

export async function waitForRegistrySurface(
  canvasElement: HTMLElement,
  selector: string,
): Promise<void> {
  await waitFor(
    () => {
      expect(canvasElement.querySelector(selector)).not.toBeNull();
    },
    { timeout: 20_000 },
  );
}
