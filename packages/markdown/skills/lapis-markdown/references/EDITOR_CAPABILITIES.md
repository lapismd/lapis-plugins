# Lapis editor capabilities and defaults

Read this when the user asks for editor behavior, a rich authoring feature or a
feature that appears unavailable. Syntax support and a visible authoring control
are different concerns. A note need not flatten its rich syntax to match a hidden
toolbar. Preserve existing configuration unless changing it is requested.

## Modes and richer authoring

Lapis exposes Source, Live Preview and Reading. Portable Mira also has a split
mode, but Lapis Markdown disables that mode; do not advertise it as a Lapis view.
The complete Mira authoring stack supplies slash commands, formatting, tables,
grid tables, images, math, links, block controls and extension contributions.

Twenty feature descriptors govern mode switch, formatting, headings, lists,
links, tables, grid tables, Mermaid, code, math, frontmatter, images, embeds,
wikilinks, tags, slash commands, block controls, Source, Live Preview and Reading.
They are enabled by default and configured under markdown.mira.features.<feature>.
Use the actual Settings feature name rather than inventing a property spelling.

## Dedicated options

| Setting key                                   | Default | Effect                                                        |
| --------------------------------------------- | ------- | ------------------------------------------------------------- |
| markdown.mira.editor.toolbar.enabled          | false   | Top authoring toolbar in editable surfaces                    |
| markdown.mira.editor.selectionToolbar.enabled | true    | Actions for selected editable text                            |
| markdown.mira.editor.blockToolbar.enabled     | false   | Optional block-type control                                   |
| markdown.mira.editor.doodleDividers.enabled   | false   | Seeded hand-drawn horizontal rules                            |
| markdown.mira.plugins.mermaid.enabled         | true    | Installed Mermaid extension, also subject to its feature flag |
| markdown.mira.plugins.ai.enabled              | false   | Optional AI extension, requiring a configured provider        |
| markdown.mira.frontmatter.defaultOpen         | false   | Initially expanded properties                                 |
| markdown.mira.features.outline-navigation     | true    | Floating Reading outline                                      |

The superseded markdown.mira.features.toolbar key is not the current toolbar
setting. AI availability is not implied by syntax support or an installed skill.

## Doodle dividers and extension metadata

A seeded divider pairs an HTML comment with a horizontal rule:

<!-- prettier-ignore -->
```markdown
<!-- mira-divider:v1:1234abcd -->
---
```

The v1 seed is eight hexadecimal digits. The dedicated setting controls its
rendered authoring behavior; preserve the seed/comment when making unrelated
edits. Without that feature, the underlying horizontal rule remains Markdown.

Registered Lapis Markdown extensions can contribute renderer behavior, actions,
list-callout catalogs and styles through the owning App/surface lifecycle. Do
not treat an arbitrary directive name or copied CSS selector as a portable
capability. Check installed extensions and the actual Source/Live Preview/Reading
result when a document relies on one.
