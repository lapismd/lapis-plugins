import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
export function repositoryFeedback(app: App, title: string, identity?: string) {
  const id = identity ?? `repository-history:${crypto.randomUUID()}`;
  return {
    report: (error: unknown) =>
      app.notifications.notify({
        id,
        title,
        message: error instanceof Error ? error.message : String(error),
        source: "repository-history",
        severity: "error",
        persist: false,
      }),
    recovered: () => {
      getWorkspaceHostBinding(app.workspace).controller.notifications.dismiss(
        id
      );
      // Reports are transient (persist: false); recovery must not write
      // persisted history on every healthy native-status observation.
    },
  };
}
export async function copyRepositoryIdentifier(app: App, value: string) {
  const feedback = repositoryFeedback(
    app,
    "Copy identifier",
    `repository-copy:${value}`
  );
  try {
    await navigator.clipboard.writeText(value);
    feedback.recovered();
  } catch (error) {
    feedback.report(error);
    throw error;
  }
}
export function reportRepositoryError(app: App, error: unknown) {
  app.notifications.notify({
    title: "Repository history",
    source: "repository-history",
    severity: "error",
    persist: false,
    message: error instanceof Error ? error.message : String(error),
  });
}
