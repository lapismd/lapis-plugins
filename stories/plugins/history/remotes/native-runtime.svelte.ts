import type { RepositoryPlugin } from "@lapis-notes/history/repository";
import type {
  RepositoryRemotesService,
  RepositoryRemotesCommand,
} from "../../../../packages/history/src/lib/repository/controllers/remotes-service";
import {
  createRepositoryStory,
  cleanupRepositoryStories,
} from "../repository/runtime.svelte";
import { RemotesFixture } from "./model.svelte";
import {
  commit,
  operation,
  revision,
} from "../../../../packages/history/test/repository/fixtures/fixture";
import {
  NativeSyncFixture,
  type NativeSyncScenario,
} from "./native-sync-fixture";

export async function createNativeRemotesStory(
  host: "desktop" | "server",
  footer: boolean,
  operations: boolean,
  syncScenario?: NativeSyncScenario
) {
  let fixture!: RemotesFixture;
  let sequence = 0;
  const commands: { kind: string; target?: string }[] = [];
  let synchronization: NativeSyncFixture | undefined;
  const runtime = await createRepositoryStory(
    "middle",
    operations,
    "ready",
    true,
    {
      data: { showWorkingCopyStatus: footer },
      services(app, base) {
        fixture = new RemotesFixture(app, host, "connected");
        if (syncScenario) {
          synchronization = new NativeSyncFixture(
            syncScenario,
            () => sequence,
            () => fixture.state.automaticSync
          );
          fixture.state.automaticSync = synchronization.initialEnabled;
        }
        const read: RepositoryRemotesService["read"] = async () => ({
          revision: sequence,
          capabilities: {
            targets: ["backup", "original"],
            anonymousHttps: true,
            httpsTokens: true,
            hostSshAgent: true,
            hostSshDefault: true,
            githubDeviceSignIn: true,
            forgejoTokens: true,
          },
          settings: $state.snapshot(fixture.state),
        });
        const execute = async (command: RepositoryRemotesCommand) => {
          if (command.expectedRevision !== sequence)
            throw Error("Stale fixture revision");
          commands.push({
            kind: command.kind,
            ...("target" in command ? { target: command.target } : {}),
          });
          if (
            command.kind === "set_automatic_sync" &&
            syncScenario === "selection-failure"
          ) {
            throw Error("Native backup selection unavailable");
          }
          ++sequence;
          const a = fixture.actions;
          switch (command.kind) {
            case "save_connection":
              await a.save(command.target, command.connection);
              break;
            case "test_connection":
              await a.test(command.target);
              break;
            case "fetch":
              await a.fetch(command.target);
              break;
            case "review_push":
              await a.reviewPush(command.target);
              break;
            case "push":
              await a.push(command.target, command.reviewId);
              break;
            case "observe_push":
              await a.observe(command.target, command.requestId);
              break;
            case "stop_push":
              await a.stop(command.target, command.requestId);
              break;
            case "set_automatic_sync":
              await a.setAutomaticSync(command.enabled);
              break;
            case "save_credential":
              await a.saveCredential(command.input);
              break;
            case "forget_credential":
              await a.forgetCredential(command.id);
              break;
            case "begin_sign_in":
              await a.beginSignIn();
              break;
            case "check_sign_in":
              await a.checkSignIn();
              break;
            case "cancel_sign_in":
              await a.cancelSignIn();
              break;
          }
          return read();
        };
        const current = commit();
        const saved = {
          phase: "ready" as const,
          error: null,
          checkpoint: {
            operation,
            commit: revision,
            change_id: current.change_id,
            description: "Retain saved vault files",
            timestamp_millis: 1792252800000,
          },
        };
        return {
          ...base,
          remotes: {
            synchronization,
            read,
            execute,
            openSignIn: () => fixture.actions.openSignIn(),
          },
          workingCopy: async () => ({
            source: "original",
            operation,
            revision,
            changeId: current.change_id,
            workspace: "default",
            description: current.description,
            author: current.author,
            files: 3,
            lines: { additions: 24, deletions: 6 },
            uncounted: 0,
          }),
          backup: {
            start: async () => saved,
            capture: async () => saved,
            stop: async () => {},
          },
        };
      },
    }
  );
  const plugin = runtime.app.plugins.plugins.get(
    "repository-history"
  ) as RepositoryPlugin;
  return { ...runtime, plugin, fixture, commands, synchronization };
}
type Runtime = Awaited<ReturnType<typeof createNativeRemotesStory>>;
const mounted = new WeakMap<HTMLElement, Runtime>();
const openings = new Set<Promise<Runtime>>();
export function openNativeRemotesStory(
  host: "desktop" | "server",
  footer: boolean,
  operations: boolean,
  syncScenario?: NativeSyncScenario
) {
  const promise = createNativeRemotesStory(
    host,
    footer,
    operations,
    syncScenario
  );
  openings.add(promise);
  return promise;
}
export function attachNativeRemotesStory(
  element: HTMLElement,
  runtime: Runtime
) {
  mounted.set(element, runtime);
}
export function nativeRemotesStoryFor(canvas: HTMLElement) {
  const element = canvas.querySelector<HTMLElement>(
    "[data-native-remotes-story]"
  );
  const runtime = element && mounted.get(element);
  if (!runtime) throw Error("Native remotes story is not ready");
  return runtime;
}
export async function cleanupNativeRemotesStories() {
  for (const promise of openings) await (await promise).dispose();
  openings.clear();
  await cleanupRepositoryStories();
}
