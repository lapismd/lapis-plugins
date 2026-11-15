# Lapis embeds and editable previews

Read this for embedded notes, media, plugin-owned documents and preview behavior.

```markdown
![[Projects/Plan]]
![[Projects/Plan#Decisions]]
![[Architecture.png|600]]
![[Architecture.png|600x320]]
![External diagram](https://example.com/diagram.png)
```

Resolve internal targets against the current note's source path and vault.
Check the actual target rather than manufacturing an empty note to satisfy an
embed. Preserve heading/block subpaths and existing size hints when unrelated
to the requested change. An embed is a view of the source, not a duplicate file.

## Provider-owned content

Lapis delegates file previews to the owning installed provider. Markdown notes
and supported images can render through the Markdown surface; audio, video,
PDF, Canvas and Bases behavior depends on the corresponding media/file plugin
and its advertised capability. Do not infer that arbitrary extensions or an
Obsidian community embed work in Lapis. Do not add speculative page/fragment
parameters without checking that provider's actual contract.

A Canvas embedded in Markdown follows the original .canvas source and remains
a read-only projection. A Base embeds a query/view over existing notes. Edit
the underlying source document or note rather than overwriting a derived view.

## Lapis rich note previews

Ordinary internal-link previews and Backlinks/Outgoing Links result previews can
enter the real note editor through Lapis's vault-backed Mira adapter. Their
edits persist to the target note and protect an already dirty editor. This is
application behavior; it is not a new Markdown embed delimiter.

Direct document embeds remain read-only. Do not assume that every visible card
is editable because a hover preview elsewhere supports editing. When using a
preview to edit, wait for persistence before dismissal; a failed save should
remain recoverable. When editing files programmatically, preserve unrelated
content in both the source note and the note containing the embed.
