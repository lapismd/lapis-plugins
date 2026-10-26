import type { NativeHistoryIndex } from "@lapis-notes/api/native-history-index";
import type { IndexedHistoryService } from "./indexed-search.js";
import {
  indexStatus,
  indexedPage,
  matchContext,
} from "./indexed-search-validation.js";

/** Hosts retain admission and lifetime; this adapter never steps or stops work. */
export function nativeIndexedHistory(
  port: NativeHistoryIndex,
): IndexedHistoryService {
  return {
    start: async () => indexStatus(await port.call({ kind: "start" })),
    status: async () => indexStatus(await port.call({ kind: "status" })),
    query: async (search) =>
      indexedPage(await port.call({ kind: "query", search })),
    context: async (request) =>
      matchContext(await port.call({ kind: "context", ...request })),
  };
}
