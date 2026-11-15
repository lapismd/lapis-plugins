---
name: lapis-bases
description: Create and edit Lapis Bases (.base) documents, note-property filters, formulas and views.
---

# Lapis Bases

Read [documents and Lapis views](references/DOCUMENTS_AND_VIEWS.md) for the saved
model, native board/activity options and import differences. Read
[functions and expressions](references/FUNCTIONS_REFERENCE.md) for the tested
Lapis query dialect, collection callbacks and date semantics.

A `.base` file describes views over existing vault files; it does not contain
copies of the underlying notes. Read the document and representative note
frontmatter before changing filters or formulas. Preserve unknown document and
view fields and unrelated note properties.

Document-wide filters use the plural `filters` field. Per-view filters use
singular `filter` in the native saved model; import also accepts plural
`filters` inside a view. Use the native model for new documents:

```yaml
filters:
  and:
    - 'file.ext == "md"'
formulas:
  total: "price * quantity"
properties:
  note.status:
    displayName: Status
views:
  - type: table
    name: Projects
    filter:
      and:
        - 'status == "active"'
    order:
      - file.name
      - status
      - formula.total
    sort:
      - property: file.name
        direction: ASC
```

Use `and`, `or` or `not` arrays for filter groups. Invalid groups fail rather
than becoming an unrestricted query. Quote expressions so YAML punctuation
remains expression data. Note properties may be bare in expressions; use
`note.` for note-property display metadata and `formula.` for formula columns.

Lapis includes table, cards, list, kanban, activity and map registrations.
Use the reference for actual view options and preserve unknown/custom view
types. Formula support follows the installed Lapis runtime, not every upstream
function or JavaScript expression.

Parse the YAML after editing, confirm referenced formulas exist, and inspect
representative included and excluded files. Open the resulting Base in Lapis
to check that its actual rows, ordering and view match the request.

Adapted for Lapis from [Obsidian skills](https://github.com/obsidianmd/obsidian-skills).
See [upstream license](LICENSE.txt).
