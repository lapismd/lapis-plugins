export interface SampleTranscriptFormat {
  path: string;
  title: string;
  marker: string;
  markdown: string;
}

/** A qualified transcript whose name does not end in `transcript.md`. */
export const samplePlainTranscript: SampleTranscriptFormat = {
  path: "Notes/Draft meeting.md",
  title: "Draft meeting.md",
  marker: "Please keep the first pass in the note until we agree the wording.",
  markdown: `Speaker 1  (00:12)

Please keep the first pass in the note until we agree the wording.

00:18 Speaker 2

The second turn is enough to qualify this as a transcript.

![[Contract transcript.md]]

![[Agenda.md]]
`,
};

export const sampleEmbeddedNote: SampleTranscriptFormat = {
  path: "Notes/Agenda.md",
  title: "Agenda.md",
  marker: "Bring the signed schedule.",
  markdown: "Bring the signed schedule.\n",
};

export const sampleTranscriptFormats: readonly SampleTranscriptFormat[] = [
  {
    path: "Notes/Time first transcript.md",
    title: "Time first transcript.md",
    marker: "The signed page is twenty-five minutes in.",
    markdown: `00:25:00 Speaker 1

The signed page is twenty-five minutes in.

00:34:00 Speaker 2

The schedule starts thirty-four minutes into the recording.
`,
  },
  {
    path: "Notes/Centisecond transcript.md",
    title: "Centisecond transcript.md",
    marker: "A quarter second sits between these turns.",
    markdown: `---
type: transcript
timestamp_format: mm:ss:cs
---
Speaker 1 (00:25:00)

Twenty-five seconds, read as minutes, seconds, and centiseconds.

00:25:50 Speaker 2

A quarter second sits between these turns.
`,
  },
  {
    path: "Notes/Single turn transcript.md",
    title: "Single turn transcript.md",
    marker: "One declared turn is enough.",
    markdown: `---
type: transcript
---
Speaker 1 (00:10)

One declared turn is enough.
`,
  },
];
