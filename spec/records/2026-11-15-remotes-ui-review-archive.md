# Reviewed History archive verification

Source: `b758c47d68df`, including the reviewed remotes UI and catalog repairs.
The source checkpoint was clean before archive construction.

- `pnpm plugin:build -- --plugin history` passed deterministic payload
  reproduction for History 0.2.6.
- `pnpm plugin:verify` passed payload integrity and checksum validation.
- Payload SHA-256:
  `7bb3d0a71fddfdd480f960acb3ee6c873b41fc964a412db6dda5296da9cfe805`.

This is the local unsigned payload qualification. Production signing, npm
publication and public release assets belong to the authorized GitHub release
workflow. Host adoption and real transport qualification remain separate.
