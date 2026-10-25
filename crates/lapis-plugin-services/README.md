# Native plugin services

Private native algorithms used by the shared Rust application-service migration.
The first intake ports the existing lightweight Markdown metadata extractor.
The retained renderer and Rust tests consume the same six source fixtures.

Run with the migration's pinned toolchain:

```sh
cargo +1.99.0 test --manifest-path crates/lapis-plugin-services/Cargo.toml
cargo +1.99.0 clippy --manifest-path crates/lapis-plugin-services/Cargo.toml --all-targets -- -D warnings
cargo +1.99.0 build --manifest-path crates/lapis-plugin-services/Cargo.toml
pnpm --dir packages/markdown exec vitest run src/lib/metadata/extract-metadata.test.ts
```

Notes temporarily consumes this private crate through a sibling path, recording
source qualification separately from host selection. No npm manifest or public
plugin contract changes. Application coordination and normalized database
records remain Notes-owned; task/custom projection processors remain pending.
