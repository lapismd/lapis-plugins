import { registerHistoryResultProvider } from "./search/search-provider.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
export function registerRepositoryTools(
  plugin: RepositoryPlugin,
  services: RepositoryServices
) {
  const search = services.search?.indexed
    ? registerHistoryResultProvider(plugin, services.search.indexed)
    : async () => {};
  return async () => {
    await search();
  };
}
