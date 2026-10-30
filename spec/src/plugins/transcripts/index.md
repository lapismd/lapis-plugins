# Transcripts Plugin

`@lapis-notes/transcripts` is the first-party reading view for Markdown
transcripts. Its Markdown peer and development dependency both accept `^0.2.0`. The Storybook shell loads the plugin, so Open transcript is in the command palette, with the audio-lines icon, and in the Markdown view menu, and opens parsed vault notes. Pending comments collect in a collapsible section at the end of the note, with the transcript controls that return to each comment's source. The transcript send control appears in the reading footer, to the right of Source, while a comment is active or waiting to be sent. The spoken sample
uses speaker-then-time and time-then-speaker headers in `mm:ss`, a saved
front-matter comment, and a vault recording. Separate notes cover
time-then-speaker `hh:mm:ss`, `mm:ss:cs`, and a single turn declared with
`type: transcript`. A note whose name ends in `transcript.md` opens in the reading view. One
qualified note does not use that name, so the story opens it in the Markdown
editor and shows `![[Contract transcript.md]]` as the transcript reading view
while an ordinary embedded note stays a Markdown preview. An embedded transcript
uses the Markdown embed's left border and file name, and frames the reading
with the theme border and a small theme radius. Inside a transcript,
Markdown links render as links and a wiki embed renders through the same file
adapter. Find and replace and the turn-details card are package-owned against the
published Design Core chat document. The card overlays the reading surface
while the pointer is on that turn's marker and does not resize the transcript
pane. Hidden message actions stay out of pointer hit testing until that message
is hovered, and they stay hidden while the pointer is on the turn navigation. Playback starts at the beginning of the note. Find and replace searches
every spoken turn, and a replacement is written back into the note. A timestamp
seeks to that spoken turn and plays, the active turn is highlighted without
moving its avatar, and its metadata shows an animated playback icon with a
pause control. Follow-along pauses after a manual scroll. A saved comment can
be removed from a menu that uses the message-square-x icon and is wide enough
to show the label without scrolling. A find control to the left of the
speaker count toggles find and replace. The footer also seeks, skips ten
seconds, mutes, changes volume, and changes playback speed. Narrow panes keep
seek, mute, and play, and hide the extra controls.

The package lives at `packages/transcripts` as version `0.2.0` with runtime id
`lapis-transcripts`. `App` is received by the plugin constructor. The preview
does not read or assign `globalThis.app`.

Clean packaging explicitly uses `src` as its input and `dist` as its output.
Under LP-SPEC-011 the host supplies Markdown through the `^0.1.6` peer
dependency; the same semver development dependency orders clean builds and
checks without bundling another host plugin. The packaging and dependency
corrections have an independent patch Changeset.

Registry identity and capture-backed gallery media remain package-owned under
LP-SPEC-030 and LP-SPEC-031. The governed `Registry Screenshots` story covers
two settled states with both sidebars closed, and stays `visual-pending`
until separate visual approval. The workspace seed opens the spoken sample
before the shell renders, with speaker turns, one comment, and the playback
footer, and both sidebars closed. The gallery seed opens a meeting note that
embeds that call. Capture MUST assert each settled surface
before declaring the story ready. Overview media is omitted because the
gallery already shows the different full-screen state. Release checkboxes stay
unchanged.

## Requirements

| ID       | Requirement                                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-TX-001 | Transcripts MUST live at `packages/transcripts` as `@lapis-notes/transcripts@0.2.0` with runtime id `lapis-transcripts`. The plugin class MUST register the file reading view, an Open transcript command with the audio-lines icon, and a Markdown view-menu action in the same view section as Slides. Pending comments MUST appear in a collapsible section at the end of the document, retaining the controls that return to their source, and the transcript send control MUST appear in the reading footer, to the right of Source, while a comment is active or waiting to be sent. A file whose name ends in `transcript.md` MUST open in the reading view. A full-file Markdown embed of such a file MUST mount that same reading view, and every other Markdown embed MUST remain a portable Markdown preview. Other Markdown files stay in the Markdown editor until the command or menu action opens them. Opening, rendering, seeking, and scrolling MUST NOT change the note body. Closing the reading view MUST return to the source leaf. |
| LN-TX-002 | `Plugins/Transcripts/Panels/Reading` MUST demonstrate the sample reading view in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. Each placement MUST render enough sample speaker turns to scroll, with one comment, transcript padding that keeps the first hover actions in view and clear of the turn-preview markers. Hidden action controls are not pointer targets until that message is hovered., slightly larger circular speaker avatars in distinct colours, and a compact footer in the theme surface colour that stays visible while the turns scroll inside the pane. The footer MUST play a spoken reading of the sample transcript, a timestamp MUST seek to that turn and play, and follow-along MUST pause after a manual scroll. The footer MUST place a seek control to the left of play and MUST include mute, volume, playback speed, and ten-second skip controls. The spoken sample declares that recording in front matter `audio`. A note without a recording MUST NOT show those playback controls. When the pane is narrow, seek, mute, play, and the speaker count MUST stay available. Comment avatars keep the shared size. Middle (Top Tabs) MUST run the Open Explorer command so the file explorer is visible, without adding a workspace tab. It MUST start with the spoken sample and the time-first transcript open in the reading view, and with a separate qualified transcript open through the normal Markdown editor because its name does not end in `transcript.md`. It MUST NOT leave an empty New Tab. Choosing the spoken sample MUST open the reading view in the existing main tab. The sample vault MUST also include the time-then-speaker, centisecond, and single-turn notes, and Middle (Top Tabs) MUST open each of them. That ordinary Markdown note MUST embed `Contract transcript.md` and show the transcript reading surface, including the spoken sample text, while an embedded ordinary note stays a Markdown preview. The embedded reading view MUST NOT show ordered-list markers or Markdown list indentation in Markdown preview or live preview. One icon button MUST open that sample in the default Markdown editor, and the editor MUST be able to return to the transcript. Hovering a turn marker MUST show that turn's words together with the speaker count, duration, audio path, and transcript size. A note without a recording MUST say that no recording is attached. The stories MUST stay `visual-pending`. They MUST NOT capture registry media. |
| LN-TX-003 | The transcript parser MUST be pure. It MUST recognize `Speaker 1  (00:25)` and `00:25:00 Speaker 1`, keep source ranges, and skip fenced code. Two valid headers qualify a note. One header qualifies only when front matter says `type: transcript`. `00:25` MUST mean 25 seconds and `00:25:00` MUST mean 25 minutes unless `timestamp_format` is `mm:ss:cs`. The parser MUST NOT rewrite the note. |
| LN-TX-004 | Comments MUST be written only when the user sends, edits, or removes one. That write MUST update the `comments` list in front matter and MUST leave the transcript body unchanged. The plugin MUST NOT insert front matter before the first save. After a turn's text changes, a saved comment MUST keep its quote and show the unavailable-source state. Removing a saved comment MUST be offered from the turn menu with the message-square-x icon, and that menu MUST show the label without scrolling. |
| LN-TX-005 | Audio MUST be optional and turn-level. The footer MUST play a vault-relative file from front matter `audio`, or, when that field is absent, the first Markdown or wiki link whose target is an audio file. The spoken sample MUST declare its recording in front matter `audio`. When a note has no recording, the footer MUST NOT show playback controls, timestamps MUST NOT act as play buttons, and Source MUST stay at the trailing edge of the footer. A timestamp MUST seek and play. Follow-along MUST pause after a manual scroll. There MUST be no word timings. While a turn is playing, its highlight MUST keep the speaker avatar in place and leave space around the highlight, and the turn metadata MUST show an animated playback icon and a pause control. The dot beside a timestamp MUST appear only while that turn is playing. |

## Verification

Package tests cover the runtime id, the `*transcript.md` editor association, both transcript header styles, fenced code, timestamp formats, comment send, edit, and removal, unavailable quotes, recording paths, the Open transcript command, the Markdown view-menu action, the transcript Markdown embedder, and return to the source leaf. Each Reading placement asserts the transcript region, a
speaker, slightly larger circular avatars, the comment at the shared avatar size, the compact theme-surface footer, scroll overflow inside the pane, the
workspace surface, and the source icon opening the Markdown editor. Every placement exposes seek and mute. The wide middle placement also exposes volume, playback speed, and ten-second skip. Middle (Top Tabs) also runs Open Explorer, starts with the spoken sample and the time-first transcript open in the reading view, opens Draft meeting.md in the Markdown editor, opens the spoken sample from that explorer in the existing main tab, and opens the centisecond and single-turn notes before returning to the spoken sample and then the draft. Reading that draft shows the embedded contract transcript, including the spoken sample text, without ordered-list markers, and keeps an embedded ordinary note as a Markdown preview. Those wiki embeds mount through the package file embed. The spoken sample seeks from a timestamp and pauses follow-along after a manual scroll. That recording is `packages/transcripts/assets/sample-meeting.m4a`, declared as front matter `audio: recordings/meeting.m4a`. The time-first, centisecond, and single-turn notes have no recording, so their footers omit playback controls and keep Source at the trailing edge.

Catalog fixtures declare their actual composition under LP-SPEC-054. Synthetic
setup actions use the separate LP-SPEC-055 fixture-controls surface; application
stories retain the production WorkspaceShell. Loading and failure placeholders
remain explicitly identified as boot status rather than alternate app chrome.

Package construction uses the declared `src` root explicitly so the published
`dist/index.js` and declaration entrypoints are present in clean containers.
The default `src/lib` assumption cannot qualify the package export contract.
