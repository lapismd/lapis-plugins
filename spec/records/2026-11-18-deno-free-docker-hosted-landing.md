# Deno-free portable validation: hosted landing

Owner: Plugins. Requirement: LP-SPEC-053. This immutable receipt records
[PR #158](https://github.com/lapismd/lapis-plugins/pull/158) after its
2026-11-18T04:36:41Z merge. It supplements the earlier
[local qualification](2026-11-18-deno-free-docker-validation.md), which remains
unchanged. The
[machine receipt](2026-11-18-deno-free-docker-hosted-landing.json) contains
exact identities and SHA256 hashes for every retained raw log, diagnostic
metadata/JUnit result and root review snapshot.

## Exact source and landing

Checked PR head: `54552e6353f05d66556180799992569a417d8735`. Base:
`8a90c1063dab11af5e5c211bc00a3ebbce79c0cd`. Actual main merge:
`2bab1ccd6e63cacfb2c2a57fc492b60efdd7f56c`. Both checked head and merge have Git
tree `c804f30fb861edf96bc881d90385c2a0dd7a6784`; an independent Jujutsu tree
diff is empty. The cold diagnostics use empty child
`43afa8039d306e2d110c676ddae765cde5d72f62`, whose tree also matches the checked
head. No source, configuration, assertion, timeout or filter changed between the
failed attempt, diagnostics and accepted retry.

## Hosted attempts and original failure

[CI run 44234359523](https://github.com/lapismd/lapis-plugins/actions/runs/44234359523)
first completed with 361 passing cases, 49 unexecuted cases and one unhandled
browser setup error. Quarter-3 job `134567978322` passed 29 cases in eight files
during internal shard 5/8, then lost its browser connection before
`Recovery.stories.ts` could create its tester. The reported chain was
`[vitest] Browser connection was closed while running tests` and
`[birpc] rpc is closed, cannot call "createTesters"`. Its one Recovery case and
all 48 cases in internal 6/8 did not execute; aggregate `134571590604` failed.
This is not an assertion or accessibility failure, and the underlying cause
remains unresolved. No product fix, baseline classification, quarantine,
exception or waiver is claimed.

Root independently reviewed the two cold diagnostics below, then made exactly
one accepted targeted rerun request for failed job `134567978322` and its
dependent aggregate. Run 44234359523 attempt 2 retained the same checked head.
Quarter-3 job `134574812256` passed 30 cases in 5/8 and 48 in 6/8, including
Recovered Settings. Combined with the successful other quarters, all eight
invocations passed: **48, 46, 58, 67, 30, 48, 64, 49 = 410 cases**; none failed,
skipped or remained unexecuted. Final aggregate `134577006234` passed at
04:34:40Z with all blocking lanes green. The 15 successful jobs include the full
product and canonical path; only the configured specification-only fast lane was
skipped. The original failure remains retained separately.

## Independent cold diagnostics

| Diagnostic             | Owned Docker run                       | Result                                                   |
| ---------------------- | -------------------------------------- | -------------------------------------------------------- |
| Exact internal 5/8     | `de43cf4b-1040-4b46-9288-542b0ae2a370` | 30/30 cases, 9/9 files; 96.43 s actual Vitest execution. |
| Isolated Recovery file | `76ddb3d2-bc72-46a7-876b-4d53c05599ac` | 1/1 case, 1/1 file; 17.71 s actual Vitest execution.     |

Both use fresh owned Omarchy containers, frozen root and private Sync installs,
2 CPUs, 12 GiB memory, 2 GiB shared memory and a 6144 MiB Node heap. The image
is `sha256:3078eab0ae796a0fbcabd8af91461d78ee3e1d50e46449a0332259a8ef6b42e7`.
The registered lane invokes Vitest directly, so these are actual cold Chromium
runs, not Turbo-replayed results. JUnit reports zero failures, errors and skips;
root verified metadata hashes and counts before the hosted retry. Diagnostic
source/image/resources, full container logs and JUnit hashes are recorded in the
machine receipt. The hosted dependency image has a distinct digest, also
recorded there; local diagnostics are not represented as hosted-image parity.

## Evidence boundaries

Raw evidence is retained under `.local/validation/` in the isolated owner
workspace. These ignored files are identified and hash-sealed by the committed
machine receipt; hosted jobs also retain their canonical GitHub IDs/URLs. This
receipt changes documentation only and leaves prior records immutable.

Actual-main CI `44238530243` and normal Version packages `44238530347` are
separate post-merge workflows. Their current qualification is monitored
independently; this receipt does not infer actual-main success from the PR run.
No workflow was dispatched or retried for this receipt. Package/artifact
publication, registry actions, installed-app replacement, visual baselines and
manual Sync/native/provider acceptance retain their separate gates. Core
services/functions, Language Service, parked Sync, native AI and terminal
migration scope remain preserved.
