# Bases compatibility with Obsidian

Documentation reviewed: 2026-11-12. This is documentation-derived acceptance against Lapis source, not a live Obsidian differential test.

63 supported, 8 partial, 9 gaps, 9 requiring manual review. Counts describe the selected probes, not a percentage of product parity.

Run `pnpm audit:bases` to check behavior and report freshness; `pnpm audit:bases:update` explicitly accepts changed results. Run `pnpm audit:bases:upstream` to detect upstream documentation drift. See [audit workflow](README.md).

## Priority

P0: imported filters silently broaden results. P1: filter/formula evaluation and typed values. P2: view, rendering, grouping, and integration acceptance.

## Feature inventory

Supported means all listed probes passed; partial means some passed; gap means none passed. Review-required entries carry source-review evidence and need governed UI or integration acceptance. Parser-only probes never establish evaluator support.

| ID | Priority | Feature | Result | Probes | Notes |
| --- | --- | --- | --- | --- | --- |
| BASES-YAML-001 | P0 | [Global string filters](https://help.obsidian.md/bases/syntax) | supported | 2/2 | Global string predicates normalize to a single-expression AND group; object filters remain supported. |
| BASES-YAML-002 | P0 | [Per-view filters key](https://help.obsidian.md/bases/syntax) | supported | 2/2 | Obsidian views[].filters imports into the native singular filter model; native filter wins when both keys exist, and writes retain the Lapis format. |
| BASES-YAML-003 | P0 | [Global AND view filters](https://help.obsidian.md/bases/syntax) | supported | 2/2 | Global and per-view predicates compose with AND for imported and native documents. |
| BASES-FILTER-001 | P1 | [Recursive and/or/not groups](https://help.obsidian.md/bases/syntax) | supported | 4/4 | Full loader-to-query acceptance; not excludes any matching child. |
| BASES-FILTER-002 | P1 | [Comparison operators](https://help.obsidian.md/bases/syntax) | supported | 7/7 | Standard comparisons, including double-equals, execute through the same lowering boundary as formulas; native single-equals remains accepted. |
| BASES-FILTER-003 | P1 | [Symbolic boolean operators and truthiness](https://help.obsidian.md/bases/syntax) | supported | 7/7 | Symbolic logic and numeric truthiness are compiled to boolean predicates before evaluation. |
| BASES-FILTER-004 | P1 | [Bare, note-dot and bracket properties](https://help.obsidian.md/bases/syntax) | supported | 3/3 | Bracketed note keys use typed literal-key lookups, preserving whitespace, dots and reserved names. |
| BASES-FILTER-005 | P1 | [Arithmetic and precedence](https://help.obsidian.md/bases/syntax) | supported | 4/4 | Arithmetic precedence, grouping, unary minus, division and modulo. |
| BASES-FORMULA-001 | P1 | [Formula references in filters](https://help.obsidian.md/bases/syntax) | supported | 2/2 | Dotted and bracketed formula references resolve through the same execution compiler without rewriting string literals. |
| BASES-FORMULA-002 | P1 | [Formula chains and formula sorting](https://help.obsidian.md/bases/syntax) | supported | 2/2 | Formula chains preserve arithmetic precedence and both formula-ID spellings sort by evaluated values. |
| BASES-CONTEXT-001 | P1 | [this binding](https://help.obsidian.md/bases/syntax) | gap | 0/1 | A query has no owning-note binding in BasesTable or QueryController; real embed ownership needs a host fixture. |
| BASES-DATE-001 | P1 | [Date fields and arithmetic](https://help.obsidian.md/bases/syntax) | partial | 4/6 | Date fields include clock components. Date arithmetic remains explicitly unresolved; passing field probes do not establish arithmetic support. |
| BASES-FILE-001 | P1 | [File fields](https://help.obsidian.md/bases/syntax) | supported | 7/7 | The runtime basename uses the extension-free TFile.basename field; other selected metadata fields remain unchanged. |
| BASES-LINK-001 | P1 | [Frontmatter links resolve as typed links](https://help.obsidian.md/bases/syntax) | gap | 0/2 | Documented wikilinks support asFile and file comparisons; current metadata keeps raw strings. |
| BASES-FUNC-001 | P1 | [global.escapeHTML](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-002 | P1 | [global.date](https://help.obsidian.md/bases/functions) | supported | 2/2 | Accept ISO and documented space-separated date/time strings, preserving existing native and epoch constructors. |
| BASES-FUNC-003 | P1 | [global.duration](https://help.obsidian.md/bases/functions) | supported | 3/3 | Accept documented shorthand durations, distinguishing M (month) from m (minute), while retaining native ISO durations. |
| BASES-FUNC-004 | P1 | [global.file](https://help.obsidian.md/bases/functions) | gap | 0/1 | A path must resolve to a File object; returning the path text is insufficient. |
| BASES-FUNC-005 | P1 | [global.html](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-006 | P1 | [global.if](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-007 | P1 | [global.image](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-008 | P1 | [global.icon](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-009 | P1 | [global.link](https://help.obsidian.md/bases/functions) | gap | 0/1 | Checks typed file resolution; display overload needs host rendering acceptance. |
| BASES-FUNC-010 | P1 | [global.list](https://help.obsidian.md/bases/functions) | supported | 2/2 | An existing list must remain unchanged rather than becoming a nested list. |
| BASES-FUNC-011 | P1 | [global.max](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-012 | P1 | [global.min](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-013 | P1 | [global.now](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-014 | P1 | [global.number](https://help.obsidian.md/bases/functions) | supported | 3/3 | Date objects coerce to epoch milliseconds; existing scalar coercions remain available. |
| BASES-FUNC-015 | P1 | [global.today](https://help.obsidian.md/bases/functions) | supported | 2/2 | today() returns local midnight; now() retains the clock. |
| BASES-FUNC-016 | P1 | [global.random](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-017 | P1 | [any.isTruthy](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-018 | P1 | [any.isType](https://help.obsidian.md/bases/functions) | supported | 3/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-019 | P1 | [any.toString](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-020 | P1 | [date.date](https://help.obsidian.md/bases/functions) | supported | 2/2 | date.date() clears the clock before chained formatting. |
| BASES-FUNC-021 | P1 | [date.format](https://help.obsidian.md/bases/functions) | supported | 2/2 | Date format uses Moment token semantics, including literals and ordinals; native SQL format remains unchanged. |
| BASES-FUNC-022 | P1 | [date.time](https://help.obsidian.md/bases/functions) | supported | 1/1 | Date and native JavaScript Date helpers return HH:mm:ss rather than an ISO timestamp with an offset. |
| BASES-FUNC-023 | P1 | [date.relative](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-024 | P1 | [date.isEmpty](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-025 | P1 | [string.contains](https://help.obsidian.md/bases/functions) | partial | 1/2 | functions-core.ts lowercases both operands; Obsidian follows JavaScript case sensitivity. |
| BASES-FUNC-026 | P1 | [string.containsAll](https://help.obsidian.md/bases/functions) | partial | 1/2 | Check canonical containsAll spelling and case sensitivity, independently of Lapis containsAllOf alias. |
| BASES-FUNC-027 | P1 | [string.containsAny](https://help.obsidian.md/bases/functions) | partial | 1/2 | Check canonical containsAny spelling and case sensitivity, independently of Lapis containsAnyOf alias. |
| BASES-FUNC-028 | P1 | [string.endsWith](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-029 | P1 | [string.isEmpty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-030 | P1 | [string.lower](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-031 | P1 | [string.replace](https://help.obsidian.md/bases/functions) | partial | 1/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-032 | P1 | [string.repeat](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-033 | P1 | [string.reverse](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-034 | P1 | [string.slice](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-035 | P1 | [string.split](https://help.obsidian.md/bases/functions) | partial | 2/3 | String separators accept the optional split limit. Regular-expression literal parsing remains an unresolved gap. |
| BASES-FUNC-036 | P1 | [string.startsWith](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-037 | P1 | [string.title](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-038 | P1 | [string.trim](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-039 | P1 | [number.abs](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-040 | P1 | [number.ceil](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-041 | P1 | [number.floor](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-042 | P1 | [number.isEmpty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Present zero values are not empty; missing values still are. |
| BASES-FUNC-043 | P1 | [number.round](https://help.obsidian.md/bases/functions) | partial | 1/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-044 | P1 | [number.toFixed](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-045 | P1 | [list.contains](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-046 | P1 | [list.containsAll](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-047 | P1 | [list.containsAny](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-048 | P1 | [list.filter](https://help.obsidian.md/bases/functions) | supported | 3/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-049 | P1 | [list.flat](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-050 | P1 | [list.isEmpty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-051 | P1 | [list.join](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-052 | P1 | [list.map](https://help.obsidian.md/bases/functions) | supported | 3/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-053 | P1 | [list.reduce](https://help.obsidian.md/bases/functions) | supported | 3/3 | Method reduce evaluates expression then initial value with lexical acc/value/index; native direct-helper ordering is preserved. |
| BASES-FUNC-054 | P1 | [list.reverse](https://help.obsidian.md/bases/functions) | partial | 1/2 | Return values match; documented in-place mutation remains an explicit intentional difference. |
| BASES-FUNC-055 | P1 | [list.slice](https://help.obsidian.md/bases/functions) | supported | 3/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-056 | P1 | [list.sort](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-057 | P1 | [list.unique](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-058 | P1 | [link.asFile](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-059 | P1 | [link.linksTo](https://help.obsidian.md/bases/functions) | gap | 0/1 | Must inspect the source file's outgoing links rather than compare the two paths. |
| BASES-FUNC-060 | P1 | [file.asLink](https://help.obsidian.md/bases/functions) | gap | 0/1 | Requires a typed link with resolution rather than a wikilink string. |
| BASES-FUNC-061 | P1 | [file.hasLink](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-062 | P1 | [file.hasProperty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-063 | P1 | [file.hasTag](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-064 | P1 | [file.inFolder](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-065 | P1 | [object.isEmpty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Plain objects with no own properties are empty; date and duration objects remain non-empty. |
| BASES-FUNC-066 | P1 | [object.keys](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-067 | P1 | [object.values](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-068 | P1 | [regular-expression.matches](https://help.obsidian.md/bases/functions) | gap | 0/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-VIEW-001 | P2 | [Table, cards, list, Kanban and Activity](https://help.obsidian.md/bases/views) | review-required | 0/0 | Registrations and governed stories exist. Layout names do not establish compatibility with every Obsidian view setting. |
| BASES-VIEW-002 | P2 | [Interactive map](https://help.obsidian.md/bases/views) | review-required | 0/0 | Map renders an explicit unavailable surface; interactive map/provider support remains absent. |
| BASES-VIEW-003 | P2 | [Sort, group, manual groups and collapse](https://help.obsidian.md/bases/views) | review-required | 0/0 | Basic sorting and grouping exist; manual group ordering, hidden groups and explicit empty groups need separate acceptance. |
| BASES-VIEW-004 | P2 | [Default and custom summaries](https://help.obsidian.md/bases/syntax) | review-required | 0/0 | Built-in summary branches exist, but grouped and arbitrary custom formula semantics are not fully qualified. |
| BASES-VIEW-005 | P2 | [Embeds and named-view fragments](https://help.obsidian.md/bases/views) | review-required | 0/0 | Read-only file and fenced embeds exist; Obsidian ![[File.base#View]] selection requires focused host acceptance. |
| BASES-VIEW-006 | P2 | [Search, edit, create, export and clipboard](https://help.obsidian.md/bases/views) | review-required | 0/0 | Lapis has governed workflow and editable-cell stories; copying formatted results and complete Obsidian workflow parity are unverified. |
| BASES-FORMULA-003 | P1 | [Circular references and diagnostics](https://help.obsidian.md/bases/syntax) | supported | 2/2 | The execution compiler rejects circular and unknown formula references; the UI retains its editing toolbar and shows a bounded error. Source and governed story regressions cover this behavior. |

## Retained differences

These flags explain retained behavior or deferred scope. They do not turn failing Obsidian expectations into passes.

| ID | Disposition | Rationale and evidence |
| --- | --- | --- |
| BASES-YAML-002 | intentional | Retain the native singular filter model/write format for existing documents and integrations; import the Obsidian spelling at the read boundary. Evidence: document-core.ts; models.ts; serializeBasesDocument; LN-BASE-003 |
| BASES-CONTEXT-001 | deferred | Host-specific this binding needs an explicit owning-file context contract; do not infer it from a global App. Evidence: LN-BASE-012; QueryController and BasesTable |
| BASES-LINK-001 | deferred | Typed link/file resolution requires the complete host-owned value-wrapper contract, not a string approximation. Evidence: LN-BASE-012; functions-core.ts; bases.svelte.ts |
| BASES-FUNC-004 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-005 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-007 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-008 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-009 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-010 | intentional | Keep the native variadic list extension in addition to single-list preservation. Evidence: functions.ts VARARG registration; functions.test.ts list(a,b,c) |
| BASES-FUNC-025 | intentional | Keep case-insensitive text matching so existing saved filters retain their meaning. Obsidian case sensitivity remains a reported difference. Evidence: functions-core.ts contains; functions.test.ts existing-semantics regression |
| BASES-FUNC-026 | intentional | Keep the established case-insensitive canonical alias and containsAllOf extension. Evidence: functions.test.ts registers upstream contains aliases with existing semantics |
| BASES-FUNC-027 | intentional | Keep the established case-insensitive canonical alias and containsAnyOf extension. Evidence: functions.test.ts registers upstream contains aliases with existing semantics |
| BASES-FUNC-054 | intentional | Retain native copy-returning reverse semantics so query transforms do not mutate indexed note metadata or their input lists. Obsidian documents in-place reverse; its mutation expectation remains a visible failing probe. Evidence: functions-core.ts reverseList; functions.test.ts input preservation; LN-BASE-048 |
| BASES-FUNC-058 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-059 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-FUNC-060 | deferred | Complete typed file/link or rendered-value wrappers are a separate host integration feature. Existing scalar helpers are retained without claiming wrapper parity. Evidence: LN-BASE-012; functions-core.ts and bases.svelte.ts value conversion |
| BASES-VIEW-002 | deferred | The current product deliberately renders map-unavailable until a real provider is supplied. Evidence: LN-BASE-005/012; map-view/view.svelte |

## Failing probes

### BASES-CONTEXT-001: this binding

Owner: lapis-plugins/packages/bases. A query has no owning-note binding in BasesTable or QueryController; real embed ownership needs a host fixture.

- this-file — `this.file.path`: expected `"Notes/Context.md"`; error `column is not structured: object`.

### BASES-DATE-001: Date fields and arithmetic

Owner: lapis-plugins/packages/bases. Date fields include clock components. Date arithmetic remains explicitly unresolved; passing field probes do not establish arithmetic support.

- add-month — `(date("2024-12-01") + "1M").format("YYYY-MM-DD")`: expected `"2025-01-01"`; error `Unsupported operator(+): (datetime + string)`.
- date-difference — `number(date("2025-01-03") - date("2025-01-01"))`: expected `172800000`; actual `0`.

### BASES-LINK-001: Frontmatter links resolve as typed links

Owner: lapis-plugins/packages/bases. Documented wikilinks support asFile and file comparisons; current metadata keeps raw strings.

- frontmatter-link — `authors[0].asFile().name`: expected `"Beta.md"`; error `Invalid Bases expression.`.
- link-equality — `link("Notes/Beta.md") == link("[[Notes/Beta.md]]")`: expected `true`; actual `false`.

### BASES-FUNC-004: global.file

Owner: lapis-plugins/packages/bases. A path must resolve to a File object; returning the path text is insufficient.

- example-1 — `file("Notes/Beta.md").name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-009: global.link

Owner: lapis-plugins/packages/bases. Checks typed file resolution; display overload needs host rendering acceptance.

- example-1 — `link("Notes/Beta.md").asFile().name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-025: string.contains

Owner: lapis-plugins/packages/bases. functions-core.ts lowercases both operands; Obsidian follows JavaScript case sensitivity.

- example-2 — `"hello".contains("H")`: expected `false`; actual `true`.

### BASES-FUNC-026: string.containsAll

Owner: lapis-plugins/packages/bases. Check canonical containsAll spelling and case sensitivity, independently of Lapis containsAllOf alias.

- example-2 — `"hello".containsAll("H", "e")`: expected `false`; actual `true`.

### BASES-FUNC-027: string.containsAny

Owner: lapis-plugins/packages/bases. Check canonical containsAny spelling and case sensitivity, independently of Lapis containsAnyOf alias.

- example-2 — `"hello".containsAny("H", "X")`: expected `false`; actual `true`.

### BASES-FUNC-031: string.replace

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-2 — `"a:b:c".replace(/:/, "-")`: expected `"a-b:c"`; error `Invalid Bases expression.`.
- example-3 — `"a:b:c".replace(/:/g, "-")`: expected `"a-b-c"`; error `Invalid Bases expression.`.

### BASES-FUNC-035: string.split

Owner: lapis-plugins/packages/bases. String separators accept the optional split limit. Regular-expression literal parsing remains an unresolved gap.

- example-3 — `"a,b,c".split(/,/)`: expected `["a","b","c"]`; error `Invalid Bases expression.`.

### BASES-FUNC-043: number.round

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `(2.5).round()`: expected `3`; actual `2.5`.

### BASES-FUNC-054: list.reverse

Owner: lapis-plugins/packages/bases. Return values match; documented in-place mutation remains an explicit intentional difference.

- documented-in-place-mutation — `[[1,2]].map([list(value).reverse(), value])`: expected `[[[2,1],[2,1]]]`; actual `[[[2,1],[1,2]]]`.

### BASES-FUNC-058: link.asFile

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `link("Notes/Beta.md").asFile().name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-059: link.linksTo

Owner: lapis-plugins/packages/bases. Must inspect the source file's outgoing links rather than compare the two paths.

- example-1 — `link("Notes/Alpha.md").linksTo("Notes/Beta.md")`: expected `true`; actual `false`.

### BASES-FUNC-060: file.asLink

Owner: lapis-plugins/packages/bases. Requires a typed link with resolution rather than a wikilink string.

- example-1 — `file.asLink().asFile().name`: expected `"Alpha.md"`; error `no function matches "asLink(tfile)" name and argument type`.

### BASES-FUNC-067: object.values

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `file.properties.values()`: expected `["open",12,3,["book/fiction"],["[[Notes/Beta.md]]"],{}]`; error `Invalid Bases expression.`.

### BASES-FUNC-068: regular-expression.matches

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `/abc/.matches("abcde")`: expected `true`; error `Invalid Bases expression.`.
- example-2 — `/abc/.matches("xyz")`: expected `false`; error `Invalid Bases expression.`.

## Sources

- [en/Bases/Bases syntax.md](https://help.obsidian.md/bases/syntax), Git blob `65dd0471cbf01b39d0a589caf18a641345ef34c8`.
- [en/Bases/Functions.md](https://help.obsidian.md/bases/functions), Git blob `2ccb467c2e9dc779ddad95045f6705c61abbbd77`.
- [en/Bases/Views.md](https://help.obsidian.md/bases/views), Git blob `ba1b6f896c142fdde83bf825f3dc82d1496eec80`.
