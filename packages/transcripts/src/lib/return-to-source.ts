import type { App, WorkspaceLeaf } from "@lapis-notes/api";

export async function returnToTranscriptSource(
  app: App,
  leaf: WorkspaceLeaf,
  state: Record<string, unknown>,
): Promise<void> {
  const id = typeof state.id === "string" ? state.id : "";
  const previous = id ? app.workspace.getLeafById(id) : null;
  if (!previous || previous === leaf) return;
  app.workspace.activateLeaf(previous, {
    focusRootHost: false,
    source: "api",
    operation: "close-transcript",
  });
  await app.workspace.revealLeaf(previous);
  app.workspace.requestSaveLayout();
}
