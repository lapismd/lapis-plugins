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
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.active) {
      await this.active;
      return this.flush();
    }
    if (this.pending === null) return;

    const value = this.pending;
    this.pending = null;
    this.changed("saving");
    this.active = Promise.resolve()
      .then(() => this.persist(value))
      .then(() => {
        this.changed(this.pending === null ? "saved" : "saving");
      })
      .catch((error: unknown) => {
        // An older failure must not replace the newer queued buffer.
        if (this.pending === null) this.pending = value;
        this.changed("error", error);
        throw error;
      })
      .finally(() => {
        this.active = null;
      });
    await this.active;
    return this.flush();
  }
}
