# Slides Plugin

`@lapis-notes/slides` owns presentation mode for Markdown notes. The migration
starts from legacy revision `8ec68e18`, preserves the rendered overlay, Reveal
surface, recursive section markup, close-button SVG, semantic class names, and
authored CSS, and adapts repository structure, public imports, explicit
application ownership, current lifecycle behavior, packaging, non-visual
acceptance attributes, and the scoped token bridge required for the public
Markdown embed to inherit Reveal typography and its transparent slide surface.

The package is portable across web and desktop hosts. Markdown remains the
authoritative source: Slides opens a separate file-backed view over the active
note, renders each slide through the public Markdown embed, and returns focus to
the explicit source leaf when the presentation closes.

## Requirements

| ID            | Requirement |
| ------------- | ----------- |
| LN-SLIDES-001 | Slides MUST live at `packages/slides` as `@lapis-notes/slides@0.1.0`, retain runtime id `lapis-slides`, view type `slides`, command id `start-presentation`, and migration provenance revision `8ec68e18`. The legacy source and its separate release history MUST remain unchanged. |
| LN-SLIDES-002 | The migrated presentation MUST preserve the legacy overlay, view and section DOM, recursive horizontal and vertical tree, semantic class names, close-button SVG, Source Sans Pro imports, Reveal variables, and authored CSS declarations. Adaptation MAY add non-visual accessibility or test attributes to that markup plus Slides-scoped Markdown and application-theme token bridges; it MUST NOT restyle the application outside the presentation. |
| LN-SLIDES-003 | Blank-line `---` separators MUST start horizontal slides and blank-line `----` separators MUST create vertical children. Separators without the surrounding blank lines MUST remain Markdown content. Empty input MUST remain a valid one-slide deck. |
| LN-SLIDES-004 | A leading YAML front matter block MUST configure Reveal through the fail-safe YAML schema. Missing, scalar, array, or malformed configuration MUST fall back without throwing; malformed YAML MUST leave the original Markdown available to render. |
| LN-SLIDES-005 | Slides MUST preserve `notes:` and case-insensitive `note:` or `notes:` speaker-note labels, callout-style `>[!note]:` and `>[!notes]:` notes, `.element` attributes on the preceding element, and `.slide:` attributes on the owning section. Slide and note bodies MUST render through `@lapis-notes/markdown/embed` with syntax highlighting disabled, inherit Reveal's main and heading typography, and keep the embedded Markdown surface transparent. |
| LN-SLIDES-006 | The plugin MUST register `Start presentation` as both the `lapis-slides:start-presentation` command and a Markdown view-menu action. The menu action MUST use its owning Markdown leaf; the command MUST use the active leaf. A missing leaf or non-Markdown file MUST produce the legacy notice and MUST NOT open a presentation. |
| LN-SLIDES-007 | Starting a valid presentation MUST create and activate a new tab, set file-backed Slides state with the Markdown path and explicit source-leaf id, retain workspace history, and request layout persistence. Closing through the visible X or Escape MUST close the Slides leaf and reactivate that explicit source leaf, with a sibling or active-leaf fallback only when it no longer exists. |
| LN-SLIDES-008 | The view MUST track live editor changes. Every content or configuration update MUST synchronize and lay out Reveal, then restore its prior horizontal, vertical, and fragment indices. The deck MUST retain focus after initialization and use embedded, focused-keyboard Reveal behavior. |
| LN-SLIDES-009 | Reveal initialization and synchronization MUST remain scheduled and cancellation-safe. View teardown MUST stop editor tracking, remove its change and Escape listeners, destroy each Reveal instance at most once including pending initialization, unmount Svelte content, and remove the plugin-installed scoped Reveal base stylesheet on plugin unload. |
| LN-SLIDES-010 | First-party source and Storybook code MUST receive `App` explicitly or derive it from the owning leaf. Slides MUST NOT read or assign `globalThis.app`. The plugin MUST declare portable `isDesktopOnly: false` behavior and MUST NOT add host-specific routing or installed-state policy. |
| LN-SLIDES-011 | The public root MUST export default and named `SlidesPlugin`, `manifest`, `SlidesView`, and `SlidesViewType`; parser and presentation-tree internals MUST remain private. `@lapis-notes/api`, the Graph-matched Markdown range, and Svelte MUST be peers. Reveal.js, js-yaml, and Source Sans Pro MUST be bundled dependencies, with no Tailwind or raw `@lapis-notes/ui` stylesheet dependency. |
| LN-SLIDES-012 | The official manifest MUST be unlocked, enabled by default once installed, ESM, reload-free, and require only `@lapis-notes/api` plus `@lapis-notes/markdown/embed` as authored shared runtime modules. Release bundling MUST externalize the exact compiler-emitted Svelte renderer ABI to the host peer without adding it to manifest `sharedDependencies`. Runtime and npm artifacts MUST be generated and verified through the common deterministic package and signed-archive pipeline. |
| LN-SLIDES-013 | Package-owned registry metadata MUST use categories `presentation` and `markdown`, semantic icon `presentation`, legacy link-blue accent `#42AFFA`, end-user Overview and Changelog content, one fixed banner, and one `presentation` gallery card with the governed headline, description, and alternative text. The active registry history MUST begin at `0.1.0`; legacy `2026.6.6` assets MUST NOT be imported. |
| LN-SLIDES-014 | `Plugins/Slides/Registry Screenshots` MUST provide one explicit-App `Presentation` story for both banner and gallery capture with `registry-media` and `visual-pending` governance. It MUST register public Markdown and Slides exports, seed and open `Release Walkthrough.md`, execute `lapis-slides:start-presentation`, navigate deterministically to Goals, wait for Reveal readiness, and assert the heading, list, controls, and close action before capture. |
| LN-SLIDES-015 | Banner and `presentation` registry media MUST contain deterministic 1200x800 split preview plus 2400x1600 split, light, and dark WebPs. Package tests MUST cover parsing, both notes syntaxes, attributes, invalid YAML, command/menu guards, tab/source behavior, close/Escape, live refresh, index retention, and teardown. Visual Delta baselines MUST remain pending until separate approval. |
| LN-SLIDES-016 | The presentation overlay MUST inherit the active application light or dark semantic background, foreground, selection, and secondary-surface tokens without forcing a theme class. Theme changes MUST flow through CSS custom properties without recreating the deck. |
| LN-SLIDES-017 | Storybook MUST include an interaction-backed vertical-deck example that opens Slides through the public command, enters a vertical stack, navigates down, and asserts the active nested slide. The canonical fixture MUST exercise both horizontal and vertical separators. |

## Runtime flow

```text
active Markdown leaf
        ↓ start-presentation
new file-backed Slides leaf + explicit source id
        ↓
front matter + horizontal/vertical parser
        ↓
MarkdownEmbed sections and speaker notes
        ↓
embedded Reveal deck ↔ live editor changes
        ↓ close or Escape
explicit source leaf
```

## Verification

Focused package checks exercise the parser, plugin, view, component lifecycle,
public build, and publint contract. The governed Storybook interaction provides
the real-App launch and accessibility boundary, while package-owned media and
the common release tooling verify deterministic registry and archive outputs.
Clean Lapis Notes consumer acceptance remains a release gate, not a reason to
statically bundle Slides into the host application.
