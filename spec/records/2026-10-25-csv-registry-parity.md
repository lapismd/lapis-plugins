# CSV registry application coverage inventory

The unchanged CSV Registry Screenshots family renders RegistryDemo through the
existing PanelDemo and public production WorkspaceShell, with a real App and
plugin registration. Its four scenarios already cover the table, source,
Markdown embed and find interaction. The inventory omitted this new family.

Exact command `pnpm check:storybook-parity` fails with one LP-SPEC-054 finding
on the YAML source candidate in `648a4ee6-b83a-4dbd-86cb-2dc2f5dcd309`.
Parent reproduction `df8716e4-5605-4295-9c17-680bccdeb39c` checks out committed
Plugins `5031f9bb` and reproduces the identical one-finding failure. No story or
product change is involved.

The repair declares the existing family as application coverage. It adds no
exemption, prototype classification, bypass, component replacement or weaker
assertion. Run `3f0d9e65-67e3-4de8-bec0-d35f55b288e8` passes the exact guard
(57 families, zero findings) and all 47 owning tooling regressions. Fresh `41f7dfa8-800b-46c9-a1e6-738549b616c8` passes all four CSV
interaction/accessibility cases alongside all 50 Markdown cases. The prior
worker omitted the canonical private Sync installation and is retained as failed. Visual
baselines and approvals remain unchanged.
