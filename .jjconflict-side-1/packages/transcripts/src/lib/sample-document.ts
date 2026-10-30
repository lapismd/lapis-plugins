import { validAnchor } from "@lapismd/design-core/chat";
import { projectTranscript } from "./project-transcript";
import { parseTranscript } from "./parse-transcript";
import { sampleTranscriptFormats } from "./sample-formats";
import {
  sampleFirstTurnBody,
  sampleReader,
  sampleTranscriptMarkdown,
} from "./sample-turns";
import type { SavedTranscriptComment } from "./transcript-comments";

const commentedPhrase = "mass page";

export function sampleSavedComment(): SavedTranscriptComment {
  const projected = projectTranscript(sampleTranscriptMarkdown());
  const block = projected.items[0]?.blocks[0];
  if (!block || block.kind !== "markdown") {
    throw new Error("The sample transcript has no commentable opening turn");
  }
  const from = block.text.indexOf(commentedPhrase);
  if (from < 0) {
    throw new Error("The sample transcript no longer contains the commented phrase");
  }
  return {
    id: "comment-mass-page",
    threadId: "thread-mass-page",
    blockId: block.id,
    revision: block.revision,
    from,
    to: from + commentedPhrase.length,
    quote: commentedPhrase,
    text: "Check this wording against the signed agreement.",
    authorId: sampleReader.id,
    authorName: sampleReader.name,
    version: "1",
  };
}

export function sampleCommentMatchesOpeningTurn(): boolean {
  const markdown = sampleTranscriptMarkdown();
  const projected = projectTranscript(markdown, [sampleSavedComment()]);
  const block = projected.items[0]?.blocks[0];
  const thread = projected.threads[0];
  return Boolean(
    parseTranscript(markdown).qualified &&
      block &&
      thread &&
      validAnchor(block, thread.anchor) &&
      block.text.startsWith(sampleFirstTurnBody.slice(0, 12)),
  );
}

export function sampleFormatsQualify(): boolean {
  return sampleTranscriptFormats.every((format) => {
    const parsed = parseTranscript(format.markdown);
    return (
      parsed.qualified &&
      parsed.turns.some((turn) => turn.body.includes(format.marker))
    );
  });
}
