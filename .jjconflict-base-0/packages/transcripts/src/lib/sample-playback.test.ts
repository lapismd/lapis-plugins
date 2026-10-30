import { describe, expect, it } from "vitest";
import { samplePlayheadLabel, sampleTranscriptItems } from "./sample-turns";
import {
  activeTurnForTime,
  createSampleCueWav,
  formatPlayhead,
  timestampToSeconds,
} from "./sample-playback";

describe("sample playback", () => {
  it("maps turn timestamps onto the playhead", () => {
    expect(timestampToSeconds("00:25")).toBe(25);
    expect(timestampToSeconds("00:25:00")).toBe(1500);
    expect(formatPlayhead(timestampToSeconds(samplePlayheadLabel))).toBe(
      samplePlayheadLabel,
    );
    expect(
      activeTurnForTime(
        sampleTranscriptItems,
        timestampToSeconds(samplePlayheadLabel),
      )?.id,
    ).toBe("speaker-2-0006");
    expect(activeTurnForTime(sampleTranscriptItems, 0)?.timestamp).toBe(
      "00:00",
    );
    expect(
      activeTurnForTime(sampleTranscriptItems, 134)?.timestamp,
    ).toBe("02:14");
  });

  it("builds a cue with one tone per turn and no copied recording", () => {
    const cue = createSampleCueWav(sampleTranscriptItems);
    expect(cue.type).toBe("audio/wav");
    expect(cue.size).toBeGreaterThan(44);
    expect(cue.size).toBeLessThan(2_000_000);
  });
});
