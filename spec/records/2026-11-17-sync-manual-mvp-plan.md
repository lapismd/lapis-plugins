# Manual encrypted Lapis Sync MVP scope

The user approved reducing active delivery to two macOS ARM64 Desktop devices,
one logical vault and one authenticated ciphertext-only Lapis Server destination.
Sync now drives checkpoint/transfer/guarded apply; conflicts retain both versions
and require explicit manual resolution. Minimal encrypted recovery remains in
scope. The implementation plan owns the exact exit journey and safety matrix.

Server decrypting participation/Web editing, automatic operation, rich merge/
history/restore, rotation management and other platforms are deferred. Existing
source, protocol compatibility and immutable receipts remain unchanged. This
record changes planning, not implementation or parked/publication status.

Sources: clean independent Plugins main993e5345 and Desktop main9805eff8.
The unfinished Desktop App implementation and pinned Plugins fixtures remain
untouched. Current main already uses validator0.2.1 through portable semver/lock;
no dependency or unrelated resolution change is retained. Initial borrowed0.2.0 validation
could not load local TypeScript before dependency installation; no product cases
ran. Frozen root dependency installation supplies the normal tooling.

Validation results are appended after execution. Visual review remains pending;
no native, two-device, publication or release qualification is claimed here.

## Documentation results

- Published validator0.2.1: `pnpm spec:check` passes validate, mdBook and
  spec-first (three lanes); final scoped Markdown formatting passes.
- `pnpm audit`: one existing ignored LOW finding, no active findings. No audit
  exception changed. Frozen dependency install passes; tracked dependencies and
  lockfile remain identical to current main.
- All changed authored plan chapters remain within400lines/32768bytes.
- Product/native/catalog/pack lanes are not rerun for this prose-only change;
  no executable examples, runtime contracts or installation profiles changed.
