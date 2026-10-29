import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { App } from "@lapis-notes/api";
import type { TranscriptBlock, TranscriptProps } from "@lapismd/design-core/chat";
import type { createLapisMiraFileAdapter } from "@lapis-notes/markdown";
import { mount, unmount } from "svelte";
import TranscriptFileEmbed, {
  transcriptFileAdapterKey,
} from "./TranscriptFileEmbed.svelte";

type Adapter = ReturnType<typeof createLapisMiraFileAdapter>;

const embedLine =
  /^\s*!\[\[([^\]|#]+?)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]\s*$/;

export interface TranscriptEmbedRange {
  from: number;
  to: number;
  target: string;
  label: string;
}

/** Wiki-embed lines in a spoken turn, measured against that turn's text. */
export function transcriptEmbedRanges(text: string): TranscriptEmbedRange[] {
  const ranges: TranscriptEmbedRange[] = [];
  let from = 0;
  for (const line of text.split("\n")) {
    const match = embedLine.exec(line);
    const target = match?.[1]?.trim();
    if (target && line.length > 0) {
      ranges.push({
        from,
        to: from + line.length,
        target,
        label: (match?.[2] ?? target).trim(),
      });
    }
    from += line.length + 1;
  }
  return ranges;
}

class TranscriptEmbedWidget extends WidgetType {
  #mounted = new WeakMap<HTMLElement, ReturnType<typeof mount>>();

  constructor(
    private readonly adapter: Adapter,
    private readonly app: App | null,
    readonly sourcePath: string,
    readonly target: string,
    readonly label: string,
  ) {
    super();
  }

  eq(other: WidgetType): boolean {
    return (
      other instanceof TranscriptEmbedWidget &&
      other.target === this.target &&
      other.label === this.label &&
      other.sourcePath === this.sourcePath
    );
  }

  toDOM(): HTMLElement {
    const node = document.createElement("div");
    node.contentEditable = "false";
    const component = mount(TranscriptFileEmbed, {
      target: node,
      context: new Map([[transcriptFileAdapterKey, () => this.adapter]]),
      props: {
        adapter: this.adapter,
        app: this.app,
        href: this.target,
        label: this.label,
        sourcePath: this.sourcePath,
      },
    });
    this.#mounted.set(node, component);
    return node;
  }

  destroy(node: HTMLElement): void {
    const component = this.#mounted.get(node);
    if (component) void unmount(component);
    this.#mounted.delete(node);
  }

  ignoreEvent(): boolean {
    return true;
  }
}

/** Replaces `![[file]]` lines with the package file embed. */
export function transcriptEmbedReader(
  adapter: Adapter | undefined,
  sourcePath: string,
  app: App | null = null,
): TranscriptProps["readerExtensions"] {
  return (block: TranscriptBlock): Extension => {
    if (!adapter || block.kind !== "markdown") return [];
    const ranges = transcriptEmbedRanges(block.text);
    if (ranges.length === 0) return [];
    return EditorView.decorations.of(
      Decoration.set(
        ranges.map((range) => {
          const newline =
            range.to < block.text.length && block.text[range.to] === "\n";
          return Decoration.replace({
            widget: new TranscriptEmbedWidget(
              adapter,
              app,
              sourcePath,
              range.target,
              range.label,
            ),
            block: true,
          }).range(range.from, newline ? range.to + 1 : range.to);
        }),
        true,
      ),
    );
  };
}
