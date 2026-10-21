import type { App } from "@lapis-notes/api";
import type {
  RepositoryServices,
  RepositoryLeaveMode,
} from "./history-reader.js";

export type RepositoryFactory = (app: App) => RepositoryServices;
const bindings = new WeakMap<App, { factory: RepositoryFactory }>();
const leaveModes = new WeakMap<App, RepositoryLeaveMode>();
export function bindRepository(
  app: App,
  factory: RepositoryFactory
): () => void {
  if (bindings.has(app)) throw new Error("Repository history is already bound");
  const lease = { factory };
  bindings.set(app, lease);
  return () => {
    if (bindings.get(app) === lease) bindings.delete(app);
  };
}
export function ownedRepository(app: App): RepositoryServices {
  const lease = bindings.get(app);
  if (!lease) throw new Error("Repository history is unavailable in this host");
  return lease.factory(app);
}
export function prepareRepositoryLeave(
  app: App,
  mode: RepositoryLeaveMode
): void {
  leaveModes.set(app, mode);
}
export function repositoryLeaveMode(app: App): RepositoryLeaveMode {
  return leaveModes.get(app) ?? "close";
}
