import { describe, expect, it } from "vitest";
import {
  sampleCommentThreads,
  sampleFirstTurnBody,
  samplePlayheadLabel,
  samplePlayingTurnId,
  sampleSpeakerCount,
  sampleTranscriptItems,
  sampleTranscriptMarkdown,
} from "./sample-turns";

describe("sample transcript", () => {
  it("renders the opening turns and enough later turns to scroll", () => {
    expect(sampleTranscriptItems.length).toBeGreaterThan(12);
    expect(sampleTranscriptItems[0]?.author?.name).toBe("Speaker 1");
    expect(sampleTranscriptItems[0]?.author?.shape).toBe("circle");
    expect(sampleTranscriptItems[1]?.author?.shape).toBe("circle");
    expect(sampleTranscriptItems[0]?.author?.background).not.toBe(
      sampleTranscriptItems[1]?.author?.background,
    );
    expect(sampleTranscriptItems[0]?.timestamp).toBe("00:00");
    expect(sampleTranscriptItems[0]?.blocks[0]?.text).toBe(sampleFirstTurnBody);
    expect(sampleTranscriptItems[1]?.timestamp).toBe(samplePlayheadLabel);
    expect(sampleTranscriptItems[1]?.id).toBe(samplePlayingTurnId);
    expect(sampleSpeakerCount).toBe(2);
    expect(sampleTranscriptMarkdown()).toContain("audio: recordings/meeting.m4a");
    expect(sampleTranscriptMarkdown()).toContain("Speaker 1  (00:00)");
    expect(sampleTranscriptMarkdown()).toContain("00:06 Speaker 2");
    expect(sampleTranscriptMarkdown()).toContain("02:14");
    expect(sampleTranscriptMarkdown()).toContain(sampleFirstTurnBody);
  });

  it("anchors the sample comment to an exact phrase in the first turn", () => {
    const thread = sampleCommentThreads[0];
    const block = sampleTranscriptItems[0]?.blocks[0];
    expect(thread?.anchor.quote).toBe("mass page");
    expect(block?.text.slice(thread?.anchor.from, thread?.anchor.to)).toBe(
      thread?.anchor.quote,
    );
    expect(thread?.anchor.blockId).toBe(block?.id);
    expect(thread?.anchor.revision).toBe(block?.revision);
  });
});
