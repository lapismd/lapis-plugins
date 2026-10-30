import type { SavedTranscriptComment } from "./transcript-comments";
import { blockRevision } from "./project-transcript";

export interface TranscriptTextEdit {
  blockId: string;
  from: number;
  to: number;
  insert: string;
}

export interface TranscriptEditableBlock {
  id: string;
  bodyStart: number;
  body: string;
}

/** Apply block edits to the note. Later blocks are replaced first so earlier ranges stay valid. */
export function replaceTranscriptSource(
  source: string,
  blocks: readonly TranscriptEditableBlock[],
  edits: readonly TranscriptTextEdit[],
): string | null {
  const byBlock = new Map<string, TranscriptTextEdit[]>();
  for (const edit of edits) {
    const group = byBlock.get(edit.blockId) ?? [];
    group.push(edit);
    byBlock.set(edit.blockId, group);
  }
  const ordered = [...blocks].sort(
    (left, right) => right.bodyStart - left.bodyStart,
  );
  let next = source;
  for (const block of ordered) {
    const group = byBlock.get(block.id);
    if (!group?.length) continue;
    if (next.slice(block.bodyStart, block.bodyStart + block.body.length) !== block.body) {
      return null;
    }
    const body = applyEdits(block.body, group);
    next =
      next.slice(0, block.bodyStart) +
      body +
      next.slice(block.bodyStart + block.body.length);
  }
  return next;
}

export function shiftCommentsForEdits(
  comments: readonly SavedTranscriptComment[],
  blocks: readonly TranscriptEditableBlock[],
  edits: readonly TranscriptTextEdit[],
): SavedTranscriptComment[] {
  const bodies = new Map(blocks.map((block) => [block.id, block.body]));
  const grouped = new Map<string, TranscriptTextEdit[]>();
  for (const edit of edits) {
    const group = grouped.get(edit.blockId) ?? [];
    group.push(edit);
    grouped.set(edit.blockId, group);
  }
  return comments.flatMap((comment) => {
    const group = grouped.get(comment.blockId);
    const body = bodies.get(comment.blockId);
    if (!group?.length || body === undefined) return [comment];
    const nextBody = applyEdits(body, group);
    let from = comment.from;
    let to = comment.to;
    for (const edit of [...group].sort((left, right) => right.from - left.from)) {
      const mapped = mapRange(from, to, edit.from, edit.to, edit.insert.length);
      if (!mapped) return [];
      from = mapped.from;
      to = mapped.to;
    }
    const quote = nextBody.slice(from, to);
    if (from === to || quote.length === 0) return [];
    return [
      {
        ...comment,
        from,
        to,
        quote,
        revision: blockRevision(nextBody),
      },
    ];
  });
}

function applyEdits(body: string, edits: readonly TranscriptTextEdit[]): string {
  let next = body;
  for (const edit of [...edits].sort((left, right) => right.from - left.from)) {
    next = next.slice(0, edit.from) + edit.insert + next.slice(edit.to);
  }
  return next;
}

function mapRange(
  from: number,
  to: number,
  editFrom: number,
  editTo: number,
  insertLength: number,
): { from: number; to: number } | null {
  const delta = insertLength - (editTo - editFrom);
  if (to <= editFrom) return { from, to };
  if (from >= editTo) return { from: from + delta, to: to + delta };
  const nextFrom = Math.min(from, editFrom);
  const nextTo = Math.max(to, editTo) - (editTo - editFrom) + insertLength;
  if (nextFrom >= nextTo) return null;
  return { from: nextFrom, to: nextTo };
}
