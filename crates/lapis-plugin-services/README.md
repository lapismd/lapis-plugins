# Native plugin services

Private native algorithms used by the shared Rust application-service migration.
The Markdown intake ports the existing lightweight metadata extractor.
The retained renderer and Rust tests consume the six original source fixtures
and 55 complete serialized YAML metadata outcomes. A typed YAML 1.2 reader
preserves Unicode and scalar/error semantics without code-point substitution.
Parser version `markdown-native-v2` invalidates the prior interpretation;
UTF-8 content MD5 stays unchanged.

The pure `search::canvas_text` intake stages the retained built-in Canvas Search
projection against 37 complete outcomes from the unchanged TypeScript provider.
It owns no provider admission, configuration, database or scheduler.

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
