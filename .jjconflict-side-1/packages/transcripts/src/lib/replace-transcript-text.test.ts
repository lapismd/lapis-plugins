import { expect, it } from "vitest";
import {
  replaceTranscriptSource,
  shiftCommentsForEdits,
  type TranscriptEditableBlock,
} from "./replace-transcript-text";
import type { SavedTranscriptComment } from "./transcript-comments";

const source = "Speaker (00:00)\n\nAlpha beta Alpha\n";
const block: TranscriptEditableBlock = {
  id: "speaker-0000-1-body",
  bodyStart: source.indexOf("Alpha"),
  body: "Alpha beta Alpha",
};

function comment(
  from: number,
  to: number,
): SavedTranscriptComment {
  return {
    id: "c1",
    threadId: "t1",
    blockId: block.id,
    revision: "old",
    from,
    to,
    quote: block.body.slice(from, to),
    text: "note",
    authorId: "a",
    authorName: "Ada",
    version: "1",
  };
}

it("replaces one match inside a turn without moving the header", () => {
  const next = replaceTranscriptSource(source, [block], [
    { blockId: block.id, from: 6, to: 10, insert: "line" },
  ]);
  expect(next).toBe("Speaker (00:00)\n\nAlpha line Alpha\n");
});

it("applies several matches from the end of the turn", () => {
  const next = replaceTranscriptSource(source, [block], [
    { blockId: block.id, from: 0, to: 5, insert: "One" },
    { blockId: block.id, from: 11, to: 16, insert: "Two" },
  ]);
  expect(next).toBe("Speaker (00:00)\n\nOne beta Two\n");
});

it("shifts saved comments onto the replaced body and drops a deleted quote", () => {
  const edits = [{ blockId: block.id, from: 6, to: 10, insert: "line" }];
  const shifted = shiftCommentsForEdits(
    [comment(0, 5), comment(6, 10), comment(11, 16)],
    [block],
    edits,
  );
  expect(shifted.map((item) => item.quote)).toEqual(["Alpha", "line", "Alpha"]);
  expect(shifted[2]?.from).toBe(11);
  expect(shifted.every((item) => item.revision !== "old")).toBe(true);

  const removed = shiftCommentsForEdits(
    [comment(6, 10)],
    [block],
    [{ blockId: block.id, from: 6, to: 10, insert: "" }],
  );
  expect(removed).toEqual([]);
});
