import type { App, Editor } from "@lapis-notes/api";
import { refreshLanguageServiceDiagnostics } from "@lapis-notes/api/editor/language-service";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { MarkdownView } from "@lapis-notes/markdown";
import {
  forEachDiagnostic,
  setDiagnostics,
  type Diagnostic,
} from "@codemirror/lint";
import { expect, waitFor, within } from "storybook/test";

type MarkdownMode = "live-preview" | "source" | "preview";

interface RegistryFileOptions {
  mode?: MarkdownMode;
}

export async function registryPanelApp(
  canvasElement: HTMLElement,
): Promise<App> {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("panel-demo-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvasElement.querySelector('[data-app-shell-ready="true"]'),
      ).not.toBeNull();
    },
    { timeout: 20_000 },
  );
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="panel-demo"]',
  );
  if (!root?.__lapisApp)
    throw new Error("Registry story has no active Lapis app");
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
  source: string,
): Promise<void> {
  const { app } = await showRegistryDiagnostics(canvasElement, path, source);
  await getWorkspaceHostBinding(app.workspace).controller.commands.execute(
    "app-shell:show-problems",
  );
  await waitFor(
    () => {
      expect(
        canvasElement.querySelector('[data-ui-component="workspace-problems"]'),
      ).not.toBeNull();
      expect(
        canvasElement.querySelectorAll(".ui-workspace-problems__entry").length,
      ).toBeGreaterThan(0);
    },
    { timeout: 12_000 },
  );
}

export async function showRegistryDiagnostics(
  canvasElement: HTMLElement,
  path: string,
  source: string,
): Promise<{ app: App; editor: Editor }> {
  const { app, editor } = await openRegistryFile(canvasElement, path, {
    mode: "source",
  });
  if (!editor) throw new Error(`Registry fixture ${path} has no active editor`);
  // Some providers, including Harper, finish warming after plugin load. Re-run
  // the real diagnostics request until that provider is ready rather than
  // accepting an unrelated provider's earlier result.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await refreshLanguageServiceDiagnostics(editor.view, {
      languageId: "markdown",
    });
    if (
      matchingEditorDiagnostics(editor, source).length > 0 &&
      matchingWorkspaceDiagnostics(app, source).length > 0
    ) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const matchedEditorDiagnostics = matchingEditorDiagnostics(editor, source);
  const matchedWorkspaceDiagnostics = matchingWorkspaceDiagnostics(app, source);
  if (
    matchedEditorDiagnostics.length === 0 ||
    matchedWorkspaceDiagnostics.length === 0
  ) {
    const observed = app.workspace.diagnostics
      .snapshot()
      .entries.map((entry) => ({
        source: entry.diagnostic.source,
        code: entry.diagnostic.code,
        message: entry.diagnostic.message,
      }));
    throw new Error(
      `Registry fixture did not produce ${source} diagnostics: ${JSON.stringify(
        observed,
      )}`,
    );
  }
  expect(matchedEditorDiagnostics.length).toBeGreaterThan(0);
  expect(matchedWorkspaceDiagnostics.length).toBeGreaterThan(0);
  const editorDiagnostics = matchingEditorDiagnostics(editor, source);
  const workspaceEntries = matchingWorkspaceDiagnostics(app, source);
  const resource = workspaceEntries[0]?.resource;
  if (!resource) {
    throw new Error(`${source} registry diagnostics have no document resource`);
  }

  await new Promise((resolve) => setTimeout(resolve, 750));
  for (const collectionId of new Set(
    workspaceEntries.map((entry) => entry.collectionId),
  )) {
    app.workspace.diagnostics.getCollection(collectionId)?.delete(resource);
  }
  app.workspace.diagnostics
    .createCollection(`registry-media-${source}`, {
      label: workspaceEntries[0]?.collectionLabel ?? source,
    })
    .set(
      resource,
      workspaceEntries.map((entry) => entry.diagnostic),
    );
  editor.view.dispatch(setDiagnostics(editor.view.state, editorDiagnostics));
  await waitFor(() => {
    expect(matchingEditorDiagnostics(editor, source).length).toBeGreaterThan(0);
    expect(matchingWorkspaceDiagnostics(app, source).length).toBeGreaterThan(0);
  });
  return { app, editor };
}

function matchingEditorDiagnostics(
  editor: Editor,
  source: string,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  forEachDiagnostic(editor.view.state, (diagnostic, from, to) => {
    if (matchesSource(diagnostic.source, source)) {
      // Keep the original diagnostic identity. The API attaches its tooltip
      // payload through a WeakMap/non-enumerable symbol, so spreading here
      // would retain the underline but silently discard actions and hover UI.
      diagnostic.from = from;
      diagnostic.to = to;
      diagnostics.push(diagnostic);
    }
  });
  return diagnostics;
}

function matchingWorkspaceDiagnostics(app: App, source: string) {
  return app.workspace.diagnostics
    .snapshot()
    .entries.filter((entry) => matchesSource(entry.diagnostic.source, source));
}

function matchesSource(value: string | undefined, expected: string): boolean {
  return value?.toLocaleLowerCase() === expected.toLocaleLowerCase();
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
