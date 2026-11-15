---
name: lapis-markdown
description: Create and edit rich Lapis/Mira Markdown, including grid tables, directives, extended task states, properties, links and embeds.
---

# Lapis Markdown

Lapis/Mira supports a richer authoring surface than the common Obsidian-compatible
subset: grid tables with spans, directives, list callouts, extended task states,
code-line metadata, math, diagrams and rich editable previews. Use the Lapis
contract rather than limiting a note to upstream examples. Load detail by task:

- [Rich syntax and examples](references/RICH_SYNTAX.md): grid tables, directives, code, math and diagrams.
- [Properties and links](references/PROPERTIES_AND_LINKS.md): typed data, file identity and metadata.
- [Callouts and task states](references/CALLOUTS_AND_TASKS.md): folding, list callouts and nonbinary markers.
- [Embeds and previews](references/EMBEDS.md): source ownership, providers and editable hover cards.
- [Editor capabilities](references/EDITOR_CAPABILITIES.md): supported modes, settings defaults, optional AI and doodle dividers.

Read the existing note and nearby vault conventions before editing. Preserve
unrelated frontmatter and document content. Use ordinary Markdown plus Lapis
links and embeds; do not assume every Obsidian extension or plugin is present.

```markdown
---
title: Project Alpha
tags:
  - project/active
aliases:
  - Alpha
status: active
---

# Project Alpha

See [[Project Brief|the brief]] and [[Meeting#Decisions]].

> [!note] Next step
> Review the project plan.

- [ ] Prepare a draft

![[Architecture.png|600]]
```

Use `[[Note]]`, `[[Note|Label]]`, `[[Note#Heading]]`, and
`[[Note#^block-id]]` for internal references. Add `^block-id` to the target
block when creating a block reference. Escape alias pipes inside Markdown
tables. Use vault-relative paths where names are ambiguous.

Embeds prefix a supported internal reference with `!`. Confirm the target
exists and the owning file-type plugin is available. Keep image dimensions
optional. Use standard `[label](https://example.com)` for external links.

Frontmatter must remain valid YAML at the start of the document. Preserve
property types: arrays remain arrays, booleans remain booleans, and quoted
text stays text. Do not replace an entire properties block to change one key.

Check headings, fenced code blocks, YAML and link targets after editing.
When using the CLI, discover its current capabilities with `lapis help` and
the selected host; do not invent Obsidian commands for Lapis. Use application
rename/move facilities when available so internal links can be maintained.

Adapted for Lapis from [Obsidian skills](https://github.com/obsidianmd/obsidian-skills).
See [upstream license](LICENSE.txt).
