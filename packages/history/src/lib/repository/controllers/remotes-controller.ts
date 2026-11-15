import type {
  RemotesSettingsActions,
  RemotesSettingsState,
} from "./remotes-settings.js";
import type {
  RepositoryRemotesCommand,
  RepositoryRemotesService,
  RepositoryRemotesSnapshot,
} from "./remotes-service.js";

type Command = RepositoryRemotesCommand extends infer C
  ? C extends { expectedRevision: number }
    ? Omit<C, "expectedRevision">
    : never
  : never;
/** Observes native authority. Failed mutations are never automatically replayed. */
export class RepositoryRemotesController {
  #snapshot?: RepositoryRemotesSnapshot;
  #listeners = new Set<(state: RemotesSettingsState) => void>();
  #busy = false;
  #closed = false;
  #generation = 0;
  readonly actions: RemotesSettingsActions;
  constructor(
    private readonly service: RepositoryRemotesService,
    report: (error: unknown) => void
  ) {
    this.actions = {
      save: (target, connection) =>
        this.#execute({ kind: "save_connection", target, connection }),
      test: (target) => this.#execute({ kind: "test_connection", target }),
      fetch: (target) => this.#execute({ kind: "fetch", target }),
      reviewPush: (target) => this.#execute({ kind: "review_push", target }),
      push: (target, reviewId) =>
        this.#execute({ kind: "push", target, reviewId }),
      observe: (target, requestId) =>
        this.#execute({ kind: "observe_push", target, requestId }),
      stop: (target, requestId) =>
        this.#execute({ kind: "stop_push", target, requestId }),
      dismissReview: (target) => {
        if (!this.#snapshot || this.#closed) return;
        this.#snapshot = {
          ...this.#snapshot,
          settings: {
            ...this.#snapshot.settings,
            targets: this.#snapshot.settings.targets.map((state) =>
              state.target === target ? { ...state, review: undefined } : state
            ),
          },
        };
        this.#notify();
      },
      setAutomaticSync: (enabled) =>
        this.#execute({ kind: "set_automatic_sync", enabled }),
      saveCredential: (input) =>
        this.#execute({ kind: "save_credential", input }),
      forgetCredential: (id) =>
        this.#execute({ kind: "forget_credential", id }),
      beginSignIn: () => this.#execute({ kind: "begin_sign_in" }),
      checkSignIn: () => this.#execute({ kind: "check_sign_in" }),
      cancelSignIn: () => this.#execute({ kind: "cancel_sign_in" }),
      openSignIn: async () => {
        this.#ready();
        if (this.#snapshot?.settings.authorization?.state !== "pending")
          throw new Error("Start GitHub sign-in again before opening its page");
        await this.service.openSignIn();
      },
      report,
    };
  }
  get snapshot(): RepositoryRemotesSnapshot | undefined {
    return this.#snapshot;
  }
  subscribe(listener: (state: RemotesSettingsState) => void): () => void {
    if (this.#closed) throw new Error("Repository remotes are closed");
    this.#listeners.add(listener);
    if (this.#snapshot) listener(this.#snapshot.settings);
    return () => this.#listeners.delete(listener);
  }
  async refresh(): Promise<void> {
    this.#ready();
    const generation = ++this.#generation;
    const result = await this.service.read();
    if (!this.#closed && generation === this.#generation) this.#accept(result);
  }
  close(): void {
    this.#closed = true;
    ++this.#generation;
    this.#listeners.clear();
    this.#snapshot = undefined;
  }
  #ready(): void {
    if (this.#closed) throw new Error("Repository remotes are closed");
    if (this.#busy)
      throw new Error("A repository remote action is already running");
  }
  async #execute(command: Command): Promise<void> {
    this.#ready();
    if (!this.#snapshot)
      throw new Error("Load repository connections before continuing");
    const expectedRevision = this.#snapshot.revision;
    this.#busy = true;
    const generation = ++this.#generation;
    try {
      const result = await this.service.execute({
        ...command,
        expectedRevision,
      });
      if (!this.#closed && generation === this.#generation)
        this.#accept(result);
    } finally {
      this.#busy = false;
    }
  }
  #accept(snapshot: RepositoryRemotesSnapshot): void {
    if (
      !Number.isSafeInteger(snapshot.revision) ||
      snapshot.revision < 0 ||
      (this.#snapshot && snapshot.revision < this.#snapshot.revision)
    )
      throw new Error("Invalid repository connection revision");
    this.#snapshot = snapshot;
    this.#notify();
  }
  #notify(): void {
    if (!this.#snapshot) return;
    for (const listener of this.#listeners) listener(this.#snapshot.settings);
  }
}
