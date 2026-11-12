import type { MiraMarkdownEditingSession, MiraMarkdownRecoveryLease } from "@lapismd/mira/extensions";
import { parseJsonCanvas } from "./json-canvas";

type Child = { id: string; session: MiraMarkdownEditingSession; stop: () => void };

/** Virtual Markdown writers belong to the Canvas file, never synthetic vault paths. */
export class CanvasTextSessions {
  private readonly children = new Set<Child>();
  private readonly holds = new Set<Map<Child, () => void>>();

  constructor(private readonly changed: () => void) {}

  get dirty(): boolean {
    return [...this.children].some(({ session }) => session.dirty);
  }

  bind(id: string, session: MiraMarkdownEditingSession): () => void {
    if (!session.text || !session.hold) throw new Error("Canvas text editing requires source text and synchronous protection");
    const child: Child = { id, session, stop: () => {} };
    this.children.add(child);
    for (const held of this.holds) held.set(child, session.hold());
    let observedValue: string | undefined;
    let observedDirty: boolean | undefined;
    child.stop = session.text.subscribe((state) => {
      const dirty = session.dirty;
      if (state.value === observedValue && dirty === observedDirty) return;
      observedValue = state.value;
      observedDirty = dirty;
      this.changed();
    });
    let bound = true;
    return () => {
      if (!bound) return;
      if (session.dirty) throw new Error("Cannot release unsaved Canvas text");
      bound = false;
      child.stop();
      this.children.delete(child);
      for (const held of this.holds) {
        held.get(child)?.();
        held.delete(child);
      }
      this.changed();
    };
  }

  hold(): () => void {
    const held = new Map<Child, () => void>();
    this.holds.add(held);
    for (const child of this.children) held.set(child, child.session.hold!());
    return () => {
      if (!this.holds.delete(held)) return;
      for (const release of held.values()) release();
      held.clear();
    };
  }

  async flush(): Promise<void> {
    for (const { session } of [...this.children]) await session.flush();
  }

  local(raw: string): string {
    const drafts = new Map([...this.children]
      .filter(({ session }) => session.dirty)
      .map(({ id, session }) => [id, session.text!.state.value]));
    if (!drafts.size) return raw;
    const document = parseJsonCanvas(raw);
    return JSON.stringify({ ...document, nodes: document.nodes?.map((node) =>
      node.type === "text" && drafts.has(node.id) ? { ...node, text: drafts.get(node.id)! } : node) }, null, 2);
  }

  async recover(): Promise<{ release(): void; saved(): void; reset(raw: string): void }> {
    const leases = new Map<Child, MiraMarkdownRecoveryLease>();
    const release = () => { for (const lease of leases.values()) lease.release(); leases.clear(); };
    try {
      for (const child of this.children) leases.set(child, await child.session.text!.protectRecovery());
      return {
        release,
        saved: () => { for (const lease of leases.values()) lease.acceptLocal(); },
        reset: (raw) => {
          // Invalid external files remain fail-closed in the board. Removed or
          // unsupported child cards must nevertheless release their old draft.
          let texts = new Map<string, string>();
          try {
            texts = new Map((parseJsonCanvas(raw).nodes ?? [])
              .filter((node) => node.type === "text").map((node) => [node.id, node.text]));
          } catch { /* The owning board displays the unchanged invalid source. */ }
          for (const [child, lease] of leases) lease.useExternal(texts.get(child.id) ?? "");
        },
      };
    } catch (error) {
      release();
      throw error;
    }
  }
}
