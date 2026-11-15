# Lapis JSON Canvas schema and editing rules

Read this for validation, node-specific fields or preserving an existing canvas.
The persisted format is JSON Canvas with text, file, link and group nodes.

## Document and identity

nodes and edges are arrays. The validator treats omitted arrays as empty, but
write both arrays in new documents. Each node has a nonempty unique string ID;
each edge has a nonempty unique string ID in its edge collection. Generate new
16-character hexadecimal IDs without changing existing identities.

| Common node field | Accepted value                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| id                | Nonempty string, unique among nodes                                     |
| type              | text, file, link or group                                               |
| x, y              | Safe integers; negative positions are valid                             |
| width, height     | Positive safe integers                                                  |
| color             | Optional string; use a preset "1"–"6" or a hex color for portable paint |

| Type  | Additional fields                                                   |
| ----- | ------------------------------------------------------------------- |
| text  | Required text string containing Markdown                            |
| file  | Required vault-relative file string; optional subpath starts with # |
| link  | Required url string                                                 |
| group | Optional label, background, backgroundStyle: cover, ratio or repeat |

Optional string fields must be strings when present. Unknown node types, missing
endpoints, duplicate IDs and invalid geometry are errors, not instructions to
drop objects. Preserve unrelated extension fields when patching the document.

## Edges and layout

An edge requires id, fromNode and toNode. Both endpoints must name existing
nodes. Optional fromSide/toSide are top, right, bottom or left; optional
fromEnd/toEnd are none or arrow. label and color are optional strings.
Array order controls paint order. A group is a geometric container, not a second
nested nodes array: its children remain in the document's nodes list.

Use a JSON serializer for quotes and line breaks. A text value containing a
newline serializes as \n; a literal backslash followed by n is different content.
Validate the complete resulting document, not only the newly inserted node.

## Lapis integration

Text and file content uses the active Lapis Markdown/file-provider graph.
A file node referencing a .md note is not a copy of that note's contents.
Retain vault-relative paths and heading/block subpaths. Installed file-type
plugins determine other file previews; a valid file node does not guarantee
that an external application or unavailable plugin can render it.

An embedded canvas is a read-only projection of its source file. Lapis refreshes
that projection when the source changes and follows rename events; edit the
actual .canvas file rather than treating the embed as a separate saved board.
Deletion or invalid input should remain visible as an error, without replacing
the source with an empty board. Check final node labels, clipping and edge
connections in the actual Lapis Canvas view after structural validation.
