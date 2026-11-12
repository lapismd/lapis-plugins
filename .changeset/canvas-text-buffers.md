---
"@lapis-notes/canvas": patch
---

Flush pending text-card editors through the parent Canvas writer before switching, renaming or teardown. Preserve virtual editor drafts across failed saves and synchronize reviewed conflict recovery and protected native refresh with the complete JSON document.
