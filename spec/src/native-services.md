# Native first-party plugin services

The private `crates/lapis-plugin-services` crate owns transport-independent
first-party algorithms for the shared Rust migration. It has no Tauri, HTTP,
database, application scheduler or renderer dependency. Published npm plugin
contracts and the standalone browser implementation remain unchanged.

## Requirements

| ID            | Requirement                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-NATIVE-001 | The native Markdown extractor MUST retain the existing renderer extractor's frontmatter, heading, link, tag, heading-context and UTF-16 position results. Shared fixtures MUST qualify both implementations. |
| LN-NATIVE-002 | Native Markdown cache identity MUST use the retained MD5 of the UTF-8 source bytes. Application policy MUST own index publication and unattended lifetime.                                                   |

This intake covers the existing lightweight metadata extractor. Task, custom
projection and extension processors remain separate migration work. It neither
loads JavaScript into the Rust service nor qualifies either host's owner cutover.

## Catalog validation integration

Docker catalog qualification supplies checksum-verified prerequisites before
resolving its temporary install graph. This changes no native Markdown parser
contract or output; native service acceptance and registry-only release
qualification remain separate. The native migration source stays pinned by
Notes rather than being inferred from a mutable checkout.

CSV externalizes `@lapis-notes/api/editor/core` and `@codemirror/search` as
host peers. That metadata synchronization changes no native Markdown parser
behavior. Its native migration contract remains the independently owned pure
service boundary, with source and renderer qualification recorded separately.
Including `Plugins/CSV/Registry Screenshots` in registry media selection
changes no native Markdown parser behavior.
