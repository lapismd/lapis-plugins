# Transcripts Plugin

`@lapis-notes/transcripts` is the first-party reading view for Markdown
transcripts. The Storybook shell loads the plugin, so Open transcript is in the command palette, with the audio-lines icon, and in the Markdown view menu, and opens parsed vault notes. Pending comments collect in a collapsible section at the end of the note, with the transcript controls that return to each comment's source. The transcript send control appears while a comment is active or waiting to be sent. The spoken sample
uses speaker-then-time and time-then-speaker headers in `mm:ss`, a saved
front-matter comment, and a vault recording. Separate notes cover
time-then-speaker `hh:mm:ss`, `mm:ss:cs`, and a single turn declared with
`type: transcript`. A note whose name ends in `transcript.md` opens in the reading view. One
qualified note does not use that name, so the story opens it in the Markdown
editor. Playback starts at the beginning of the note. A timestamp
seeks to that spoken turn and plays, the active turn is highlighted, and
follow-along pauses after a manual scroll. The footer also seeks, skips ten
seconds, mutes, changes volume, and changes playback speed. Narrow panes keep
seek, mute, and play, and hide the extra controls.

The package lives at `packages/transcripts` as version `0.1.0` with runtime id
`lapis-transcripts`. `App` is received by the plugin constructor. The preview
does not read or assign `globalThis.app`.

Registry capture stays deferred. The package is omitted from registry media
selection until a `Plugins/Transcripts/Registry Screenshots` story exists.
Release checkboxes stay unchanged.

## Requirements

| ID       | Requirement                                                                                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-TX-001 | Transcripts MUST live at `packages/transcripts` as `@lapis-notes/transcripts@0.1.0` with runtime id `lapis-transcripts`. The plugin class MUST register the file reading view, an Open transcript command with the audio-lines icon, and a Markdown view-menu action in the same view section as Slides. Pending comments MUST appear in a collapsible section at the end of the document, retaining the controls that return to their source, and the transcript send control MUST appear while a comment is active or waiting to be sent. A file whose name ends in `transcript.md` MUST open in the reading view. Other Markdown files stay in the Markdown editor until the command or menu action opens them. Opening, rendering, seeking, and scrolling MUST NOT change the note body. Closing the reading view MUST return to the source leaf. |
| LN-TX-002 | `Plugins/Transcripts/Panels/Reading` MUST demonstrate the sample reading view in all six governed placements: Middle (Top Tabs), Stacked Tabs, Left Sidebar, Right Sidebar, Bottom Panel, and Sidebar As a Group. Each placement MUST render enough sample speaker turns to scroll, with one comment, equal transcript padding, slightly larger circular speaker avatars in distinct colours, and a compact white footer that stays visible while the turns scroll inside the pane. The footer MUST play a spoken reading of the sample transcript, a timestamp MUST seek to that turn and play, and follow-along MUST pause after a manual scroll. The footer MUST place a seek control to the left of play and MUST include mute, volume, playback speed, and ten-second skip controls. When the pane is narrow, seek, mute, play, and the speaker count MUST stay available. Comment avatars keep the shared size. Middle (Top Tabs) MUST run the Open Explorer command so the file explorer is visible, without adding a workspace tab. It MUST start with the spoken sample and the time-first transcript open in the reading view, and with a separate qualified transcript open through the normal Markdown editor because its name does not end in `transcript.md`. It MUST NOT leave an empty New Tab. Choosing the spoken sample MUST open the reading view in the existing main tab. The sample vault MUST also include the time-then-speaker, centisecond, and single-turn notes, and Middle (Top Tabs) MUST open each of them. One icon button MUST open that sample in the default Markdown editor, and the editor MUST be able to return to the transcript. The stories MUST stay `visual-pending`. They MUST NOT capture registry media. |
| LN-TX-003 | The transcript parser MUST be pure. It MUST recognize `Speaker 1  (00:25)` and `00:25:00 Speaker 1`, keep source ranges, and skip fenced code. Two valid headers qualify a note. One header qualifies only when front matter says `type: transcript`. `00:25` MUST mean 25 seconds and `00:25:00` MUST mean 25 minutes unless `timestamp_format` is `mm:ss:cs`. The parser MUST NOT rewrite the note. |
| LN-TX-004 | Comments MUST be written only when the user sends, edits, or removes one. That write MUST update the `comments` list in front matter and MUST leave the transcript body unchanged. The plugin MUST NOT insert front matter before the first save. After a turn's text changes, a saved comment MUST keep its quote and show the unavailable-source state. |
| LN-TX-005 | Audio MUST be optional and turn-level. The footer MUST play a vault-relative file from front matter `audio` or a Markdown recording link. A timestamp MUST seek and play. Follow-along MUST pause after a manual scroll. There MUST be no word timings. |

## Verification

Package tests cover the runtime id, the `*transcript.md` editor association, both transcript header styles, fenced code, timestamp formats, comment send, edit, and removal, unavailable quotes, recording paths, the Open transcript command, the Markdown view-menu action, and return to the source leaf. Each Reading placement asserts the transcript region, a
speaker, slightly larger circular avatars, the comment at the shared avatar size, the compact white footer, scroll overflow inside the pane, the
workspace surface, and the source icon opening the Markdown editor. Every placement exposes seek and mute. The wide middle placement also exposes volume, playback speed, and ten-second skip. Middle (Top Tabs) also runs Open Explorer, starts with the spoken sample and the time-first transcript open in the reading view, opens Draft meeting.md in the Markdown editor, opens the spoken sample from that explorer in the existing main tab, and opens the centisecond and single-turn notes before returning to the spoken sample and then the draft. The spoken sample seeks from a timestamp and pauses follow-along after a manual scroll. That recording is `packages/transcripts/assets/sample-meeting.m4a`.
