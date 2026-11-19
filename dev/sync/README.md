# Parked Sync connection review

This directory preserves the private Sync UI fixtures and review tests for the
future Rust/Tauri delivery plan. It is not a supported Deno host or current
native acceptance lane.

The Notes `packages/server-deno` and `packages/desktop-deno` sources and their
native review driver have been retired. Do not restore those packages, start the
old Deno server, or point `LAPIS_SYNC_NATIVE_HOST_DRIVER` at a historical file.
The retained browser review can still render the built private Sync plugin, but
connection, account and native-process scenarios have no supported live host.

Resume this fixture only after the owning Sync plan supplies a reviewed
Rust/Tauri server and native-account adapter. That work must preserve the
portable engine, public API contracts, stored data and the separation between
source qualification, native acceptance and publication. See
[`spec/src/plugins/sync/implementation-plan.md`](../../spec/src/plugins/sync/implementation-plan.md).

No command in this directory currently qualifies application or server Sync.
