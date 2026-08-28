# Lapis Plugins

This monorepo contains the independently versioned first-party plugins for the
Lapis application framework. Applications compose the plugins they need by
installing their npm packages and registering an app-owned static plugin
profile. The same package version can also be installed at runtime from its
signed `.lapis-plugin` release asset.

## Packages

| Package | Runtime plugin ID |
| --- | --- |
| `@lapis-notes/ai` | `ai` |
| `@lapis-notes/bases` | `bases` |
| `@lapis-notes/bookmarks` | `bookmarks` |
| `@lapis-notes/graph` | `lapis-graph` |
| `@lapis-notes/history` | `history` |
| `@lapis-notes/markdown` | `markdown` |
| `@lapis-notes/markdown-lint` | `lapis-markdown-lint` |
| `@lapis-notes/search` | `search` |
| `@lapis-notes/source-editor` | `lapis-source-editor` |
| `@lapis-notes/spellcheck` | `spellcheck` |
| `@lapis-notes/wordcount` | `wordcount` |

The package name and runtime ID intentionally remain separate compatibility
contracts. Runtime IDs are not changed during extraction.

## Development

The repository has one Storybook. Stories remain grouped by owning package
under `stories/plugins`. Package manifests use registry semver ranges even
during local development; prerelease validation supplies framework tarballs in
an isolated temporary consumer without changing publishable manifests.

```sh
pnpm packages:check
pnpm spec:check
pnpm check
pnpm test
pnpm build
pnpm build-storybook
```

See [RELEASING.md](./RELEASING.md) for the manual publication gate and release
asset contract.
