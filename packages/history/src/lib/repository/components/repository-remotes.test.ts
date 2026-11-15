import { expect, it, vi } from "vitest";
import { RepositoryRemotes } from "./repository-remotes.svelte.js";
import { RepositoryStatus } from "./repository-status.js";
import type { RepositoryPlugin } from "./repository-plugin.js";
import type { RepositoryServices } from "../controllers/history-reader.js";
import type {
  RepositoryRemotesCommand,
  RepositoryRemotesSnapshot,
} from "../controllers/remotes-service.js";
function fixture() {
  let snapshot: RepositoryRemotesSnapshot = {
    revision: 0,
    capabilities: {
      targets: ["backup", "original"],
      anonymousHttps: true,
      httpsTokens: true,
      hostSshAgent: true,
      hostSshDefault: true,
      githubDeviceSignIn: false,
      forgejoTokens: true,
    },
    settings: {
      host: "server",
      storage: "locked",
      sshAvailable: true,
      deviceSignInAvailable: false,
      credentials: [],
      automaticSync: false,
      targets: ["backup", "original"].map((target) => ({
        target: target as "backup" | "original",
        status: "connected",
        bookmarks: ["main"],
        canFetch: true,
        canPush: true,
        connection: {
          name: "origin",
          url: "ssh://git@example.test/notes.git",
          branch: "main",
          bookmark: "main",
          authentication: "ssh-default",
          credential: "",
        },
        review: {
          id: `retained-${target}`,
          commit: "a".repeat(40),
          summary: "Retained",
          outgoing: 1,
          remoteCommit: null,
        },
      })),
    },
  };
  const commands: RepositoryRemotesCommand[] = [];
  let release: (() => void) | undefined;
  let failRead = false;
  const service = {
    read: vi.fn(async () => {
      if (failRead) throw new Error("fixture offline");
      return structuredClone(snapshot);
    }),
    execute: vi.fn(async (command: RepositoryRemotesCommand) => {
      commands.push(command);
      if (command.kind === "review_push") {
        const target = snapshot.settings.targets.find(
          (target) => target.target === command.target
        )!;
        snapshot = {
          ...snapshot,
          revision: snapshot.revision + 1,
          settings: {
            ...snapshot.settings,
            targets: snapshot.settings.targets.map((t) =>
              t.target === command.target
                ? {
                    ...target,
                    review: {
                      id: `requested-${snapshot.revision}`,
                      commit: "b".repeat(40),
                      summary: "Explicit review",
                      outgoing: 2,
                      remoteCommit: null,
                    },
                  }
                : t
            ),
          },
        };
      }
      if (release)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      return structuredClone(snapshot);
    }),
    openSignIn: vi.fn(async () => {}),
  };
  const register = vi.fn(),
    report = vi.fn(),
    registerSettingsSection = vi.fn();
  const plugin = {
    id: "repository-history",
    loadData: async () => ({ showWorkingCopyStatus: false }),
    registerSettingsSection,
    report,
    app: {
      notifications: { notify: vi.fn() },
      statusBar: { registerItem: register },
    },
  } as unknown as RepositoryPlugin;
  const remotes = new RepositoryRemotes(plugin, service);
  plugin.remotes = remotes;
  return {
    remotes,
    plugin,
    service,
    commands,
    register,
    registerSettingsSection,
    report,
    fail: () => {
      failRead = true;
    },
    pause: () => {
      release = () => {};
    },
    resume: () => release?.(),
  };
}
it("does not auto-open retained reviews and presents only an explicitly selected target", async () => {
  const f = fixture();
  await f.remotes.refresh();
  expect(f.remotes.review).toBeUndefined();
  const original = f.remotes.binding("original"),
    backup = f.remotes.binding("backup");
  await f.remotes.actions.reviewPush("original");
  expect(f.remotes.review?.target).toBe("original");
  expect(f.remotes.review?.review?.summary).toBe("Explicit review");
  expect(original.target.review?.id).toBe("requested-0");
  expect(backup.target.review?.id).toBe("retained-backup");
  f.remotes.actions.dismissReview("original");
  await f.remotes.refresh();
  expect(f.remotes.review).toBeUndefined();
  expect(original.target.review).toBeUndefined();
  expect(f.commands.map((command) => command.kind)).toEqual(["review_push"]);
  await f.remotes.close();
});
it("registers native settings and retains push review while the repository footer is hidden", async () => {
  const f = fixture();
  await f.remotes.refresh();
  const status = new RepositoryStatus(f.plugin, {
    remotes: f.service,
  } as unknown as RepositoryServices);
  await status.start();
  expect(f.register).not.toHaveBeenCalled();
  const section = f.registerSettingsSection.mock.calls[0][0].section;
  expect(section.page).toBeDefined();
  expect(
    section.fields.find(
      (field: { id: string }) => field.id === f.remotes.field.id
    ).remotes
  ).toBe(f.remotes);
  await f.remotes.actions.reviewPush("backup");
  expect(f.remotes.review?.target).toBe("backup");
  await status.close();
  expect(f.remotes.state).toBeDefined();
  await f.remotes.close();
});
it("fences late replies on disposal and reports native load failures through the plugin", async () => {
  const f = fixture();
  await f.remotes.refresh();
  f.pause();
  const pending = f.remotes.actions.reviewPush("original");
  await vi.waitFor(() => expect(f.commands).toHaveLength(1));
  await f.remotes.close();
  f.resume();
  await pending;
  expect(f.remotes.state).toBeUndefined();
  expect(f.remotes.review).toBeUndefined();
  const offline = fixture();
  offline.fail();
  await offline.remotes.refresh();
  expect(offline.report).toHaveBeenCalledOnce();
  expect(offline.remotes.state).toBeUndefined();
  await offline.remotes.close();
});
