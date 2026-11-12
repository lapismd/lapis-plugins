---
"@lapis-notes/canvas": patch
---

Keep queued board saves attached to their original Canvas file, serialize writes,
and flush before file transitions. Preserve newer drafts after a failed write and
show a retry action without replacing the board. Use the public reactive mount
contract for settings and save-state updates.
