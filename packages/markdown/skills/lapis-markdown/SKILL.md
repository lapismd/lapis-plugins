---
name: lapis-markdown
description: Create and edit Lapis Markdown notes, YAML properties, wikilinks, embeds and callouts.
---

# Lapis Markdown

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
