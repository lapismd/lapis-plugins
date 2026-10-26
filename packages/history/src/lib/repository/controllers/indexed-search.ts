import type {
  HistoryIndexCommand,
  HistoryIndexQuery,
  HistoryIndexProgress,
  HistoryIndexPage,
  HistoryIndexContext,
} from "@lapis-notes/api/native-history-index";

export type {
  HistoryExpression,
  HistoryIndexProgress as HistoryIndexStatus,
  HistoryIndexHit as IndexedHistoryHit,
  HistoryIndexPage as IndexedHistoryPage,
  HistoryIndexContext as HistoryMatchContext,
} from "@lapis-notes/api/native-history-index";

/** Native owners schedule all indexing; renderers observe and query saved data. */
export interface IndexedHistoryService {
  start(): Promise<HistoryIndexProgress>;
  status(): Promise<HistoryIndexProgress>;
  query(request: HistoryIndexQuery): Promise<HistoryIndexPage>;
  context(
    request: Omit<Extract<HistoryIndexCommand, { kind: "context" }>, "kind">,
  ): Promise<HistoryIndexContext>;
}
