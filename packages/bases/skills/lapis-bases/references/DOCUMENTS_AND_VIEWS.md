# Lapis Base documents and views

Read this when creating a Base or changing its presentation. A Base queries
vault files; rows are not separate records stored in the .base file.

## Saved document contract

| Field      | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| filters    | Document-wide predicate, applied to every view         |
| formulas   | Named computed expressions, referenced as formula.name |
| properties | Display metadata; note properties use note.name here   |
| summaries  | Named summary definitions                              |
| activeView | Name of the selected view, not its type or array index |
| views      | Ordered view definitions with unique useful names      |

Use singular filter inside a new view. Lapis imports the plural filters alias
but writes the native singular key; do not leave two competing view predicates.
A malformed Boolean group is an error, not an unrestricted query.

```yaml
filters:
  and:
    - 'file.ext == "md"'
formulas:
  total: "price * quantity"
properties:
  note.status:
    displayName: Status
activeView: Board
views:
  - type: table
    name: Table
    filter:
      and:
        - 'status == "active"'
    order: [file.name, status, formula.total]
    sort:
      - property: file.name
        direction: ASC
  - type: kanban
    name: Board
    order: [file.name, status, formula.total]
    groupBy:
      property: status
      direction: ASC
    titleProperty: file.name
    descriptionProperty: description
    tagsProperty: file.tags
    filter:
      and: []
```

## Built-in Lapis views

Table, cards, list, kanban, activity and map are registered view types. A
registered type does not imply that every upstream option is implemented.

- Table uses order, sort, columnSize and rowHeight. Its layout can be table or
  cards; preserve that setting when editing an existing file.
- Cards supports image, imageFit (contain or cover), imageAspectRatio and cardSize.
- List uses the selected properties, defaulting to file.name when order is empty.
- Kanban groups notes and renders Markdown-backed cards. titleProperty,
  descriptionProperty, tagsProperty, chipProperty and badgeProperty map note
  data into the card; they are not arbitrary rendered HTML.
- Activity uses the same card mappings and an explicit dateProperty, or the
  first selected date/datetime property. Preserve the intended date selection.
- Map configuration is retained, but the current renderer shows an explicit
  unavailable state. Do not promise map tiles, coordinates or geographic editing.

Lapis board lane settings include columnOrder, columnMeta and columnFilters.
Their keys are persisted lane identities: preserve existing IDs rather than
inventing them from display labels. columnFilters contains native filter groups.
Unknown view types retain their authored type and show an unsupported-view state;
do not silently replace them with a table.

When patching YAML, merge the requested fields and preserve unrelated content.
Do not use a normalizer as a lossless serializer for arbitrary extension fields.
Validate examples through the installed Lapis parser and inspect actual rows.
