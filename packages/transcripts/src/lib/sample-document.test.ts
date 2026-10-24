import { describe, expect, it } from "vitest";
import { parseTranscript } from "./parse-transcript";
import {
  samplePlainTranscript,
  sampleTranscriptFormats,
} from "./sample-formats";
import {
  sampleCommentMatchesOpeningTurn,
  sampleFormatsQualify,
  sampleSavedComment,
} from "./sample-document";
import { projectTranscript } from "./project-transcript";
import { sampleFirstTurnBody, sampleTranscriptMarkdown } from "./sample-turns";

describe("sample transcript document", () => {
  it("parses the spoken note in both header styles and anchors the saved comment", () => {
    const parsed = parseTranscript(sampleTranscriptMarkdown());
    expect(parsed.qualified).toBe(true);
    expect(parsed.turns[0]?.body).toBe(sampleFirstTurnBody);
    expect(parsed.turns.map((turn) => turn.seconds)[1]).toBe(6);
    expect(sampleCommentMatchesOpeningTurn()).toBe(true);
    const projected = projectTranscript(sampleTranscriptMarkdown(), [
      sampleSavedComment(),
    ]);
    expect(projected.threads[0]?.comments[0]?.text).toBe(
      "Check this wording against the signed agreement.",
    );
  });

  it("qualifies the time-first, centisecond, and single-turn samples", () => {
    expect(sampleFormatsQualify()).toBe(true);
    const [timeFirst, centiseconds, single] = sampleTranscriptFormats;
    expect(parseTranscript(timeFirst!.markdown).turns[0]?.seconds).toBe(25 * 60);
    expect(parseTranscript(centiseconds!.markdown).turns.map((turn) => turn.seconds)).toEqual([
      25,
      25.5,
    ]);
    expect(parseTranscript(single!.markdown).turns).toHaveLength(1);
    expect(parseTranscript(single!.markdown).declaredType).toBe("transcript");
  });

  it("qualifies the draft that stays on the Markdown editor", () => {
    const parsed = parseTranscript(samplePlainTranscript.markdown);
    expect(parsed.qualified).toBe(true);
    expect(parsed.turns.map((turn) => turn.seconds)).toEqual([12, 18]);
    expect(sampleTranscriptFormats.map((format) => format.path)).not.toContain(
      samplePlainTranscript.path,
    );
  });
});