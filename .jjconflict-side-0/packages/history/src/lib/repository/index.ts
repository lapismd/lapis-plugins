export { RepositoryPlugin } from "./components/repository-plugin.js";
export {
  bindRepository,
  prepareRepositoryLeave,
} from "./controllers/services.js";
export type { RepositoryFactory } from "./controllers/services.js";
export type {
  RepositoryServices,
  HistoryReader,
  RepositoryLeaveMode,
} from "./controllers/history-reader.js";
export { bindTranscriptWriters } from "./controllers/transcript-writers.js";
export { ownedAiHistory } from "./controllers/ai-history.js";
export { nativeIndexedHistory } from "./controllers/native-indexed-search.js";
export { HistoryIndexController } from "./controllers/history-index-controller.js";
export type { IndexedHistoryService } from "./controllers/indexed-search.js";
