import {
  FileTextPersistence,
  type App,
  type FileEditingRegistration,
  type FileEditingSession,
  type TFile,
} from "@lapis-notes/api";
import { CanvasSaveQueue, type CanvasSaveStatus } from "./canvas-save-queue";

type Options = {
  app: App;
  file: TFile;
  baseline: string | null;
  hold(): () => void;
  reset(value: string): void;
  changed(status: CanvasSaveStatus, error?: unknown): void;
};

/** One App-owned writer for one captured Canvas destination. */
export class CanvasDocumentSession implements FileEditingSession {
  private readonly queue: CanvasSaveQueue;
  private readonly persistence: FileTextPersistence;
  private registration!: FileEditingRegistration;
  private value: string;
  private tail: Promise<void> = Promise.resolve();
  private retired: (() => void) | null = null;
  private releaseRetired: (() => void) | null = null;

  constructor(private readonly options: Options) {
    const conditional = options.app.vault.supportsConditionalTextWrites;
    this.value = options.baseline ?? "";
    this.persistence = new FileTextPersistence({
      vault: options.app.vault,
      file: options.file.copy(),
      baseline: options.baseline,
      conflicts: options.app.fileEditingSessions.textConflicts,
      local: () => this.value,
      protect: () => {
        const release = options.hold();
        return {
          release: () => {
            release();
            this.registration.changed();
            this.finishRetirement();
          },
          saved: () => this.queue.acknowledge(),
          reset: (value) => {
            this.value = value;
            options.reset(value);
          },
          resetSaved: () => this.queue.acknowledge(),
        };
      },
      settle: () => this.queue.settle(),
      serialize: (run) => options.app.fileEditingSessions.recover(this, () => this.serialize(run)),
    });
    this.queue = new CanvasSaveQueue(
      async (value) => {
        await this.registration.ready();
        await this.serialize(async () => {
          if (conditional) {
            await this.persistence.persist(value);
          } else {
            // The public host contract permits existing persistence when this
            // optional capability is absent. A failed conditional write never
            // reaches this branch or falls back to an unconditional write.
            await options.app.vault.modify(options.file, value);
            this.persistence.acceptBaseline(value);
          }
        });
      },
      (status, error) => {
        options.changed(status, error);
        this.registration?.changed();
        this.finishRetirement();
      },
    );
    this.registration = options.app.fileEditingSessions.register(options.file.path, this);
  }

  readonly native = {
    hold: () => this.options.hold(),
    savedText: () => this.persistence.baseline,
    refreshSavedText: (value: string | null) => {
      if (this.dirty) throw new Error("Cannot replace unsaved Canvas changes");
      this.persistence.acceptBaseline(value);
      this.value = value ?? "";
      this.options.reset(this.value);
    },
  };

  get dirty(): boolean {
    return this.queue.dirty || this.persistence.hasConflict;
  }

  ready(): Promise<void> {
    return this.registration.ready();
  }

  enqueue(value: string): void {
    this.value = value;
    this.persistence.updateLocal(value);
    this.queue.enqueue(value);
  }

  async flush(): Promise<void> {
    await this.registration.ready();
    await this.queue.flush();
    if (this.persistence.hasConflict) throw new Error("Resolve the Canvas file conflict before continuing");
    this.finishRetirement();
  }

  async protect(): Promise<() => void> {
    const release = this.options.hold();
    try {
      await this.flush();
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }

  /** Registry retains dirty detached writers; release rendering only after recovery. */
  retire(cleanup: () => void): void {
    this.releaseRetired = this.options.hold();
    this.retired = cleanup;
    this.registration();
    this.finishRetirement();
  }

  private finishRetirement(): void {
    if (!this.retired || this.dirty) return;
    const cleanup = this.retired;
    this.retired = null;
    cleanup();
    this.releaseRetired?.();
    this.releaseRetired = null;
  }

  private serialize(run: () => Promise<void>): Promise<void> {
    const next = this.tail.then(run);
    this.tail = next.catch(() => undefined);
    return next;
  }
}
