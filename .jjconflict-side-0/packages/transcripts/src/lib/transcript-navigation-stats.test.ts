import { describe, expect, it } from "vitest";
import {
  transcriptNavigationStats,
  transcriptTurnPreview,
} from "./transcript-navigation-stats";

describe("transcriptNavigationStats", () => {
  it("uses the recording length, path, speaker count, and source size", () => {
    const stats = transcriptNavigationStats({
      speakers: 2,
      durationSeconds: 146,
      cueSeconds: [0, 6],
      audioPath: "recordings/meeting.m4a",
      source: "hello",
    });
    expect(stats).toEqual({
      speakers: 2,
      durationSeconds: 146,
      audioPath: "recordings/meeting.m4a",
      byteSize: 5,
    });
  });

  it("falls back to the last cue and omits a missing recording", () => {
    const stats = transcriptNavigationStats({
      speakers: 1,
      durationSeconds: 0,
      cueSeconds: [12, 18],
      audioPath: null,
      source: "é",
    });
    expect(stats.durationSeconds).toBe(18);
    expect(stats.audioPath).toBeUndefined();
    expect(stats.byteSize).toBe(2);
  });

  it("shows a spoken turn as plain words", () => {
    expect(
      transcriptTurnPreview(
        "So the *mass page* states the [recording terms](./recordings/meeting.m4a).",
      ),
    ).toBe("So the mass page states the recording terms.");
  });
});
