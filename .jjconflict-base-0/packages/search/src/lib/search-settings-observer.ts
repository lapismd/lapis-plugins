import type { App } from "@lapis-notes/api";
import {
  mergeSearchSettings,
  type SearchPluginSettings,
} from "./search-settings";

/** Observe owner-applied recovery without writing the recovered document again. */
export function observeRecoveredSearchSettings(
  app: Pick<App, "configuration">,
  pluginId: string,
  apply: (settings: SearchPluginSettings) => void,
): () => void {
  const changed = app.configuration.on("plugin-data-updated", (event) => {
    if (event.pluginId !== pluginId || event.origin === "plugin-save") return;
    apply(mergeSearchSettings(event.value));
  });
  return () => app.configuration.offref(changed);
}
