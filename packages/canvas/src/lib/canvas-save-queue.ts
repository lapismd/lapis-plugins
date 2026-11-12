export type CanvasSaveStatus = "saved" | "saving" | "error";

/** One queue captures one destination; view transitions must drain it first. */
export class CanvasSaveQueue {
  private pending: string | null = null;
  private active: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly persist: (value: string) => Promise<void>,
    private readonly changed: (status: CanvasSaveStatus, error?: unknown) => void,
  ) {}

  get dirty(): boolean {
    return this.pending !== null || this.active !== null;
  }

  /** Recovery joins in-flight writes without retrying the conflicting draft. */
  async settle(): Promise<void> {
    this.clearTimer();
    await this.active?.catch(() => undefined);
  }

  /** Called only under an editing/recovery lease after persistence has settled. */
  acknowledge(): void {
    this.clearTimer();
    this.pending = null;
    this.changed("saved");
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  enqueue(value: string): void {
    this.pending = value;
    this.changed("saving");
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      // Failed background saves stay queued; explicit flush retries them.
      void this.flush().catch(() => undefined);
    }, 250);
  }

  async flush(): Promise<void> {
    this.clearTimer();
    if (this.active) {
      await this.active;
      return this.flush();
    }
    if (this.pending === null) return;

    const value = this.pending;
    this.pending = null;
    let failure: unknown;
    this.active = Promise.resolve()
      .then(() => this.persist(value))
      .catch((error: unknown) => {
        // An older failure must not replace the newer queued buffer.
        if (this.pending === null) this.pending = value;
        failure = error;
        throw error;
      })
      .finally(() => {
        this.active = null;
        this.changed(failure === undefined ? (this.pending === null ? "saved" : "saving") : "error", failure);
      });
    this.changed("saving");
    await this.active;
    return this.flush();
  }
}
