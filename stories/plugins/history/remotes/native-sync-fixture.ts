import type {
  RepositoryNativeSyncCommand,
  RepositoryNativeSyncService,
  RepositoryNativeSyncSnapshot,
} from "@lapis-notes/history/repository";
export type NativeSyncScenario =
  | "paused"
  | "ready"
  | "fetching"
  | "applying"
  | "publishing"
  | "conflicts"
  | "recovery"
  | "lost-response"
  | "selection-failure";
const checkpoint = (id: string) => ({
  operation: "a".repeat(128),
  commit: id.repeat(40),
  change_id: "c".repeat(32),
  description: "Saved vault checkpoint",
  timestamp_millis: 1792252800000,
});
/** Declared memory owner. It never transfers, writes credentials or edits files. */
export class NativeSyncFixture implements RepositoryNativeSyncService {
  readonly commands: RepositoryNativeSyncCommand[] = [];
  readonly initialEnabled: boolean;
  #state: RepositoryNativeSyncSnapshot;
  constructor(
    readonly scenario: NativeSyncScenario,
    readonly revision: () => number,
    readonly enabled: () => boolean
  ) {
    this.initialEnabled = !["paused", "selection-failure"].includes(scenario);
    this.#state = {
      revision: 0,
      enabled: this.initialEnabled,
      busy: ["fetching", "applying", "publishing"].includes(scenario),
      phase:
        scenario === "selection-failure"
          ? "paused"
          : scenario === "recovery"
          ? "attention"
          : scenario === "lost-response"
          ? "ready"
          : scenario,
      recovery: scenario === "recovery",
      ...(scenario === "recovery"
        ? { pendingApply: "retained-apply-request" }
        : {}),
      ...(scenario === "conflicts"
        ? {
            proposal: {
              local: checkpoint("a"),
              incoming: checkpoint("b"),
              candidate: checkpoint("d"),
              conflicts: ["Research/Diagram.png"],
            },
          }
        : {}),
    };
  }
  async read() {
    return structuredClone({
      ...this.#state,
      revision: this.revision(),
      enabled: this.enabled(),
      ...(!this.enabled() && !this.#state.recovery && !this.#state.proposal
        ? { phase: "paused" as const }
        : {}),
    });
  }
  async execute(command: RepositoryNativeSyncCommand) {
    if (command.expected_revision !== this.revision())
      throw Error("Stale native fixture revision");
    this.commands.push(structuredClone(command));
    if (command.kind === "run" && this.scenario === "lost-response") {
      this.#state = {
        ...this.#state,
        busy: false,
        phase: "attention",
        recovery: true,
        pendingApply: "retained-apply-request",
      };
      throw Error("Native synchronization response was lost");
    }
    if (command.kind === "inspect") {
      this.#state.conflict = {
        path: command.path,
        terms: [0, 1].map((id) => ({
          id,
          role: "add",
          kind: "binary",
          text: null,
          executable: false,
        })),
      };
    } else {
      this.#state = {
        ...this.#state,
        busy: false,
        phase: "ready",
        recovery: false,
        pendingApply: undefined,
        conflict: undefined,
        proposal: undefined,
        lastSuccess: 1792252800000,
      };
    }
    return this.read();
  }
}
