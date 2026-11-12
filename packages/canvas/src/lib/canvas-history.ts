/** Bounded document history; caller-supplied keys coalesce a single gesture/editor session. */
export class CanvasHistory {
  private past: string[] = [];
  private future: string[] = [];
  private present = "";
  private group: string | undefined;

  constructor(private readonly changed: () => void, private readonly limit = 100) {}

  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }

  reset(value: string): void {
    this.present = value;
    this.past = [];
    this.future = [];
    this.group = undefined;
    this.changed();
  }

  record(value: string, group?: string): void {
    if (value === this.present) return;
    if (group === undefined || group !== this.group) {
      this.past.push(this.present);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.future = [];
    this.present = value;
    this.group = group;
    this.changed();
  }

  undo(): string | null {
    const previous = this.past.pop();
    if (previous === undefined) return null;
    this.future.push(this.present);
    this.present = previous;
    this.group = undefined;
    this.changed();
    return previous;
  }

  redo(): string | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(this.present);
    this.present = next;
    this.group = undefined;
    this.changed();
    return next;
  }
}
