# Search public packaging acceptance

Source revision `cd8debd7cff7c18554e561dce9b9d3b4e49b3cb8` implements
LN-SRCH-051/052/053 with naturally named version containers, named header
buttons and nested match groups. This record adds verification only; those
contracts and their Implemented verification rows remain unchanged. Wider
release/provider gates and visual baseline approval remain deferred.

Commands run after the source commit:

- `pnpm --filter @lapis-notes/search build`: pass, including publint.
- `pnpm --filter @lapis-notes/search --config.ignore-scripts=true pack
--pack-destination .local/packages/history-search-natural-final`: pass.
- `pnpm plugin:build -- --plugin search --out-dir
.local/history-search-natural-release`: pass, including deterministic repeat.
- `pnpm plugin:verify .local/history-search-natural-release`: pass,
  signed payload inventory and checksum validation.

Archive SHA256: `40484714d2eb1c0c75e93a4b177db42f132aa211781f3bd7daf9b577dece8e4f`.
Payload ZIP SHA256: `b629e8e0c1d4fe6748cd7aa529610fafeba9b5a11ae8542ed5bfa41f7fa67dde`.
Logs: `.local/history-search-natural-{final-build,final-pack,release-build,release-verify}.log`.
Consumer Desktop acceptance installs the verified public archive alongside its
13 other coherent routes and passes all seven Search interaction/axe stories.
The preceding affected Search/AI settings/Terminal consumer run passes 32 cases.
This is local migration acceptance; no publication or production signing occurs.

The source commit's 13 cold Search stories, 44 unit tests, check, audit,
App-ownership and specification results remain in the preceding record.
