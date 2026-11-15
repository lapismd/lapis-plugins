# Remotes source after current-main reconciliation

Candidate `309337d9148e201fbc0e3ae3770f58c75f3aef64` is rebased onto Plugins
main `18df89ca9f509963ff2425c899b421f2d5fd5d2c`. Three append-only canonical
conflicts retain both independent-peer release policy and remotes clauses.
No local `main` bookmark conflict was overwritten.

With Node 24.10.0, native runtime, two Turbo/build workers and bounded Vitest,
`pnpm ci:release` completes successfully:

- Audit, package metadata/boundaries, specs and App ownership pass.
- All 228 release-tool tests pass, zero failures. The prior 227 count predates
  current main's additional release regression.
- All 51 package build/check/test tasks pass, zero failures.
- Public package packs/publint and every plugin payload reproduction and integrity
  check pass. History's pre-version 0.2.7 payload SHA-256 is
  `561a329c82dfd44dc7e77833bc3f01fd08951708f57ea930cf5a648fed7c2a53`.
- Static Storybook builds successfully, retaining existing dependency/chunk
  warnings and `visual-pending` states.

The full 392-pass catalog and 68-pass History runs remain separate receipts.
No product presentation changed during rebase; current-main package versions and
release metadata are preserved. Additive public remotes exports select a minor
History release. Production signing/publication will run through the authorized
GitHub workflow; native host adoption and transport gates remain outstanding.
