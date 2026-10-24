import { describe, expect, it } from "vitest";
import {
  audioPathCandidates,
  findRecordingReference,
  playableMediaUrl,
  recordingMediaType,
} from "./transcript-audio";

describe("transcript audio", () => {
  it("prefers front matter audio and otherwise uses a recording link", () => {
    const note = "See the [recording terms](./recordings/meeting.m4a).";
    expect(findRecordingReference(note, "takes/interview.wav")).toBe(
      "takes/interview.wav",
    );
    expect(findRecordingReference(note, null)).toBe("./recordings/meeting.m4a");
    expect(
      findRecordingReference("Stored at [[Audio/interview.mp3]].", null),
    ).toBe("Audio/interview.mp3");
  });

  it("resolves a vault-relative recording from the note", () => {
    expect(
      audioPathCandidates(
        "Notes/Contract transcript.md",
        "./recordings/meeting.m4a",
      ),
    ).toEqual(["Notes/recordings/meeting.m4a", "recordings/meeting.m4a"]);
    expect(
      audioPathCandidates("Notes/Contract transcript.md", "Audio/interview.mp3"),
    ).toEqual(["Notes/Audio/interview.mp3", "Audio/interview.mp3"]);
    expect(audioPathCandidates("Notes/a.md", "../secret.mp3")).toEqual([
      "secret.mp3",
    ]);
    expect(audioPathCandidates("Notes/a.md", "../../secret.mp3")).toEqual([]);
    expect(audioPathCandidates("Notes/a.md", "https://example.com/a.mp3")).toEqual(
      [],
    );
  });

  it("treats browser and file URLs as playable and keeps a media type", () => {
    expect(playableMediaUrl("blob:http://localhost/recording")).toBe(true);
    expect(playableMediaUrl("file:///vault/meeting.m4a")).toBe(true);
    expect(playableMediaUrl("memory-vault://demo/Notes/meeting.m4a")).toBe(
      false,
    );
    expect(recordingMediaType("m4a")).toBe("audio/mp4");
  });
});
