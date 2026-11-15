# Lapis Bases expressions and functions

Read this for filters, computed properties and dates. This is the Lapis query
boundary, not a JavaScript evaluator or a promise of complete upstream parity.

## Names and predicates

Note properties can be bare (price) or prefixed (note.price). File metadata uses
file.name, file.path, file.ext, file.ctime and file.mtime. A formula reference
uses formula.total; formula["display name"] handles a non-identifier name.
For a note key containing punctuation, use note["review score"].

Comparison operators include ==, !=, >, >=, < and <=. Use and/or/not YAML groups
for combined predicates. Lapis lowers == at the query boundary while retaining
quoted expression text. JavaScript strict equality === is rejected. Missing or
circular formula references are errors; do not replace them with a broad filter.

```yaml
filters:
  and:
    - 'file.ext == "md"'
    - 'note["review score"] >= 3'
    - not:
        - 'status == "archived"'
formulas:
  total: "price * quantity"
  label: 'if(formula.total > 100, "large", "small")'
views:
  - type: table
    name: Reviewed
    filter:
      and: []
    order: [file.name, formula.total, formula.label]
```

## Runtime-supported helper families

| Task            | Functions and examples                                                                    |
| --------------- | ----------------------------------------------------------------------------------------- |
| Text            | lower, title, trim, split, replace, repeat, startsWith, endsWith, matches                 |
| Contains        | contains, containsAny, containsAll; containsAnyOf/containsAllOf remain aliases            |
| Numbers         | number, abs, ceil, floor, round, toFixed, min, max                                        |
| Conditions      | if(condition, yes, no), isEmpty, isTruthy, isType, toString                               |
| File predicates | file.hasTag, file.hasLink, file.hasProperty, file.inFolder                                |
| Display values  | file, link, image, html, icon, asFile, asLink                                             |
| Collections     | list, length, map, filter, reduce, flat, join, reverse, slice, sort, unique, keys, values |
| Time            | date, duration, today, now, relative, format, time                                        |

Formatting helpers produce display values. They do not create files, fetch an
image, authorize HTML execution or persist changes to a note.

## Collection semantics

Lists support method notation and callback-local value, index and acc. Callback
expressions are data; do not write JavaScript lambdas. Examples exercised by the
Lapis query engine:

| Expression                     | Result   |
| ------------------------------ | -------- |
| [1,2,3].contains(2)            | true     |
| [1,2,3,4].filter(value > 2)    | [3,4]    |
| [1,2,3].map(value + index)     | [1,3,5]  |
| [1,2,3].reduce(acc + value, 0) | 6        |
| [30,1,2].sort()                | [1,2,30] |
| [1,2,2,3].unique()             | [1,2,3]  |
| [1,[2,3]].flat()               | [1,2,3]  |

A list literal creates a new outer list and preserves null elements. list(anArray)
retains the existing list semantics. Reverse and sort do not mutate note data.
Within a nested callback, value/index/acc belong to that callback; use note.key
for an outer note property. An empty list and numeric zero have different
emptiness/truthiness behavior; do not use truthiness to detect a missing number.

## Date details that matter in Lapis

Date helpers use the Lapis date runtime. today() is midnight in the configured
zone; now() includes the current time. date("2025-01-02").format("YYYY-MM-DD")
produces the calendar date. dateValue.time() produces HH:mm:ss, while
now().date() selects the calendar day. Formatting tokens follow the supported
Moment-style compatibility layer, not JavaScript Date formatting.

number(date("1970-01-02T00:00:00Z")) is 86400000 (milliseconds). Duration units
are case-sensitive: duration("1M") is one month and duration("1m") one minute.
Do not assume daylight-saving or month arithmetic is a fixed millisecond count.
Use explicit dates/zones in reproducible examples and check boundary cases.
