import "./styles.css";

export { default as manifest } from "../manifest.json";
export { TRANSCRIPTS_PLUGIN_ID } from "./lib/ids";
export { TRANSCRIPT_FILENAME_PATTERN } from "./lib/transcript-association";
export { TranscriptsPlugin } from "./lib/transcripts-plugin";
export { default } from "./lib/transcripts-plugin";
export { default as TranscriptReading } from "./lib/TranscriptReading.svelte";
export {
  sampleCommentThreads,
  sampleFirstTurnBody,
  samplePlayheadLabel,
  samplePlayingTurnId,
  sampleReader,
  sampleSpeakerCount,
  sampleTranscriptItems,
  sampleTranscriptMarkdown,
  sampleTranscriptPath,
  sampleTranscriptRevision,
} from "./lib/sample-turns";
export {
  samplePlainTranscript,
  sampleTranscriptFormats,
} from "./lib/sample-formats";
export { sampleSavedComment } from "./lib/sample-document";
export {
  TRANSCRIPT_READING_VIEW,
  TranscriptReadingView,
} from "./lib/views/reading-view";
