import {
  FileTextPersistence,
  type App,
  type FileEditingRegistration,
  type FileEditingSession,
  type TFile,
} from "@lapis-notes/api";
import { tick } from "svelte";
import type { MiraMarkdownEditingBinding, MiraMarkdownEditingSession } from "@lapismd/mira/extensions";
import { parseJsonCanvas, type JsonCanvas } from "./json-canvas";
import { CanvasTextSessions } from "./canvas-text-sessions";
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
  private readonly texts: CanvasTextSessions;
  private readonly queue: CanvasSaveQueue;
  private readonly persistence: FileTextPersistence;
  private registration!: FileEditingRegistration;
  private value: string;
  private tail: Promise<void> = Promise.resolve();
  private retired: (() => void) | null = null;
  private releaseRetired: (() => void) | null = null;

  constructor(private readonly options: Options) {
    this.texts = new CanvasTextSessions(() => {
      this.registration?.changed();
      this.persistence?.updateLocal(this.texts.local(this.value));
      this.finishRetirement();
    });
    const conditional = options.app.vault.supportsConditionalTextWrites;
    this.value = options.baseline ?? "";
    this.persistence = new FileTextPersistence({
      vault: options.app.vault,
      file: options.file.copy(),
      baseline: options.baseline,
      conflicts: options.app.fileEditingSessions.textConflicts,
      local: () => this.texts.local(this.value),
      protect: async () => {
        const releaseInput = this.hold();
        try {
          await tick();
          const texts = await this.texts.recover();
          return {
            release: () => {
              texts.release();
              releaseInput();
              this.registration.changed();
              this.finishRetirement();
            },
            saved: () => {
              this.value = this.texts.local(this.value);
              texts.saved();
              this.options.reset(this.value);
              this.queue.acknowledge();
            },
            reset: async (value: string) => {
              texts.reset(value);
              this.value = value;
              options.reset(value);
              await tick();
            },
            resetSaved: () => this.queue.acknowledge(),
          };
        } catch (error) {
          releaseInput();
          throw error;
        }
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
    hold: () => this.hold(),
    savedText: () => this.persistence.baseline,
    refreshSavedText: async (value: string | null) => {
      const release = this.hold();
      try {
        await tick();
        if (this.dirty) throw new Error("Cannot replace unsaved Canvas changes");
        const texts = await this.texts.recover();
        try {
          if (this.dirty) throw new Error("Cannot replace unsaved Canvas changes");
          texts.reset(value ?? "");
          this.persistence.acceptBaseline(value);
          this.value = value ?? "";
          this.options.reset(this.value);
          await tick();
        } finally {
          texts.release();
        }
      } finally {
        release();
      }
    },
  };

  get dirty(): boolean {
    return this.queue.dirty || this.texts.dirty || this.persistence.hasConflict;
  }

  ready(): Promise<void> {
    return this.registration.ready();
  }

  enqueue(value: string): void {
    this.value = value;
    this.persistence.updateLocal(this.texts.local(value));
    this.queue.enqueue(value);
  }

  async flush(): Promise<void> {
    await this.registration.ready();
    await this.texts.flush();
    await tick();
    await this.queue.flush();
    if (this.persistence.hasConflict) throw new Error("Resolve the Canvas file conflict before continuing");
    this.finishRetirement();
  }

  async protect(): Promise<() => void> {
    const release = this.hold();
    try {
      await this.flush();
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }

  /** Read-only command/clipboard snapshot; pending editor text stays unacknowledged. */
  snapshot(document: JsonCanvas): JsonCanvas {
    return parseJsonCanvas(this.texts.local(JSON.stringify(document)));
  }

  bindText(id: string, session: MiraMarkdownEditingSession, write: (value: string) => void | Promise<void>): MiraMarkdownEditingBinding {
    const release = this.texts.bind(id, session);
    return {
      write: async (value) => {
        await write(value);
        await tick();
        // Joining the JSON queue directly avoids recursively flushing the Mira
        // writer whose bound callback is currently waiting for durability.
        await this.queue.flush();
      },
      release,
    };
  }

  private hold(): () => void {
    const releaseInput = this.options.hold();
    const releaseTexts = this.texts.hold();
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      releaseTexts();
      releaseInput();
    };
  }

  /** Registry retains dirty detached writers; release rendering only after recovery. */
  retire(cleanup: () => void): void {
    this.releaseRetired = this.hold();
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
