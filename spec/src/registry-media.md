# Registry Media

LP-SPEC-031, LP-SPEC-042, and LP-SPEC-043 govern the source stories,
composition metadata, generated files, and validation used for first-party
registry media.

## Source contract

Each `registry.json` declares required `media.banner`, an optional
`media.overview`, and one to five gallery items. Overview media is declared
only when it presents a materially different full-screen state and MUST use a
different Storybook story from the banner. Product media owns bounded alternative
text, four explicit output paths, one exact Storybook story ID, and one focus preset. A gallery item additionally owns a stable ID and card
composition metadata. Capture never selects a different story when the
declared story is missing.

Every item exposes a 1200x800 split preview plus 2400x1600 split, light, and
dark lossless-WebP outputs. Split media uses dark in the upper-left and light
in the lower-right, divided by a corner-to-corner diagonal so each theme owns
exactly half of the affected image area. The generated public registry retains only alternative
text and resolved media references; stable gallery IDs remain on gallery
items. Capture, focus, and card instructions are source-only.

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

## Fixed Storybook inventory

All sources live under `Plugins/<Plugin>/Registry Screenshots` and carry both
`registry-media` and `visual-pending` tags.

| Plugin        | Required cards                                                                |
| ------------- | ----------------------------------------------------------------------------- |
| AI            | Focused chat with tool activity, History, Catalog                             |
| Bases         | Filter options, Cover cards, Grouped list                                     |
| Bookmarks     | Bookmarks sidebar                                                             |
| Graph         | Focused Global Graph, Local Graph sidebar                                     |
| History       | History sidebar, Compare                                                      |
| Markdown      | Live Preview with Outline, Source with Properties, Reading, Backlinks sidebar |
| Markdown Lint | Editor diagnostics with Problems                                              |
| Search        | Populated Search sidebar, Search filters                                      |
| Slides        | Full-screen Goals presentation                                                |
| Source Editor | Focused JSON editor                                                           |
| Spell Check   | Suggestions and Problems, Editor action popover                               |
| Word Count    | Complete shell with both sidebars closed and status bar                       |

Each plugin owns one explicit banner story. AI shows History left, Chat in the
main area, and Catalog right. Graph shows Explorer, Global Graph, and Local
Graph. History shows Explorer, Compare, and History. Markdown shows Backlinks,
Live Preview, and File Properties. Bases uses the populated cover cards view.
Bookmarks and Search show their primary panel on the left beside an empty main
workspace. Markdown Lint, Source Editor, Spell Check, and Word Count use the
complete shell with both sidebars closed. Slides uses the full-screen Goals
presentation.

Overview media is intentionally selective. AI uses focused tool activity,
Bases uses Grouped List, Graph uses the focused Global Graph, History uses
Compare, Markdown uses Reading, Search uses open search filters, and Spell
Check uses the editor action popover. Bookmarks, Markdown Lint, Source Editor,
Slides, and Word Count omit Overview media because their available full-screen state
would repeat the banner rather than add useful context.

Full-shell stories use the common 1200x800 application frame with Explorer
open unless the card explicitly demonstrates focus mode, an editor/sidebar
pairing, or the shared Problems surface. Focus-mode cards hide both sidebars
and let the requested workspace view fill the shell. Sidebar cards show the
full requested sidebar and approximately half of the adjacent document while
hiding the opposite sidebar. Stories use realistic data and start or finish
their play function in the exact state intended for capture. Open filters,
menus, diagnostics, and action popovers are part of that fixed final state and
MUST be asserted by the story play and remain observable after settled capture
readiness. Diagnostic stories stabilize the actual source-specific provider
results used by both the editor and Problems surface; they MUST NOT capture a
transient result that later clears or a hover card that closes before capture.
Registry stories that do not demonstrate diagnostics MUST disable the
Markdown Lint and Spell Check providers before the workspace loads. A
diagnostic registry story enables only the provider it demonstrates, so
unrelated asynchronous results cannot alter its settled pixels.

## Catalog host

The root Storybook compiles Design Core's Tailwind v4 catalog stylesheet and
uses DM Sans Variable for application UI plus Source Code Pro Variable for
code and editor content. Its toolbar exposes the Lapis/default brand selector
and a sun/moon light-dark control; both globals are reflected on the preview
document. Browser-only dependency shims MUST preserve the public names used by
production imports; Storybook's inlined Harper binary therefore re-exports its
`binaryInlined` value under the production module's `binary` name.

Registry capture requests both Lapis light and dark presentations and waits
for both bundled font faces before measuring or capturing a story. Each
distinct story is captured once per theme and may be reused by gallery media,
but banner and Overview roles remain distinct. Missing fonts, unresolved catalog theme variables, or a
mismatched capture theme fail closed instead of producing fallback-font media.

## Capture and composition

`pnpm registry:media:capture` builds Storybook, validates the declared story
catalog, captures each story through Visual Delta at a 1200x800 CSS viewport
and 2x device scale, and writes its declared assets. `--plugin <id>` limits a
capture run without changing the contract. `pnpm registry:media:check` performs
the same work without writing and fails when any artifact differs.

The two 2400x1600 browser captures are the only raster inputs. Composition uses the
bundled Inter face at the fixed 400-700 weights used by the Notebook Navigator
reference, with heavier and slightly larger headline and supporting copy. A
fixed black canvas and allowlisted palette preserve inline description colours
while wrapping deterministically. The complete copy block is vertically
centred, with a deliberate visual gap between the eyebrow and headline. Copy
always occupies the left region. A `full-shell` card fits the complete 3:2
capture into a 1440x960 frame on the right and MUST preserve both horizontal
edges without cover cropping. Focused sidebar, status, and custom presets use a
taller 1440x1280 frame and MAY cover-crop to the declared subject. Every frame
retains a fixed 48px dark gutter at the outer right edge. Composition applies
the declared crop without upscaling, keeps screenshot framing intentionally
tight, and emits a 2400x1600 lossless-WebP full image. The
1200x800 lossless-WebP preview is downscaled from that full image. Gallery
marketing copy is identical in both themes, so the diagonal runs from the
product frame's upper-right corner to its lower-left corner and changes only
the product pixels. Banner and Overview media run the same corner-to-corner
diagonal across the full product capture. Text or image overflow, unexpected dimensions, unsafe paths,
missing tags, theme mismatch, split mismatch, and stale bytes are failures.

Registry capture is independent from Visual Delta baseline review. Generated
cards remain reviewable through the local source registry preview, while their
source stories remain `visual-pending` until a separate baseline approval.
