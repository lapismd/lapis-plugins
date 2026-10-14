---
"@lapis-notes/markdown": patch
---

Require Mira 0.0.4 so replacing or disposing File Properties cancels pending
overlay registration and focus work without reading destroyed Svelte effects.
