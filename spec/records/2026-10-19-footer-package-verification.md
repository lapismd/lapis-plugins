# AI footer package verification

Follow-up to the footer spacing source change c80fb4cb629d02d548dcba598e86c293f58295e7.
LN-AI-027 retains the approved shell-track boundary; no new runtime behavior.

- `node scripts/build-plugin-release.mjs --plugin ai --out-dir .release/footer-ai-final`: pass.
- `node scripts/verify-plugin-release.mjs .release/footer-ai-final`: pass.
- Repeat into `.release/footer-ai-repeat`, then `cmp` of the payloads: pass.
- Both payloads have SHA-256 `4237069b0987db1decaab8df2d77e9b240c8533291a0295bb89466c0f33e875e`.
- `pnpm --config.ignore-scripts=true pack --pack-destination ../../.release/footer-npm`
  from packages/ai: pass, built public npm payload present.
- The source slice separately passed 376 AI tests, six panel interaction/axe
  placements, types, build/publint, audit, spec/App ownership and 119
  release/archive/signature regressions. No production keys were used.

These are local development artifacts, not a publication or signed production
release. Source development is on a different lineage from the local main
bookmark; do not overwrite unrelated main history. Desktop consumes the retained
AI presentation through its separately owned implementation and verification.
