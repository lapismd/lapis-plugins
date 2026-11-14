# Plugin skill archive acceptance

The real Bases, Canvas and Markdown payloads were built with
`node scripts/build-plugin-release.mjs --plugin <name> --out-dir .local/skills-archives`
from committed feature source `f0ffbad3`. The initial dirty-source refusal was
retained; the provenance guard was not bypassed.

Each release was signed with a newly generated, temporary acceptance-only
Ed25519 key, assembled with `buildSignedPluginBundle` and verified with
`verifyPluginBundle`. Every skill body and MIT license occurs in the authenticated
file list and the actual `.lapis-plugin` bytes. The temporary private key was
deleted. No production signing identity or publication was used.

| Plugin   | Signed archive SHA-256                                             |
| -------- | ------------------------------------------------------------------ |
| Bases    | `567729a5be1dccb59e73928237b9614e79dfbcc3e8e2edd8c6b0d2e38c488767` |
| Canvas   | `5c764dcb70857fbb596963abd83f505511a1164057a4420dba98e34fdfa2e4f9` |
| Markdown | `3100f3c2d028b84b186acd1c34ee647c527b648f7865462c3d8f7f5ecc9b1ed8` |

Public npm archives were unpacked and every skill resource compared byte for
byte against the exported `skills.json` and staged signed release assets.
An initially stale Bases development tarball failed the comparison once;
repacking the current owning source repaired that validation prerequisite.

| Package        | npm archive SHA-256                                                |
| -------------- | ------------------------------------------------------------------ |
| Bases 0.3.3    | `a162a086b1dbdcf9b525ca923cba73b127113dd0eb5934c16697eefd1c6cfe6f` |
| Canvas 0.3.2   | `4e3983dc0e020c8a265a06e033f9ec5a8ffdfd1bd61527901c3116805213aab4` |
| Markdown 0.2.6 | `d6e0154e318e845fff751a4eb7bf903abb62c2e3e86e9c54a344aa2735f163bc` |

The permanent asset regression now verifies the signed envelope as well as the
payload. A draft used an incorrect test-key property and failed one case;
the final asset suite passes 4/4 and the release script suite passes 227/227.
Audit passes with the same two existing low-severity exceptions.

Both legacy AI update command entrypoints now delegate to the App's protected
plugin-skill command. Bootstrap stays missing-only, so older unreceipted skills
remain user-owned. The owning AI source/seed regressions, check and build pass.
Current agent bindings retain their snapshots until future binding or explicit
refresh. Release-version publication remains separate.
