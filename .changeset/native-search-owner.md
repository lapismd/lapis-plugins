---
"@lapis-notes/search": patch
---

Use an explicitly selected native indexing observer for Search configuration,
refresh and progress while preserving standalone browser processing. Keep view
teardown passive, fence late continuations and recreate the manager when the
plugin is enabled again.
