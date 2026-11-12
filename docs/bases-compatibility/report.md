# Bases compatibility with Obsidian

Documentation reviewed: 2026-11-12. This is documentation-derived acceptance against Lapis source, not a live Obsidian differential test.

35 supported, 19 partial, 25 gaps, 10 requiring manual review. Counts describe the selected probes, not a percentage of product parity.

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
| BASES-FILTER-002 | P1 | [Comparison operators](https://help.obsidian.md/bases/syntax) | partial | 6/7 | Exact resulting files, including zero values. |
| BASES-FILTER-003 | P1 | [Symbolic boolean operators and truthiness](https://help.obsidian.md/bases/syntax) | partial | 3/7 | Parser acceptance alone does not prove logical evaluation. |
| BASES-FILTER-004 | P1 | [Bare, note-dot and bracket properties](https://help.obsidian.md/bases/syntax) | partial | 2/3 | All documented property access forms must refer to the same frontmatter. |
| BASES-FILTER-005 | P1 | [Arithmetic and precedence](https://help.obsidian.md/bases/syntax) | supported | 4/4 | Arithmetic precedence, grouping, unary minus, division and modulo. |
| BASES-FORMULA-001 | P1 | [Formula references in filters](https://help.obsidian.md/bases/syntax) | partial | 1/2 | filter-parser.ts substitutes bracket references but its dotted-reference pattern says filter rather than formula. |
| BASES-FORMULA-002 | P1 | [Formula chains and formula sorting](https://help.obsidian.md/bases/syntax) | partial | 1/2 | Query generation must resolve formula dependencies and sort their evaluated values. |
| BASES-CONTEXT-001 | P1 | [this binding](https://help.obsidian.md/bases/syntax) | gap | 0/1 | A query has no owning-note binding in BasesTable or QueryController; real embed ownership needs a host fixture. |
| BASES-DATE-001 | P1 | [Date fields and arithmetic](https://help.obsidian.md/bases/syntax) | partial | 2/4 | Luxon values must implement the documented Bases date and duration semantics. |
| BASES-FILE-001 | P1 | [File fields](https://help.obsidian.md/bases/syntax) | partial | 6/7 | Tests runtime metadata, not display wrappers; tags include nested frontmatter tags. |
| BASES-LINK-001 | P1 | [Frontmatter links resolve as typed links](https://help.obsidian.md/bases/syntax) | gap | 0/2 | Documented wikilinks support asFile and file comparisons; current metadata keeps raw strings. |
| BASES-FUNC-001 | P1 | [global.escapeHTML](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-002 | P1 | [global.date](https://help.obsidian.md/bases/functions) | partial | 1/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-003 | P1 | [global.duration](https://help.obsidian.md/bases/functions) | gap | 0/2 | Obsidian shorthand units differ from Luxon ISO durations. |
| BASES-FUNC-004 | P1 | [global.file](https://help.obsidian.md/bases/functions) | gap | 0/1 | A path must resolve to a File object; returning the path text is insufficient. |
| BASES-FUNC-005 | P1 | [global.html](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-006 | P1 | [global.if](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-007 | P1 | [global.image](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-008 | P1 | [global.icon](https://help.obsidian.md/bases/functions) | review-required | 0/0 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-009 | P1 | [global.link](https://help.obsidian.md/bases/functions) | gap | 0/1 | Checks typed file resolution; display overload needs host rendering acceptance. |
| BASES-FUNC-010 | P1 | [global.list](https://help.obsidian.md/bases/functions) | partial | 1/2 | An existing list must remain unchanged rather than becoming a nested list. |
| BASES-FUNC-011 | P1 | [global.max](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-012 | P1 | [global.min](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-013 | P1 | [global.now](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-014 | P1 | [global.number](https://help.obsidian.md/bases/functions) | partial | 2/3 | Date coercion must return epoch milliseconds. |
| BASES-FUNC-015 | P1 | [global.today](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-016 | P1 | [global.random](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-017 | P1 | [any.isTruthy](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-018 | P1 | [any.isType](https://help.obsidian.md/bases/functions) | supported | 3/3 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-019 | P1 | [any.toString](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-020 | P1 | [date.date](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-021 | P1 | [date.format](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-022 | P1 | [date.time](https://help.obsidian.md/bases/functions) | gap | 0/1 | Obsidian returns HH:mm:ss; Luxon ISO time includes offsets and milliseconds. |
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
| BASES-FUNC-035 | P1 | [string.split](https://help.obsidian.md/bases/functions) | partial | 1/3 | Check optional limit and RegExp overloads, not only the two-argument string form. |
| BASES-FUNC-036 | P1 | [string.startsWith](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-037 | P1 | [string.title](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-038 | P1 | [string.trim](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-039 | P1 | [number.abs](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-040 | P1 | [number.ceil](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-041 | P1 | [number.floor](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-042 | P1 | [number.isEmpty](https://help.obsidian.md/bases/functions) | partial | 1/2 | A present numeric zero is not empty. |
| BASES-FUNC-043 | P1 | [number.round](https://help.obsidian.md/bases/functions) | partial | 1/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-044 | P1 | [number.toFixed](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-045 | P1 | [list.contains](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-046 | P1 | [list.containsAll](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-047 | P1 | [list.containsAny](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-048 | P1 | [list.filter](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-049 | P1 | [list.flat](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-050 | P1 | [list.isEmpty](https://help.obsidian.md/bases/functions) | partial | 1/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-051 | P1 | [list.join](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-052 | P1 | [list.map](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-053 | P1 | [list.reduce](https://help.obsidian.md/bases/functions) | gap | 0/1 | Obsidian takes expression then initial value, with acc; Lapis callback uses accumulator. |
| BASES-FUNC-054 | P1 | [list.reverse](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-055 | P1 | [list.slice](https://help.obsidian.md/bases/functions) | gap | 0/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-056 | P1 | [list.sort](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-057 | P1 | [list.unique](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-058 | P1 | [link.asFile](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-059 | P1 | [link.linksTo](https://help.obsidian.md/bases/functions) | gap | 0/1 | Must inspect the source file's outgoing links rather than compare the two paths. |
| BASES-FUNC-060 | P1 | [file.asLink](https://help.obsidian.md/bases/functions) | gap | 0/1 | Requires a typed link with resolution rather than a wikilink string. |
| BASES-FUNC-061 | P1 | [file.hasLink](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-062 | P1 | [file.hasProperty](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-063 | P1 | [file.hasTag](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-064 | P1 | [file.inFolder](https://help.obsidian.md/bases/functions) | supported | 2/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-065 | P1 | [object.isEmpty](https://help.obsidian.md/bases/functions) | partial | 1/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-066 | P1 | [object.keys](https://help.obsidian.md/bases/functions) | supported | 1/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-067 | P1 | [object.values](https://help.obsidian.md/bases/functions) | gap | 0/1 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-FUNC-068 | P1 | [regular-expression.matches](https://help.obsidian.md/bases/functions) | gap | 0/2 | Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior. |
| BASES-VIEW-001 | P2 | [Table, cards, list, Kanban and Activity](https://help.obsidian.md/bases/views) | review-required | 0/0 | Registrations and governed stories exist. Layout names do not establish compatibility with every Obsidian view setting. |
| BASES-VIEW-002 | P2 | [Interactive map](https://help.obsidian.md/bases/views) | review-required | 0/0 | Map renders an explicit unavailable surface; interactive map/provider support remains absent. |
| BASES-VIEW-003 | P2 | [Sort, group, manual groups and collapse](https://help.obsidian.md/bases/views) | review-required | 0/0 | Basic sorting and grouping exist; manual group ordering, hidden groups and explicit empty groups need separate acceptance. |
| BASES-VIEW-004 | P2 | [Default and custom summaries](https://help.obsidian.md/bases/syntax) | review-required | 0/0 | Built-in summary branches exist, but grouped and arbitrary custom formula semantics are not fully qualified. |
| BASES-VIEW-005 | P2 | [Embeds and named-view fragments](https://help.obsidian.md/bases/views) | review-required | 0/0 | Read-only file and fenced embeds exist; Obsidian ![[File.base#View]] selection requires focused host acceptance. |
| BASES-VIEW-006 | P2 | [Search, edit, create, export and clipboard](https://help.obsidian.md/bases/views) | review-required | 0/0 | Lapis has governed workflow and editable-cell stories; copying formatted results and complete Obsidian workflow parity are unverified. |
| BASES-FORMULA-003 | P1 | [Circular references and diagnostics](https://help.obsidian.md/bases/syntax) | review-required | 0/0 | Formula substitution repeatedly rewrites bracket references without cycle detection. Deliberate cyclic input is not executed in-process because it can hang. |

## Failing probes

### BASES-FILTER-002: Comparison operators

Owner: lapis-plugins/packages/bases. Exact resulting files, including zero values.

- equals — `{"and":["price == 4"]}`: expected `["beta"]`; error `Error processing statement Error: syntax error at or near: "="`.

### BASES-FILTER-003: Symbolic boolean operators and truthiness

Owner: lapis-plugins/packages/bases. Parser acceptance alone does not prove logical evaluation.

- and — `{"and":["status == \"open\" && price > 5"]}`: expected `["alpha"]`; error `Error processing statement Error: syntax error at or near: "="`.
- or — `{"and":["price > 5 \|\| price == 0"]}`: expected `["alpha","gamma"]`; error `Error processing statement Error: syntax error at or near: "="`.
- not — `{"and":["!(status == \"done\")"]}`: expected `["alpha","gamma"]`; error `Error processing statement Error: syntax error at or near: "="`.
- truthy — `{"and":["price"]}`: expected `["alpha","beta"]`; error `argument of WHERE must be type boolean, not type number`.

### BASES-FILTER-004: Bare, note-dot and bracket properties

Owner: lapis-plugins/packages/bases. All documented property access forms must refer to the same frontmatter.

- bracket — `{"and":["note[\"status\"] != \"open\""]}`: expected `["beta"]`; error `column 'status'::note type is not subscriptable:`.

### BASES-FORMULA-001: Formula references in filters

Owner: lapis-plugins/packages/bases. filter-parser.ts substitutes bracket references but its dotted-reference pattern says filter rather than formula.

- dot — `{"formulas":{"ppu":"price / age"},"filters":{"and":["formula.ppu > 3"]},"views":[{"type":"table","name":"Table","order":["file.path"]}]}`: expected `["alpha"]`; error `column is not structured: object`.

### BASES-FORMULA-002: Formula chains and formula sorting

Owner: lapis-plugins/packages/bases. Query generation must resolve formula dependencies and sort their evaluated values.

- sort — `{"formulas":{"ppu":"price / age"},"views":[{"type":"table","name":"Table","order":["formula.ppu"],"sort":[{"property":"formula.ppu","direction":"ASC"}]}]}`: expected `["gamma","beta","alpha"]`; actual `["alpha","beta","gamma"]`.

### BASES-CONTEXT-001: this binding

Owner: lapis-plugins/packages/bases. A query has no owning-note binding in BasesTable or QueryController; real embed ownership needs a host fixture.

- this-file — `this.file.path`: expected `"Notes/Context.md"`; error `column is not structured: object`.

### BASES-DATE-001: Date fields and arithmetic

Owner: lapis-plugins/packages/bases. Luxon values must implement the documented Bases date and duration semantics.

- add-month — `(date("2024-12-01") + "1M").format("YYYY-MM-DD")`: expected `"2025-01-01"`; error `Unsupported operator(+): (datetime + string)`.
- date-difference — `number(date("2025-01-03") - date("2025-01-01"))`: expected `172800000`; actual `0`.

### BASES-FILE-001: File fields

Owner: lapis-plugins/packages/bases. Tests runtime metadata, not display wrappers; tags include nested frontmatter tags.

- basename — `file.basename`: expected `"Alpha"`; actual `"Alpha.md"`.

### BASES-LINK-001: Frontmatter links resolve as typed links

Owner: lapis-plugins/packages/bases. Documented wikilinks support asFile and file comparisons; current metadata keeps raw strings.

- frontmatter-link — `authors[0].asFile().name`: expected `"Beta.md"`; error `Error processing statement Error: syntax error at or near: "0",Error: syntax error at or near: ""`.
- link-equality — `link("Notes/Beta.md") == link("[[Notes/Beta.md]]")`: expected `true`; error `Error processing statement Error: syntax error at or near: "="`.

### BASES-FUNC-002: global.date

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-2 — `date("2025-01-02 12:30:00")`: expected `"2025-01-02T12:30:00.000Z"`; actual `null`.

### BASES-FUNC-003: global.duration

Owner: lapis-plugins/packages/bases. Obsidian shorthand units differ from Luxon ISO durations.

- example-1 — `duration("1d")`: expected `86400000`; actual `null`.
- example-2 — `duration("2 hours")`: expected `7200000`; actual `null`.

### BASES-FUNC-004: global.file

Owner: lapis-plugins/packages/bases. A path must resolve to a File object; returning the path text is insufficient.

- example-1 — `file("Notes/Beta.md").name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-009: global.link

Owner: lapis-plugins/packages/bases. Checks typed file resolution; display overload needs host rendering acceptance.

- example-1 — `link("Notes/Beta.md").asFile().name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-010: global.list

Owner: lapis-plugins/packages/bases. An existing list must remain unchanged rather than becoming a nested list.

- example-2 — `list([1,2])`: expected `[1,2]`; actual `[[1,2]]`.

### BASES-FUNC-014: global.number

Owner: lapis-plugins/packages/bases. Date coercion must return epoch milliseconds.

- example-3 — `number(date("1970-01-02"))`: expected `86400000`; actual `null`.

### BASES-FUNC-015: global.today

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `today().hour`: expected `0`; error `structured type has no attribute "hour"`.

### BASES-FUNC-020: date.date

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `date("2025-01-02T12:30:00").date()`: expected `"2025-01-02T00:00:00.000Z"`; actual `"2025-01-02T12:30:00.000Z"`.

### BASES-FUNC-021: date.format

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `date("2025-01-02").format("YYYY-MM-DD")`: expected `"2025-01-02"`; error `no function matches "format(datetime, string)" name and argument type`.

### BASES-FUNC-022: date.time

Owner: lapis-plugins/packages/bases. Obsidian returns HH:mm:ss; Luxon ISO time includes offsets and milliseconds.

- example-1 — `date("2025-01-02T12:30:00").time()`: expected `"12:30:00"`; error `Error processing statement Error: syntax error at or near: "time",Error: syntax error at or near: ""`.

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

- example-2 — `"a:b:c".replace(/:/, "-")`: expected `"a-b:c"`; error `Error processing statement Error: syntax error at or near: "",Error: syntax error at or near: "",Error: syntax error at or near: "",Error: syntax error at or near: ")"`.
- example-3 — `"a:b:c".replace(/:/g, "-")`: expected `"a-b-c"`; error `Invalid query stack(2):`.

### BASES-FUNC-035: string.split

Owner: lapis-plugins/packages/bases. Check optional limit and RegExp overloads, not only the two-argument string form.

- example-2 — `"a,b,c".split(",",2)`: expected `["a","b"]`; error `no function matches "split(string, string, integer)" name and argument type`.
- example-3 — `"a,b,c".split(/,/)`: expected `["a","b","c"]`; error `Error processing statement Error: syntax error at or near: "/,",Error: syntax error at or near: "/"`.

### BASES-FUNC-042: number.isEmpty

Owner: lapis-plugins/packages/bases. A present numeric zero is not empty.

- example-1 — `(0).isEmpty()`: expected `false`; actual `true`.

### BASES-FUNC-043: number.round

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `(2.5).round()`: expected `3`; actual `2.5`.

### BASES-FUNC-045: list.contains

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3].contains(2)`: expected `true`; error `no function matches "contains(Array<integer>, integer)" name and argument type`.

### BASES-FUNC-046: list.containsAll

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3].containsAll(2,3)`: expected `true`; error `no function matches "containsAll(Array<integer>, integer, integer)" name and argument type`.

### BASES-FUNC-047: list.containsAny

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3].containsAny(3,4)`: expected `true`; error `no function matches "containsAny(Array<integer>, integer, integer)" name and argument type`.

### BASES-FUNC-048: list.filter

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3,4].filter(value > 2)`: expected `[3,4]`; error `Error processing statement Error: syntax error at or near: "filter("`.

### BASES-FUNC-049: list.flat

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,[2,3]].flat()`: expected `[1,2,3]`; error `Invalid query stack(3):`.

### BASES-FUNC-050: list.isEmpty

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[].isEmpty()`: expected `true`; error `Error processing statement Error: Error: Unsupported Literal node: ⚠,Error: Error: Unsupported Literal node: ⚠,Error: Error: Unsupported Literal node: ⚠,Error: syntax error at or near: ""`.

### BASES-FUNC-051: list.join

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3].join(",")`: expected `"1,2,3"`; error `Error processing statement Error: syntax error at or near: "",Error: syntax error at or near: ""`.

### BASES-FUNC-053: list.reduce

Owner: lapis-plugins/packages/bases. Obsidian takes expression then initial value, with acc; Lapis callback uses accumulator.

- example-1 — `[1,2,3].reduce(acc + value, 0)`: expected `6`; error `Unsupported operator(+): (object + object)`.

### BASES-FUNC-054: list.reverse

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3].reverse()`: expected `[3,2,1]`; error `no function matches "reverse(Array<integer>)" name and argument type`.

### BASES-FUNC-055: list.slice

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,3,4].slice(1,3)`: expected `[2,3]`; error `no function matches "slice(Array<integer>, integer, integer)" name and argument type`.
- example-2 — `[1,2,3].slice(1)`: expected `[2,3]`; error `no function matches "slice(Array<integer>, integer)" name and argument type`.

### BASES-FUNC-056: list.sort

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[3,1,2].sort()`: expected `[1,2,3]`; error `no function matches "sort(Array<integer>)" name and argument type`.

### BASES-FUNC-057: list.unique

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `[1,2,2,3].unique()`: expected `[1,2,3]`; error `Error processing statement Error: syntax error at or near: "unique",Error: syntax error at or near: ""`.

### BASES-FUNC-058: link.asFile

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `link("Notes/Beta.md").asFile().name`: expected `"Beta.md"`; error `column is not structured: string`.

### BASES-FUNC-059: link.linksTo

Owner: lapis-plugins/packages/bases. Must inspect the source file's outgoing links rather than compare the two paths.

- example-1 — `link("Notes/Alpha.md").linksTo("Notes/Beta.md")`: expected `true`; actual `false`.

### BASES-FUNC-060: file.asLink

Owner: lapis-plugins/packages/bases. Requires a typed link with resolution rather than a wikilink string.

- example-1 — `file.asLink().asFile().name`: expected `"Alpha.md"`; error `no function matches "asLink(tfile)" name and argument type`.

### BASES-FUNC-065: object.isEmpty

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-2 — `empty.isEmpty()`: expected `true`; actual `false`.

### BASES-FUNC-067: object.values

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `file.properties.values()`: expected `["open",12,3,["book/fiction"],["[[Notes/Beta.md]]"],{}]`; error `Error processing statement Error: syntax error at or near: "values",Error: syntax error at or near: ""`.

### BASES-FUNC-068: regular-expression.matches

Owner: lapis-plugins/packages/bases. Real query-engine acceptance for the selected examples; does not establish all overloads, null semantics or rendered behavior.

- example-1 — `/abc/.matches("abcde")`: expected `true`; error `Error processing statement Error: syntax error at or near: "/",Error: syntax error at or near: "."`.
- example-2 — `/abc/.matches("xyz")`: expected `false`; error `Error processing statement Error: syntax error at or near: "/",Error: syntax error at or near: "."`.

## Sources

- [en/Bases/Bases syntax.md](https://help.obsidian.md/bases/syntax), Git blob `65dd0471cbf01b39d0a589caf18a641345ef34c8`.
- [en/Bases/Functions.md](https://help.obsidian.md/bases/functions), Git blob `2ccb467c2e9dc779ddad95045f6705c61abbbd77`.
- [en/Bases/Views.md](https://help.obsidian.md/bases/views), Git blob `ba1b6f896c142fdde83bf825f3dc82d1496eec80`.
