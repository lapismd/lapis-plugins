---
name: lapis-json-canvas
description: Create and edit Lapis JSON Canvas (.canvas) files with text, file, link and group nodes and connecting edges.
---

# Lapis JSON Canvas

Read an existing canvas before editing. Preserve unrelated nodes, edges,
layout and extension fields. A `.canvas` file is JSON with `nodes` and `edges`
arrays. Serialize JSON rather than assembling quoted text by hand.

```json
{
  "nodes": [
    {"id":"a1b2c3d4e5f67890","type":"text","x":0,"y":0,"width":320,"height":180,"text":"# Plan\n\nDiscuss [[Project]]."},
    {"id":"b1b2c3d4e5f67890","type":"file","x":420,"y":0,"width":320,"height":180,"file":"Projects/Project.md"}
  ],
  "edges": [
    {"id":"c1b2c3d4e5f67890","fromNode":"a1b2c3d4e5f67890","toNode":"b1b2c3d4e5f67890","fromSide":"right","toSide":"left","toEnd":"arrow"}
  ]
}
```

Every node needs a unique nonempty `id`, a type, integer `x` and `y`, and
positive integer `width` and `height`. Generate random 16-character hex IDs
for new objects without changing existing IDs.

- `text` nodes require `text` containing Markdown.
- `file` nodes require a vault-relative `file`; optional `subpath` begins with `#`.
- `link` nodes require `url`.
- `group` nodes may have `label`, `background`, and `backgroundStyle`
  (`cover`, `ratio`, or `repeat`). Put grouped nodes inside its bounds.

Edges need unique IDs and existing `fromNode` and `toNode` references.
Sides are `top`, `right`, `bottom`, or `left`; ends are `none` or `arrow`.
Optional labels and colors belong to the node or edge. Canvas preset colors
are strings `"1"` through `"6"`; hex colors are also supported.

Leave space between cards and keep text readable at the requested zoom.
After editing, parse the JSON, validate IDs, dimensions and edge endpoints,
and inspect the canvas in Lapis. Preserve unresolved file references unless
the requested change authorizes repairing them.

Adapted for Lapis from [Obsidian skills](https://github.com/obsidianmd/obsidian-skills).
See [upstream license](LICENSE.txt).
