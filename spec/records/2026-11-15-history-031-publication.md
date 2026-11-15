# History 0.3.1 publication

The approved controller recovery slice merged through Plugins PR #124 as
`025e455896eb78224df983d98a53a9b88c521fee`. Version PR #125 passed hosted checks
and merged as `5c96b4a08495a8158c7ad7e03af787227470ba41`, the exact release
source. Main CI run 43688995804 and protected publication run 43689053817 passed.
The pending version-PR workflow 43687943999 was explicitly approved. The release
selected History only and published through GitHub workflow `release.yml`.

[GitHub release](https://github.com/lapismd/lapis-plugins/releases/tag/history%400.3.1)
and npm `@lapis-notes/history@0.3.1` are published. Downloaded GitHub archive bytes
match the release checksum and GitHub asset digest:

- File: `history-0.3.1.lapis-plugin`
- Length: 190,858 bytes
- SHA-256: `e5ee06a8f356ea3e6588f3609bbb31ef7adb80393aefdfd1a3953823fe92b5a7`
- npm tarball length: 169,653 bytes
- npm integrity:
  `sha512-zYKavCmLEfkL05swvLfatWj7j2LOwQBgnkBqZ9ubJWkfKZ1nk4w86WGcYd5aey1ii9zineyEjiJn3WCT+vdUtg==`

The public npm tarball's computed SHA-512 matches registry metadata. Registry
submission PR #135 was reviewed as one History request at the exact source and
merged after checks. Signed publication PR #136 contained only that submission
and its generated History/catalog metadata, passed checks, and merged as
`212c0c190bbac37b84c45dff8cbcd60eac889c43`. Production workflow 43692511054 passed.

Live `https://registry.lapis.md/v2/plugins/history.json` reports
`latestVersion: 0.3.1`. The actual `/download/history/0.3.1` response contains
190,858 bytes and is byte-for-byte identical to the GitHub archive above. These
checks complete public distribution for the controller recovery slice; native
remote orchestration, production UI adoption and cold Desktop/Server acceptance
remain open under LN-HIST-020.

Commands used include `gh pr checks`, exact-SHA guarded GitHub merges,
`gh workflow run release.yml` with explicit per-plugin inputs, `gh release
 download`, public registry metadata/download requests, and SHA-256/SHA-512
comparison. The first local dispatch rejected JSON booleans before sending a
request; converting CLI inputs to strings dispatched the one successful release.
A redundant manual version-branch CI dispatch was cancelled after approving its
proper PR workflow. No version was republished.
