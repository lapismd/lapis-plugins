import type {
  TranscriptAuthor,
  TranscriptCommentThread,
  TranscriptItem,
} from "@lapismd/design-core/chat";

export const sampleTranscriptRevision = "preview";

export const sampleReader: TranscriptAuthor = {
  id: "local-user",
  name: "You",
  initials: "YO",
  shape: "circle",
  background: "#be185d",
};

const speaker1: TranscriptAuthor = {
  id: "speaker-1",
  name: "Speaker 1",
  initials: "S1",
  shape: "circle",
  background: "#6e56cf",
};

const speaker2: TranscriptAuthor = {
  id: "speaker-2",
  name: "Speaker 2",
  initials: "S2",
  shape: "circle",
  background: "#0e7490",
};

export const sampleFirstTurnBody =
  "So the *mass page* of the contract is the agreement between you and ISO and basically states the [recording terms](./recordings/meeting.m4a).";

const commentedPhrase = "mass page";
const commentedFrom = sampleFirstTurnBody.indexOf(commentedPhrase);

export const samplePlayheadLabel = "00:06";
export const sampleRecordingDurationSeconds = 146;
export const sampleSpeakerCount = 2;

function turn(
  speaker: TranscriptAuthor,
  timestamp: string,
  text: string,
): TranscriptItem {
  const id = `${speaker.id}-${timestamp.replaceAll(":", "")}`;
  return {
    id,
    kind: "message",
    label: speaker.name,
    author: speaker,
    timestamp,
    blocks: [
      {
        id: `${id}-body`,
        revision: sampleTranscriptRevision,
        kind: "markdown",
        label: speaker.name,
        text,
        commentable: true,
      },
    ],
  };
}

export const samplePlayingTurnId = `${speaker2.id}-${samplePlayheadLabel.replaceAll(":", "")}`;

const laterTurns: readonly [TranscriptAuthor, string, string][] = [
  [
    speaker1,
    "00:32",
    "If we keep the signed page short, the schedule can carry the examples without turning the agreement into a transcript of this call.",
  ],
  [
    speaker2,
    "00:40",
    "That also gives us a place for the recording link. I do not want the audio path buried in a sentence that someone might edit later.",
  ],
  [
    speaker1,
    "00:49",
    "I will leave the link in the first turn and repeat the filename in the schedule, so a reader can find the file without opening this view.",
  ],
  [
    speaker2,
    "00:57",
    "Please mark any phrase that still sounds like a draft. The comment can sit on the words, and the surrounding sentence should stay ordinary Markdown.",
  ],
  [
    speaker1,
    "01:07",
    "The next section is the handover. We should say who sends the signed copy, who files the recording, and which date the schedule uses.",
  ],
  [
    speaker2,
    "01:15",
    "I can take the signed copy. The recording stays with the note, and the schedule date should be the date on the signed page, not the date of this meeting.",
  ],
  [
    speaker1,
    "01:26",
    "Then the closing paragraph can stay plain. No speaker labels there, because that part is the agreement rather than the conversation.",
  ],
  [
    speaker2,
    "01:34",
    "One more pass on the defined terms. *Mass page* is the phrase we flagged, and I do not want a second undefined label appearing in the schedule.",
  ],
  [
    speaker1,
    "01:44",
    "I will check the defined terms against the signed copy before we circulate it. If the wording matches, the comment can be resolved without rewriting the turn.",
  ],
  [
    speaker2,
    "01:53",
    "The appendix can list the recording, the schedule, and the signed page as three separate files. That keeps the transcript from becoming the only copy of the agreement.",
  ],
  [
    speaker1,
    "02:05",
    "I will add those filenames under the last turn so they remain visible while this note is scrolled. The reader should not have to return to the top to find them.",
  ],
  [
    speaker2,
    "02:14",
    "That is enough for this pass. Leave the original turns intact, keep the comment on the flagged phrase, and use the rest of the note to show how a longer transcript moves.",
  ],
];

export const sampleTranscriptItems: readonly TranscriptItem[] = [
  turn(speaker1, "00:00", sampleFirstTurnBody),
  turn(
    speaker2,
    samplePlayheadLabel,
    "What we are going to need is a clearer split between the signed page and the schedule.\n\nThe schedule can stay in Markdown, with the timestamp kept on its own line.",
  ),
  turn(
    speaker1,
    "00:17",
    "I can leave the original wording in the note and only mark the phrase that needs a second look.",
  ),
  turn(
    speaker2,
    "00:23",
    "That keeps the transcript readable outside this view.\n\nThe comment stays on the phrase, and the rest of the turn remains ordinary text.",
  ),
  ...laterTurns.map(([speaker, timestamp, text]) =>
    turn(speaker, timestamp, text),
  ),
];

export const sampleTranscriptPath = "Notes/Contract transcript.md";

export function sampleTranscriptMarkdown(): string {
  return sampleTranscriptItems
    .map((item) => {
      const speaker = item.author?.name ?? item.label;
      const text = item.blocks
        .map((block) => ("text" in block ? block.text : ""))
        .filter((block) => block.length > 0)
        .join("\n\n");
      return `**${speaker}** · ${item.timestamp}\n\n${text}`;
    })
    .join("\n\n");
}

const firstBlock = sampleTranscriptItems[0]?.blocks[0];

export const sampleCommentThreads: TranscriptCommentThread[] = firstBlock
  ? [
      {
        id: "thread-mass-page",
        label: speaker1.name,
        anchor: {
          blockId: firstBlock.id,
          revision: firstBlock.revision,
          from: commentedFrom,
          to: commentedFrom + commentedPhrase.length,
          quote: sampleFirstTurnBody.slice(
            commentedFrom,
            commentedFrom + commentedPhrase.length,
          ),
        },
        comments: [
          {
            id: "comment-mass-page",
            author: sampleReader,
            text: "Check this wording against the signed agreement.",
            status: "sent",
          },
        ],
      },
    ]
  : [];
