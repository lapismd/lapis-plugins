# Existing Mermaid audit findings during Desktop UI migration

The required audit reproduced three existing DOMPurify advisories through
Mermaid: critical GHSA-cg2g-xh64-v4q7, high GHSA-mrv2-3pqr-j5jr and low
GHSA-c6gr-qvv4-5v3f. Source compatibility evidence remains in
`2026-10-23-desktop-mira-compatibility.md`.

The user explicitly chose: "Continue UI migration; track audit findings
separately". These findings are accepted as non-blocking only for the local UI
migration, with no publication. They remain unresolved security findings; no
ignore, dependency patch, security gate reduction or audit-pass claim was added.
Publication and release qualification remain separate.
