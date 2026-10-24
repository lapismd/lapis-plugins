import { describe, expect, it } from "vitest";
import type { TranscriptSubmission } from "@lapismd/design-core/chat";
import { validAnchor } from "@lapismd/design-core/chat";
import { blockRevision, projectTranscript } from "./project-transcript";
import {
  commentsFromValue,
  removeComments,
  upsertComments,
  writeComments,
} from "./transcript-comments";

const anchor = {
  blockId: "speaker-1-0025-1-body",
  revision: "rev-1",
  from: 7,
  to: 16,
  quote: "mass page",
};

function submission(
  text: string,
  editOf?: TranscriptSubmission["comments"][number]["editOf"],
): TranscriptSubmission {
  return {
    id: "submission",
    text: "",
    comments: [
      {
        threadId: "thread-1",
        commentId: editOf ? "comment-2" : "comment-1",
        anchor,
        author: { id: "local-user", name: "You" },
        text,
        ...(editOf ? { editOf } : {}),
      },
    ],
  };
}

describe("transcript comments", () => {
  it("saves a sent comment, replaces it on edit, and removes it without the body", () => {
    const frontmatter: Record<string, unknown> = { type: "transcript" };
    const body = "Speaker 1 (00:25)\n\nSo the mass page stays.\n";
    writeComments(frontmatter, upsertComments([], submission("Check this.")));
    expect(frontmatter.type).toBe("transcript");
    expect(JSON.stringify(frontmatter.comments)).not.toContain(body);

    const edited = upsertComments(
      commentsFromValue(frontmatter.comments),
      submission("Check the signed copy.", {
        commentId: "comment-1",
        messageId: "comment-1",
        version: "1",
      }),
    );
    expect(edited.map((comment) => [comment.id, comment.text, comment.version])).toEqual([
      ["comment-2", "Check the signed copy.", "2"],
    ]);

    writeComments(frontmatter, removeComments(edited, ["comment-2"]));
    expect(frontmatter.comments).toBeUndefined();
    expect(frontmatter.type).toBe("transcript");
  });

  it("keeps a saved quote unavailable after the turn changes", () => {
    const note = `Speaker 1 (00:25)

So the mass page stays.

Speaker 2 (00:34)

A second turn.
`;
    const projected = projectTranscript(note, [
      {
        id: "comment-1",
        threadId: "thread-1",
        blockId: projectedBlockId(note),
        revision: "rev-old",
        from: 7,
        to: 16,
        quote: "mass page",
        text: "Check this.",
        authorId: "local-user",
        authorName: "You",
        version: "1",
      },
    ]);
    const block = projected.items[0]?.blocks[0];
    const thread = projected.threads[0];
    expect(block).toBeDefined();
    expect(thread).toBeDefined();
    expect(validAnchor(block!, thread!.anchor)).toBe(false);
    expect(thread?.anchor.quote).toBe("mass page");
    expect(blockRevision("So the mass page stays.")).toBe(block?.revision);
  });
});

function projectedBlockId(note: string): string {
  return projectTranscript(note).items[0]?.blocks[0]?.id ?? "";
}
