# Registry Media

LP-SPEC-031 governs the source stories, composition metadata, generated files,
and validation used for first-party registry cards.

## Source contract

Each `registry.json` declares one to five gallery items. An item owns a stable
ID, bounded alternative text, explicit preview and full output paths, one exact
Storybook story ID, and card composition metadata. Capture never selects a
different story when the declared story is missing.

Card headlines and descriptions are ordered plain-text segments. Their tones
are limited to `neutral`, `violet`, `cyan`, `green`, `amber`, and `rose`;
arbitrary colours or markup are invalid. Description accents are used
sparingly to reinforce meaningful phrases while neutral copy remains the
default. Composition is intentionally uniform across every card: marketing
copy stays on the left and the captured product surface stays on the right.
The card contract does not expose a per-image layout choice. Focus is one of
`full-shell`, `left-sidebar`,
`right-sidebar`, `bottom-status`, or a normalized custom rectangle wholly
inside the captured viewport.

The generated public registry retains only the card ID, alternative text, and
the resolved preview and full image references. Capture and composition
instructions remain source-only.

## Fixed Storybook inventory

All sources live under `Plugins/<Plugin>/Registry Screenshots` and carry both
`registry-media` and `visual-pending` tags.

| Plugin        | Required cards                                                    |
| ------------- | ----------------------------------------------------------------- |
| AI            | Chat with tool activity, History, Catalog                         |
| Bases         | Table, Cards, Grouped List                                        |
| Bookmarks     | Bookmarks sidebar                                                 |
| Graph         | Global Graph, Local Graph                                         |
| History       | History sidebar, Compare                                          |
| Markdown      | Live Preview, Source, Reading, Outline sidebar, Backlinks sidebar |
| Markdown Lint | Editor diagnostics with Problems                                  |
| Search        | Search sidebar                                                    |
| Source Editor | JSON editor                                                       |
| Spell Check   | Suggestions and Problems                                          |
| Word Count    | Editor with focused status bar                                    |

Full-shell stories use the common 1200x800 application frame with Explorer
open. Sidebar cards show the full sidebar and approximately half of the
adjacent document. Stories use realistic data and start or finish their play
function in the exact state intended for capture.

## Catalog host

The root Storybook compiles Design Core's Tailwind v4 catalog stylesheet and
uses DM Sans Variable for application UI plus Source Code Pro Variable for
code and editor content. Its toolbar exposes the Lapis/default brand selector
and a sun/moon light-dark control; both globals are reflected on the preview
document.

Registry capture always requests the Lapis light presentation and waits for
both bundled font faces before measuring or capturing a story. Missing fonts,
unresolved catalog theme variables, or a mismatched capture theme fail closed
instead of producing fallback-font media.

## Capture and composition

`pnpm registry:media:capture` builds Storybook, validates the declared story
catalog, captures each story through Visual Delta at a 1200x800 CSS viewport
and 2x device scale, and writes its declared assets. `--plugin <id>` limits a
capture run without changing the contract. `pnpm registry:media:check` performs
the same work without writing and fails when any artifact differs.

The 2400x1600 browser capture is the only raster input. Composition uses the
bundled Inter face at the fixed 400-700 weights used by the Notebook Navigator
reference, with heavier and slightly larger headline and supporting copy. A
fixed black canvas and allowlisted palette preserve inline description colours
while wrapping deterministically. The complete copy block is vertically
centred, with a deliberate visual gap between the eyebrow and headline. Copy
always occupies the left region, while the captured product surface occupies
the right at approximately four-fifths of the card height. Composition applies
the declared crop without upscaling, keeps screenshot framing intentionally
tight, and emits a 2400x1600 lossless-WebP full image. The
1200x800 lossless-WebP preview is downscaled from that full image. Text or image
overflow, unexpected dimensions, unsafe paths, missing tags, and stale bytes
are failures.

Registry capture is independent from Visual Delta baseline review. Generated
cards remain reviewable through the local source registry preview, while their
source stories remain `visual-pending` until a separate baseline approval.
