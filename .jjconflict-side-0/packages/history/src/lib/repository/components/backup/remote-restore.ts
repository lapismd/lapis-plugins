import type { RepositoryPlugin } from "../repository-plugin.js";
import type { RemoteService } from "../../controllers/remote.js";
import { remoteRestore } from "../../controllers/remote.js";
import { BackgroundWork } from "../../controllers/background-work.js";
import { createRestoreController } from "../restore-controller.js";
export function createRemoteRestore(
  plugin: RepositoryPlugin,
  remote: RemoteService
) {
  const service = remoteRestore(remote);
  const activity = new BackgroundWork(plugin.app.notifications, plugin.id);
  return createRestoreController(plugin, {
    key: "pendingRemoteRestore",
    title: "Restore remote backup",
    service: {
      ...service,
      previewVault: (checkpoint) =>
        activity.run("Preparing remote restore", () =>
          remote.preview(checkpoint)
        ),
      applyVault: (request) =>
        activity.run("Restoring remote backup", () => remote.restore(request)),
      keepCurrent: () =>
        activity.run("Keeping current vault files", () => remote.keepCurrent()),
    },
  });
}
