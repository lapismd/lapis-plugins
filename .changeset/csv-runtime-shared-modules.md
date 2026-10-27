---
"@lapis-notes/csv": patch
---

Mirror the workspace-host binding and the Svelte events/reactivity renderer
modules that the CSV runtime already imports in the plugin archive's shared
dependency metadata, so the packaged runtime resolves them from the host
allowlist like every other Svelte component package.
