import {
  parseSearchQueryAst,
  type SearchQueryExpression,
  type SearchProviderHit,
  type SearchProviderStatus,
  type SearchResultProvider,
  type SearchResultProviderRegistry,
  type SearchResultRequest,
} from "@lapis-notes/api";

export type ProviderResults = {
  provider: SearchResultProvider;
  hits: SearchProviderHit[];
  busy: boolean;
  next?: string;
  generation?: string;
  status?: SearchProviderStatus;
  unavailable?: string;
};
type Input = Omit<SearchResultRequest, "query" | "cursor" | "signal">;

export function searchProviderFields(
  node: SearchQueryExpression | null
): string[] {
  if (!node) return [];
  switch (node.type) {
    case "field":
      return [node.name, ...searchProviderFields(node.value)];
    case "property":
      return ["property"];
    case "group":
      return searchProviderFields(node.expression);
    case "not":
      return searchProviderFields(node.operand);
    case "and":
    case "or":
      return node.clauses.flatMap(searchProviderFields);
    case "literal":
      return node.kind === "regex" ? ["regex"] : [];
    default:
      return [];
  }
}

/** Independent sources publish pages without clearing successful peer results. */
export class SearchProviderController {
  #rows = new Map<string, ProviderResults>();
  #listeners = new Set<(rows: ProviderResults[]) => void>();
  #abort = new AbortController();
  #input?: Input;
  #enabled = false;
  #epoch = 0;
  #timer?: ReturnType<typeof setTimeout>;
  #event;
  constructor(
    readonly registry: SearchResultProviderRegistry,
    readonly report: (error: unknown) => void
  ) {
    this.#event = registry.on("changed", () => {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => {
        if (this.#input) this.search(this.#input, this.#enabled, true);
      }, 75);
    });
  }
  subscribe(listener: (rows: ProviderResults[]) => void) {
    this.#listeners.add(listener);
    listener([...this.#rows.values()]);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #emit() {
    for (const listener of this.#listeners) listener([...this.#rows.values()]);
  }
  search(input: Input, enabled: boolean, retain = false) {
    this.#input = input;
    this.#enabled = enabled;
    this.#abort.abort();
    this.#abort = new AbortController();
    const epoch = ++this.#epoch;
    const previous = this.#rows;
    this.#rows = new Map();
    if (enabled && input.text.trim()) {
      const query = parseSearchQueryAst(input.text);
      if (!query.diagnostics.length)
        for (const provider of this.registry.getAll()) {
          const unsupported = searchProviderFields(query.expression).filter(
            (field) => !provider.fields.includes(field)
          );
          const mode = input.mode === "auto" ? "lexical" : input.mode;
          const unavailable = unsupported.length
            ? `Unsupported filters: ${[...new Set(unsupported)].join(", ")}`
            : !provider.modes.includes(mode)
            ? `${provider.label} supports text search only`
            : undefined;
          const row: ProviderResults = {
            provider,
            hits: retain ? previous.get(provider.id)?.hits ?? [] : [],
            busy: !unavailable,
            unavailable,
          };
          this.#rows.set(provider.id, row);
          if (!unavailable)
            void this.#run(row, epoch, Math.max(input.limit, row.hits.length));
        }
    }
    this.#emit();
  }
  async #run(
    row: ProviderResults,
    epoch: number,
    limit: number,
    append = false
  ) {
    if (!this.#input) return;
    const signal = this.#abort.signal;
    const input = this.#input;
    let hits = append ? [...row.hits] : [];
    let cursor = append ? row.next : undefined;
    const cursors = new Set<string>();
    row.busy = true;
    this.#emit();
    try {
      // Bounded work even when a source returns pages without matches.
      for (let n = 0; n < 32; n++) {
        const page = await row.provider.search({
          ...input,
          query: parseSearchQueryAst(input.text),
          cursor,
          signal,
        });
        if (signal.aborted || epoch !== this.#epoch) return;
        if (cursor && row.generation && row.generation !== page.generation)
          hits = [];
        row.generation = page.generation;
        const merged = new Map(hits.map((hit) => [hit.id, hit]));
        for (const hit of page.hits) merged.set(hit.id, hit);
        hits = [...merged.values()];
        Object.assign(row, { hits, status: page.status, next: page.next });
        this.#emit();
        cursor = page.next;
        if (!cursor || hits.length >= limit) break;
        if (cursors.has(cursor))
          throw new Error("Search provider returned a repeated cursor");
        cursors.add(cursor);
      }
    } catch (error) {
      if (!signal.aborted && epoch === this.#epoch) {
        row.unavailable =
          "Search is temporarily unavailable. Refresh to retry.";
        this.report(error);
      }
    } finally {
      if (epoch === this.#epoch) {
        row.busy = false;
        this.#emit();
      }
    }
  }
  more(id: string) {
    const row = this.#rows.get(id);
    if (row && row.next && !row.busy)
      void this.#run(
        row,
        this.#epoch,
        row.hits.length + (this.#input?.limit ?? 100),
        true
      );
  }
  refresh() {
    if (this.#input) this.search(this.#input, this.#enabled, true);
  }
  close() {
    ++this.#epoch;
    this.#abort.abort();
    clearTimeout(this.#timer);
    this.registry.offref(this.#event);
    this.#listeners.clear();
  }
}
