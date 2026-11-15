# Lapis callouts, list callouts and task states

Read this for structured emphasis and task markers. These remain Markdown text;
no plugin-private JSON is needed to author them.

## Block callouts

```markdown
> [!note] Decision
> Preserve the rationale alongside the action.

> [!warning]- Collapsed details
> Hidden initially, expandable in rendered views.

> [!tip]+ Expanded details
> Expanded initially, with a collapse control.
```

A plain callout has no folding marker. Minus starts collapsed and plus starts
expanded. Common types include note, info, todo, tip, important, warning, danger,
error, success, failure, question, example, quote and abstract. Supported aliases
include summary/tldr, hint, check/done, faq/help, caution/attention, fail/missing
and cite. Unknown types retain their type and fall back to a generic icon;
a custom visual still depends on the installed renderer/extension.

Nested callouts use nested blockquote prefixes. Keep the inner content quoted
and preserve blank quoted lines when they separate paragraphs.

## Lapis list callouts

List callouts highlight an individual list item without converting the whole
item into a blockquote. Default markers include & for highlighting, @ for
documentation and ? for a question:

```markdown
- & Important context for this item.
- @ Documentation to read before proceeding.
- ? Which option should we choose?
```

Markers require whitespace after the list prefix and after the marker. Catalogs
are extensible: an installed Mira extension may add, replace or disable markers.
Do not assume a custom marker seen in one vault has the same meaning elsewhere.

## Extended task states

```markdown
- [ ] Draft the plan
- [/] Work in progress
- [?] Decide the approach
- [-] Cancelled action
- [!] Important action
- [x] Completed action
```

Lapis/Mira renders a richer state catalog than a binary checkbox. Additional
markers include > (forwarded), < (scheduled), l (location), \* (starred), i
(information), S (savings), I (idea), f (fire), k (key), u/d (trending up/down),
w (win), p/c (thumbs up/down), b (bookmark) and a double quote (quote). Uppercase
X is normalized as complete. Markers are case-sensitive otherwise: i and I,
for example, mean different states.

These are display/task-state markers. A scheduled-looking marker does not itself
create a native scheduled Task or reminder. Native Tasks operations, recurrence
and write authority belong to the Tasks plugin and its discovered CLI/API
contract. Preserve existing task metadata rather than inferring new dates or
rewriting every non-complete marker as an unchecked box.
