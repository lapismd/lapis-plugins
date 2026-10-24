# Transcripts Plugin

`@lapis-notes/transcripts` is the first-party reading view for Markdown
transcripts. The Storybook preview uses sample turns and does not parse that
story note. Opening a note from the plugin parses the transcript, plays an
optional vault recording, and saves comments in front matter. The story preview
starts at the second turn, a timestamp seeks to that spoken turn and plays, the
active turn is highlighted, and follow-along pauses after a manual scroll. The
footer also seeks, skips ten seconds, mutes, changes volume, and changes
playback speed. Narrow panes keep seek, mute, and play, and hide the extra
controls.

The package lives at `packages/transcripts` as version `0.1.0` with runtime id
`lapis-transcripts`. `App` is received by the plugin constructor. The preview
does not read or assign `globalThis.app`.

Registry capture stays deferred. The package is omitted from registry media
selection until a `Plugins/Transcripts/Registry Screenshots` story exists.
Release checkboxes stay unchanged.

## Requirements

| ID       | Requirement                                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-TX-001 | Transcripts MUST live at `packages/transcripts` as `@lapis-notes/transcripts@0.1.0` with runtime id `lapis-transcripts`. The plugin class MUST register the file reading view, an Open transcript command, and a Markdown view-menu action. Opening, rendering, seeking, and scrolling MUST NOT change the note body. Closing the reading view MUST return to the source leaf. |
| LN-TX-002 | `Plugins/Transcripts/Panels/Reading` MUST demonstrate the sample reading view in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. Each placement MUST render enough sample speaker turns to scroll, with one comment, equal transcript padding, slightly larger circular speaker avatars in distinct colours, and a compact white footer that stays visible while the turns scroll inside the pane. The footer MUST play a spoken reading of the sample transcript, a timestamp MUST seek to that turn and play, and follow-along MUST pause after a manual scroll. The footer MUST place a seek control to the left of play and MUST include mute, volume, playback speed, and ten-second skip controls. When the pane is narrow, seek, mute, play, and the speaker count MUST stay available. Comment avatars keep the shared size. Middle (Top Tabs) MUST run the Open Explorer command so the file explorer is visible, without adding a workspace tab, and choosing the sample note MUST open the reading view in the existing main tab. One icon button MUST open that sample in the default Markdown editor, and the editor MUST be able to return to the transcript. The stories MUST stay `visual-pending`. They MUST NOT capture registry media. |
| LN-TX-003 | The transcript parser MUST be pure. It MUST recognize `Speaker 1  (00:25)` and `00:25:00 Speaker 1`, keep source ranges, and skip fenced code. Two valid headers qualify a note. One header qualifies only when front matter says `type: transcript`. `00:25` MUST mean 25 seconds and `00:25:00` MUST mean 25 minutes unless `timestamp_format` is `mm:ss:cs`. The parser MUST NOT rewrite the note. |
| LN-TX-004 | Comments MUST be written only when the user sends, edits, or removes one. That write MUST update the `comments` list in front matter and MUST leave the transcript body unchanged. The plugin MUST NOT insert front matter before the first save. After a turn's text changes, a saved comment MUST keep its quote and show the unavailable-source state. |
| LN-TX-005 | Audio MUST be optional and turn-level. The footer MUST play a vault-relative file from front matter `audio` or a Markdown recording link. A timestamp MUST seek and play. Follow-along MUST pause after a manual scroll. There MUST be no word timings. |

## Verification

Package tests cover the runtime id, both transcript header styles, fenced code, timestamp formats, comment send, edit, and removal, unavailable quotes, recording paths, the Open transcript command, and return to the source leaf. Each Reading placement asserts the transcript region, a
speaker, slightly larger circular avatars, the comment at the shared avatar size, the compact white footer, scroll overflow inside the pane, the
workspace surface, and the source icon opening the Markdown editor. Every placement exposes seek and mute. The wide middle placement also exposes volume, playback speed, and ten-second skip. Middle (Top Tabs) also runs Open Explorer and opens the sample note from that explorer in the existing main tab. The spoken sample seeks from a timestamp and pauses follow-along after a manual scroll. That recording is `packages/transcripts/assets/sample-meeting.m4a`.
