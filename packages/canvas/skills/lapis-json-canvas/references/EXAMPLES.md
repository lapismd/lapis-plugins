# Lapis Canvas examples

Read this for complete starter documents. Keep the existing canvas's IDs and
unrelated fields when applying the same patterns to a saved document.

## Markdown text and a note section

```json
{
  "nodes": [
    {
      "id": "13579bdf02468ace",
      "type": "text",
      "x": 0,
      "y": 0,
      "width": 320,
      "height": 180,
      "text": "# Review\n\n- [/] Compare options\n- [ ] Choose a direction"
    },
    {
      "id": "2468ace013579bdf",
      "type": "file",
      "x": 420,
      "y": 0,
      "width": 360,
      "height": 240,
      "file": "Projects/Plan.md",
      "subpath": "#Decisions"
    }
  ],
  "edges": [
    {
      "id": "abcdef0123456789",
      "fromNode": "13579bdf02468ace",
      "toNode": "2468ace013579bdf",
      "fromSide": "right",
      "toSide": "left",
      "toEnd": "arrow",
      "label": "supports"
    }
  ]
}
```

The Lapis task marker in the text node remains Markdown data. Rendering depends
on the active Markdown capability; do not convert it into unrelated JSON fields.
The note section must exist in Projects/Plan.md for a useful preview.

## Group with an external reference

```json
{
  "nodes": [
    {
      "id": "1111222233334444",
      "type": "group",
      "x": -40,
      "y": -40,
      "width": 860,
      "height": 320,
      "label": "Evidence",
      "color": "2"
    },
    {
      "id": "5555666677778888",
      "type": "text",
      "x": 0,
      "y": 0,
      "width": 340,
      "height": 220,
      "text": "## Finding\n\nKeep the original [[Projects/Plan|plan]] linked."
    },
    {
      "id": "9999aaaabbbbcccc",
      "type": "link",
      "x": 440,
      "y": 0,
      "width": 340,
      "height": 220,
      "url": "https://example.com/research"
    }
  ],
  "edges": [
    {
      "id": "ddddeeeeffff0000",
      "fromNode": "9999aaaabbbbcccc",
      "toNode": "5555666677778888",
      "fromSide": "left",
      "toSide": "right",
      "toEnd": "arrow"
    }
  ]
}
```

The two content nodes sit inside the group's bounds but remain top-level nodes.
The URL is a reference, not permission to execute external content. Leave room
for readable card text and check the result at the intended zoom level.
