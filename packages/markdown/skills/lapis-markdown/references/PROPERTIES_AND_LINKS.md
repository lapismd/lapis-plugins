# Lapis properties and links

Read this for property edits, file identity, links and metadata indexing.

## Typed frontmatter

Frontmatter is YAML at the beginning of a note. Lapis indexes it and exposes
property types through its property manager. Change the requested keys while
preserving unrelated values, comments where possible, and scalar/list types.
Use the application property controls when an edit needs a property-type change.

```markdown
---
title: Project Alpha
tags:
  - project/active
aliases:
  - Alpha
status: active
estimate: 3
approved: false
reviewDate: "2026-11-15"
---

# Project Alpha

Review [[Projects/Brief|the brief]] and [[Meeting#Decisions]].

A decision can have a stable block reference. ^decision-one
```

Quote a value when it must remain text rather than a YAML Boolean, number or
timestamp. An absent property, an empty string, false and zero are distinct data.
Tags and aliases are normally lists; do not replace a list with comma-separated
text. Date formatting must match the intended Lapis property type.

## Vault references

| Intent        | Syntax                           |
| ------------- | -------------------------------- |
| Note          | [[Projects/Brief]]               |
| Display label | [[Projects/Brief\|the brief]]    |
| Heading       | [[Meeting#Decisions]]            |
| Block         | [[Meeting#^decision-one]]        |
| External URL  | [reference](https://example.com) |

The backslash above protects a table's alias pipe; outside a Markdown table use
[[Projects/Brief|the brief]]. Use a real note path when names are ambiguous.
Aliases are metadata and suggestions, not a reason to replace the actual target
path with arbitrary display text. Preserve existing stable block IDs.

Lapis resolves targets relative to the owning note and vault. Renames/moves
should use application facilities when available so link maintenance can run.
Do not rewrite unrelated links merely to impose a different path convention.

## Lapis metadata and panels

Headings, links, tags and frontmatter feed Lapis metadata and movable panels.
The note text remains authoritative; panel results and index rows are derived.
Changing a database-looking Base row normally changes the source note property,
not an independent table record. After edits, check the property types and
representative link targets through the actual application.
