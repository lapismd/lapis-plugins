import { matchesEditorAssociationGlob } from "@lapis-notes/api";
import { describe, expect, it } from "vitest";
import { TRANSCRIPT_FILENAME_PATTERN } from "./transcript-association";

describe("transcript filename association", () => {
  it("claims a note whose name ends in transcript.md", () => {
    expect(
      matchesEditorAssociationGlob(
        TRANSCRIPT_FILENAME_PATTERN,
        "Notes/Contract transcript.md",
      ),
    ).toBe(true);
    expect(
      matchesEditorAssociationGlob(TRANSCRIPT_FILENAME_PATTERN, "transcript.md"),
    ).toBe(true);
    expect(
      matchesEditorAssociationGlob(
        TRANSCRIPT_FILENAME_PATTERN,
        "Notes/Draft meeting.md",
      ),
    ).toBe(false);
    expect(
      matchesEditorAssociationGlob(
        TRANSCRIPT_FILENAME_PATTERN,
        "Notes/transcript.md.bak",
      ),
    ).toBe(false);
  });
});