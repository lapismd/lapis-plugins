import { registerHistoryResultProvider } from "./search/search-provider.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
import { nativeIndexedHistory } from "../controllers/native-indexed-search.js";
export function registerRepositoryTools(
  plugin: RepositoryPlugin,
  services: RepositoryServices,
) {
  const indexed = plugin.app.nativeHistoryIndex
    ? nativeIndexedHistory(plugin.app.nativeHistoryIndex)
    : services.search?.indexed;
  const search = indexed
    ? registerHistoryResultProvider(plugin, indexed)
    : async () => {};
  return async () => {
    await search();
  };
}
