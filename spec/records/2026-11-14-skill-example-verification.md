# Authored skill example verification

The final Markdown skill example runs through the production metadata parser in
`packages/markdown/src/lib/skill-examples.test.ts`. It preserves typed frontmatter
arrays, heading structure, aliased and heading wikilinks, and the image reference.
The exact target passes 1/1; the complete Markdown package passes 155 tests across
26 files, zero-warning check, build and publint.

The Bases example already passes its owning document-normalization regression;
Canvas JSON examples run through the production Canvas validator. Skill
frontmatter, licenses, exports, payload hashes and signed envelopes pass the four
asset tests. The complete AI package passes 376 tests after its legacy update
entrypoint delegates to protected App management.

This final slice changes acceptance coverage and specifications only. The
qualified npm and signed skill assets remain byte-identical to the
[archive qualification](2026-11-14-plugin-skill-archives.md). No release is made.
