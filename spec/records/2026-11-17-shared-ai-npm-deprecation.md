# Shared-AI npm deprecation

The user approved the exact metadata candidate on 2026-11-17 after source
retirement landed in #155. All eleven published `@lapis-notes/ai` versions now
carry the approved retirement message: 0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.6,
0.1.7, 0.1.8, 0.1.12, 0.1.13, 0.1.15 and 0.1.16.

> Retired shared AI plugin. Use the AI bundled with Lapis Desktop; keep existing
> settings, conversations and memory. See https://github.com/lapismd/lapis-desktop.

Version 0.1.0 also retains a packaging-defect warning. Its previous warning
recommended a later version of the now-retired distribution; the approved new
text preserves the defect reason and supplies current replacement guidance.
The initial npm credential returned E401. Browser login and account
authentication completed before the changes were applied. No credentials or
account-authentication links are included in the receipt.

## Verification and attempts

Fresh public metadata verifies the exact eleven messages, unchanged version
inventory and unchanged `latest` tag 0.1.16. All original tarball URLs and
integrity values are unchanged. Each of the eleven tarballs was independently
downloaded and SHA-512 verified against its pre-change integrity value.
[Exact candidate, metadata and downloaded-artifact evidence](2026-11-17-shared-ai-npm-deprecation.json)
records every version separately.

The first post-change read of 0.1.0 remained stale during bounded polling;
subsequent fresh metadata confirmed successful application. That mutation was
not replayed. The remaining ten versions used an exact semver union with their
common approved message, reducing repeated account-authentication prompts.
The unused initial challenge was cancelled before mutation; no uncertain
accepted write was automatically replayed.

The owner `pnpm run audit --json` exits zero under the existing documented
CVE-2026-112366 exception. Its raw vulnerability totals still include the two
underlying high findings and one low finding; this receipt does not claim they
are fixed. No advisory exception, dependency or lockfile changed. Documentation
formatting passes. These evidence-only files require no product-suite rerun.

No package was unpublished or newly published, no release artifact was changed,
and no installed state was removed. Registry retirement has its separate owner
receipt. Notes' approved provenance guard, API publication/adoption, actual
native installed-data acceptance and website deployment retain their own gates.
Terminal migration remains the final removal.
