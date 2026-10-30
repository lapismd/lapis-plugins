# Search teardown artifact qualification

Search source `8781615e` follows its required committed-source checkpoint.
The working copy was empty before running the standard release builder.

- `pnpm plugin:build -- --plugin search --out-dir .release/search-teardown`
  passes. The builder creates and byte-compares its deterministic reproduction.
- `pnpm plugin:verify .release/search-teardown` passes metadata and checksum
  validation for the actual Search payload.
- Payload SHA256:
  `819d233f1b10c533debb68d8290be2f72ae690e222ad7c1b377cc5f7e7bc3fc5`.
- Public Svelte package build/publint and npm pack pass. Source qualification
  retains all 258 catalog cases and 2,000 Desktop consumer executions from the
  preceding record. These are distinct from official signing or publication.
- The 119 source release-tool cases retain signing/verification coverage; no
  release key, public registry or installed plugin is changed by this run.

The first builder attempt correctly refused uncommitted source. The subsequent
successful checkpoint's message formatting was corrected through Jujutsu, then
the standard builder and verifier were rerun against the final revision above.
The payload bytes are identical. Specification and App-ownership checks pass
before the source checkpoint; this document-only follow-up reruns governance.

Main remains protected by GitHub's required pull-request checks, as recorded by
the earlier rejected push. No force push, protection bypass or package release
is attempted. Distribution and human visual approval remain separate gates.
