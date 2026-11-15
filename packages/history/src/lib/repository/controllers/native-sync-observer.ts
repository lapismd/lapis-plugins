import type {
  RepositoryNativeSyncCommand,
  RepositoryNativeSyncService,
  RepositoryNativeSyncSnapshot,
  SyncPresentation,
} from "./native-sync.js";
import { syncFeedback, type SyncResolution, type SyncState } from "./sync.js";

/** App-owned observation and explicit commands only. Core owns every sync step. */
export class NativeSyncObserver implements SyncPresentation {
  #state: RepositoryNativeSyncSnapshot = {
    revision: 0,
    enabled: false,
    busy: false,
    phase: "paused",
    recovery: false,
  };
  #listeners = new Set<(state: SyncState) => void>();
  #timer?: ReturnType<typeof setTimeout>;
  #closed = false;
  #sequence = 0;
  #localBusy = false;
  #job?: Promise<void>;
  #reading?: Promise<void>;
  #feedback: ReturnType<typeof syncFeedback>;
  constructor(
    readonly service: RepositoryNativeSyncService,
    feedback: { report(error: unknown): void; recovered(): void }
  ) {
    this.#feedback = syncFeedback(feedback);
  }
  subscribe(listener: (state: SyncState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #set(state: RepositoryNativeSyncSnapshot, reportStatus = true) {
    if (this.#closed) return;
    this.#state = { ...state, busy: state.busy || this.#localBusy };
    for (const listener of this.#listeners) listener(this.#state);
    if (!reportStatus || state.busy || this.#localBusy) return;
    if (state.phase === "attention" || state.phase === "conflicts") {
      this.#feedback.report(
        new Error(
          state.phase === "conflicts"
            ? "Backup has conflicts. Open Remotes and credentials to review them."
            : "Backup synchronization needs attention. Review its retained recovery before retrying."
        )
      );
    } else this.#feedback.recovered();
  }
  async start(): Promise<void> {
    await this.refresh();
    this.#schedule();
  }
  #schedule() {
    if (this.#closed || this.#timer) return;
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.refresh().finally(() => this.#schedule());
    }, 1000);
  }
  refresh(): Promise<void> {
    if (this.#closed) return Promise.resolve();
    const sequence = this.#sequence;
    return (this.#reading ??= this.service
      .read()
      .then((state) => {
        if (!this.#closed && sequence === this.#sequence) this.#set(state);
      })
      .catch((error) => {
        if (!this.#closed) this.#feedback.report(error);
      })
      .finally(() => {
        this.#reading = undefined;
      }));
  }
  #execute(command: RepositoryNativeSyncCommand): Promise<void> {
    if (this.#closed || this.#job) return Promise.resolve();
    this.#sequence += 1;
    this.#localBusy = true;
    this.#set(this.#state);
    return (this.#job = (async () => {
      try {
        const state = await this.service.execute(command);
        this.#localBusy = false;
        this.#set(state);
      } catch (error) {
        if (!this.#closed) this.#feedback.report(error);
        this.#localBusy = false;
        this.#set({ ...this.#state, busy: false, phase: "attention" }, false);
        // Observe an uncertain outcome; never replay the command.
        await this.#reading;
        await this.refresh();
      } finally {
        this.#localBusy = false;
        this.#job = undefined;
      }
    })());
  }
  run() {
    return this.#execute({
      kind: "run",
      expected_revision: this.#state.revision,
    });
  }
  keepCurrent() {
    return this.#execute({
      kind: "keep_current",
      expected_revision: this.#state.revision,
    });
  }
  resume() {
    return this.#state.pendingApply
      ? this.#execute({
          kind: "resume_apply",
          expected_revision: this.#state.revision,
          request_id: this.#state.pendingApply,
        })
      : Promise.resolve();
  }
  inspect(path: string) {
    const candidate = this.#state.proposal?.candidate?.commit;
    return candidate
      ? this.#execute({
          kind: "inspect",
          expected_revision: this.#state.revision,
          candidate,
          path,
        })
      : Promise.resolve();
  }
  resolve(path: string, resolution: SyncResolution) {
    const candidate = this.#state.proposal?.candidate?.commit;
    return candidate
      ? this.#execute({
          kind: "resolve",
          expected_revision: this.#state.revision,
          candidate,
          path,
          resolution,
        })
      : Promise.resolve();
  }
  async close() {
    this.#closed = true;
    this.#sequence += 1;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#listeners.clear();
    await Promise.allSettled([this.#reading, this.#job]);
  }
}
