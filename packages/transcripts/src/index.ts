import "./styles.css";

export { default as manifest } from "../manifest.json";
export { TRANSCRIPTS_PLUGIN_ID } from "./lib/ids";
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
