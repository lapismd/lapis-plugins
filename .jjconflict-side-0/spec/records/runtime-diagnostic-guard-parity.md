# Svelte runtime diagnostic guard parity

Plugins already made the literal derived_inert warning fatal. Its owned Storybook
guard now covers Svelte prefixes, formatted messages, diagnostic URLs and Error
objects, preserves original logging, and retains diagnostics when teardown
catches the immediate exception. After-story and final-cleanup hooks reject the
retained diagnostics. Safe disposal preserves a newer console owner.

The exact Node regression changes from two passing and six failing tests to
eight passing tests. The existing release-test glob includes this regression.
Full plugin Storybook and artifact qualification remains deferred until the
published API prerequisites are available and GitHub CI executes those lanes.
No parked Community source is changed or activated.

The full Node release-test lane records 99 passing and two failing tests. Both
failures are outside the guard's changed paths: static-release-candidate cannot
import the required public API registry schema from the old installed package,
and the packed Markdown language-service fixture cannot resolve its referenced
runtime chunk. Both exact targets reproduce independently. The owning lanes are
framework-dependent static candidate generation and Plugins worker-archive
qualification, respectively. These failures are not waived or counted as passes.
`pnpm spec:check` passes validation, mdBook, spec-first and explicit App ownership.
