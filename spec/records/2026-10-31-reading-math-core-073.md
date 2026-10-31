# Reading math integration on Core 0.7.3

Duplicate the verified isolated Reading math slice `4da7d9c4` onto the qualified
Core 0.7.3 intake as `d38932154e319860cfefd29228d51b476c14d094`, preserving
the original workspace, committed evidence and every assertion. Its only
changes remain the governed story, owning Markdown contract, verification and
[baseline receipt](2026-10-31-reading-math-consumer.md). The original receipt
records its exact API 0.2.3/Core 0.7.2/Mira 0.1.3 input; it is not rewritten to
claim this new input.

On the current API 0.2.3/Core 0.7.3/Mira 0.1.3 registry graph, the same cold
exact command passes one executed case, zero failures, with nine filtered:

```sh
pnpm test:storybook -- stories/plugins/markdown/ReadingSurface.stories.ts -t 'Reading Math'
```

Run `lapis-plugins-validation-a400c230-5c90-4969-9315-f611a47a2433` retains
the exact JUnit result. The complete affected Reading Surface file then passes
all ten cases with zero failures or skips, run
`lapis-plugins-validation-9e483a22-1190-4abb-bde8-0f03b792be77`.
Parsed proof `/tmp/lapis-plugins-core073-reading-math-proof.json` independently
checks that Reading Math really executes once in each run; a zero-execution
filter cannot establish this result.

Explicit spec-first comparison from `3ffd1a94` to `d3893215` passes its one
protected story and one mapped canonical chapter. The source slice changes no
runtime implementation, dependency, shared fixture, helper or visual baseline.
Visual review remains pending.

These runs establish the existing consumer behavior on the intermediate input.
They do not qualify the forthcoming Mira math bundle, any separate Mermaid
contract change or Core fixed-minimum release. Repeat the identical cold target and affected
family on the actual final published graph before claiming that acceptance.
