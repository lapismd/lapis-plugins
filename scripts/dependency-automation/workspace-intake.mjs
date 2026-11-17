import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { isDeepStrictEqual as equal } from "node:util";
import semver from "semver";
import YAML from "yaml";
import {
  verifyCatalogTransition,
  verifyImmutablePackages,
} from "./workspace-catalog.mjs";

const sections = [
  "dependencies",
  "optionalDependencies",
  "devDependencies",
  "peerDependencies",
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const fail = (reason) => {
  throw Error(`Plugins dependency intake: ${reason}`);
};
export function intakeFacts(policy, files) {
  assert.equal(policy.repository, "lapismd/lapis-plugins");
  assert.equal(policy.schemaVersion, 2);
  assert.equal(policy.kind, "workspace-dependency-intake");
  assert.equal(policy.lockClosure, "registry-transitives");
  assert.equal(policy.slot, "framework-registry");
  assert.deepEqual(policy.dependencies, [
    "@lapis-notes/api",
    "@lapis-notes/file-explorer",
    "@lapis-notes/language-service",
    "@lapis-notes/ui",
    "@lapis-notes/workspace",
    "@lapismd/design-core",
    "@lapismd/jj-history",
    "@lapismd/mira",
    "@lapismd/mira-editor",
    "@lapismd/mira-plugin-ai",
    "@lapismd/mira-plugin-mermaid",
    "@lapismd/spec-validator",
    "@lapismd/storybook-addon-visual-delta",
  ]);
  assert.deepEqual(policy.manifests, [
    "package.json",
    "packages/bases/package.json",
    "packages/bookmarks/package.json",
    "packages/canvas/package.json",
    "packages/csv/package.json",
    "packages/docx/package.json",
    "packages/graph/package.json",
    "packages/history/package.json",
    "packages/markdown-lint/package.json",
    "packages/markdown/package.json",
    "packages/pdf/package.json",
    "packages/search/package.json",
    "packages/slides/package.json",
    "packages/source-editor/package.json",
    "packages/spellcheck/package.json",
    "packages/transcripts/package.json",
    "packages/wordcount/package.json",
  ]);
  assert.deepEqual(policy.chapters, [
    "spec/src/distribution.md",
    "spec/src/spec-governance.md",
    "spec/src/native-services.md",
    "spec/src/plugins/bases/index.md",
    "spec/src/plugins/bookmarks/index.md",
    "spec/src/plugins/canvas/index.md",
    "spec/src/plugins/csv/index.md",
    "spec/src/plugins/docx/index.md",
    "spec/src/plugins/graph/index.md",
    "spec/src/plugins/history/index.md",
    "spec/src/plugins/markdown-lint/index.md",
    "spec/src/plugins/markdown/index.md",
    "spec/src/plugins/pdf/index.md",
    "spec/src/plugins/search/index.md",
    "spec/src/plugins/slides/index.md",
    "spec/src/plugins/source-editor/index.md",
    "spec/src/plugins/spellcheck/index.md",
    "spec/src/plugins/transcripts/index.md",
    "spec/src/plugins/wordcount/index.md",
  ]);
  assert.deepEqual(Object.keys(policy).sort(), [
    "chapters",
    "dependencies",
    "kind",
    "lockClosure",
    "manifests",
    "repository",
    "schemaVersion",
    "slot",
  ]);
  const lock = YAML.parse(files["pnpm-lock.yaml"]),
    workspace = YAML.parse(files["pnpm-workspace.yaml"]);
  const facts = {
    schemaVersion: 2,
    repository: policy.repository,
    manifests: {},
  };
  for (const [path, entry] of Object.entries(lock.importers ?? {}))
    for (const type of sections)
      for (const name of policy.dependencies)
        if (
          entry[type]?.[name] &&
          !policy.manifests.includes(
            path === "." ? "package.json" : `${path}/package.json`,
          )
        )
          fail("undeclared selected importer");
  for (const path of [...policy.manifests].sort()) {
    const manifest = JSON.parse(files[path]),
      importer =
        path === "." || path === "package.json" ? "." : path.slice(0, -13),
      selected = {};
    for (const type of sections)
      for (const name of [...policy.dependencies].sort()) {
        const declared = manifest[type]?.[name];
        if (declared === undefined) continue;
        const range = declared.startsWith("catalog:")
          ? declared.slice(8)
            ? workspace.catalogs?.[declared.slice(8)]?.[name]
            : workspace.catalog?.[name]
          : declared;
        if (
          !semver.validRange(range) ||
          /^(?:file:|link:|workspace:|https?:|git)/.test(range)
        )
          fail("non-registry selected dependency");
        let version = null,
          integrity = null;
        if (type !== "peerDependencies") {
          const entry = lock.importers?.[importer]?.[type]?.[name];
          version = entry?.version?.split("(")[0];
          integrity =
            lock.packages?.[`${name}@${version}`]?.resolution?.integrity;
          if (
            !semver.valid(version) ||
            semver.prerelease(version) ||
            !semver.satisfies(version, range) ||
            !/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity ?? "") ||
            !(
              entry.specifier === declared ||
              (declared.startsWith("catalog:") && entry.specifier === range)
            )
          )
            fail("selected range or registry integrity mismatch");
        }
        (selected[type] ??= {})[name] = { declared, range, version, integrity };
      }
    facts.manifests[path] = selected;
  }
  for (const name of policy.dependencies) {
    const versions = new Set(
      Object.values(facts.manifests).flatMap((m) =>
        Object.values(m).flatMap((g) =>
          g[name]?.version ? [g[name].version] : [],
        ),
      ),
    );
    if (versions.size !== 1)
      fail("selected dependency must have one registry identity");
  }
  return facts;
}
export function intakeSlot(policy, facts) {
  const rows = [];
  for (const [path, groups] of Object.entries(facts.manifests))
    for (const [type, entries] of Object.entries(groups))
      for (const [name, fact] of Object.entries(entries))
        rows.push(
          `| \`${path}\` (${type}) | \`${name}\` | \`${fact.range.replaceAll("|", "\\|")}\` | ${fact.version ? `\`${fact.version}\`` : "Peer support"} |`,
        );
  return [
    `<!-- dependency-intake:${policy.slot}:start -->`,
    "",
    "Current registry dependency coordinates; qualification remains separate.",
    "",
    "<!-- prettier-ignore -->",
    "| Manifest | Dependency | Range | Locked version |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    `Manifest, peer and integrity facts SHA256: \`${hash(JSON.stringify(facts))}\`.`,
    "",
    `<!-- dependency-intake:${policy.slot}:end -->`,
  ].join("\n");
}
function slot(text, policy) {
  const start = `<!-- dependency-intake:${policy.slot}:start -->`,
    end = `<!-- dependency-intake:${policy.slot}:end -->`;
  if (
    typeof text !== "string" ||
    text.split(start).length !== 2 ||
    text.split(end).length !== 2 ||
    text.indexOf(end) < text.indexOf(start)
  )
    fail("missing or ambiguous managed source slot");
  const a = text.indexOf(start),
    b = text.indexOf(end) + end.length;
  return {
    managed: text.slice(a, b),
    outside: text.slice(0, a) + text.slice(b),
  };
}
export function verifyIntake({
  policyBytes,
  files,
  documents,
  before,
  basePolicyBytes,
  baseDocuments,
  changedFiles = [],
}) {
  const policy = JSON.parse(policyBytes),
    facts = intakeFacts(policy, files);
  for (const path of policy.chapters)
    if (slot(documents[path], policy).managed !== intakeSlot(policy, facts))
      fail("managed source facts differ from actual inputs");
  if (!before) return facts;
  const old = intakeFacts(policy, before);
  for (const [path, groups] of Object.entries(old.manifests))
    for (const [type, entries] of Object.entries(groups))
      for (const [name, previous] of Object.entries(entries)) {
        const next = facts.manifests[path][type]?.[name];
        if (!next) fail("selected edge removed");
        if (
          previous.version === next.version &&
          previous.integrity !== next.integrity
        )
          fail("same-version registry integrity changed");
      }
  verifyImmutablePackages(policy, before, files, old, facts);
  if (equal(old, facts)) return facts;
  if (policyBytes !== basePolicyBytes) fail("missing or changed source opt-in");
  const allowed = new Set([
    ...policy.manifests,
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    ...policy.chapters,
  ]);
  const changesets = changedFiles.filter((p) =>
    /^\.changeset\/lapis-dependencies-[a-f0-9]{12}\.md$/.test(p),
  );
  if (
    changesets.length > 1 ||
    changedFiles.some((p) => !allowed.has(p) && !changesets.includes(p))
  )
    fail("unexpected intake source scope");
  const release = {};
  for (const path of policy.manifests) {
    const a = JSON.parse(before[path]),
      b = JSON.parse(files[path]);
    const strip = (m) => {
      const result = structuredClone(m);
      for (const type of sections)
        for (const name of policy.dependencies)
          if (Object.hasOwn(result[type] ?? {}, name))
            result[type][name] = "<selected>";
      return result;
    };
    if (!equal(strip(a), strip(b)))
      fail("unrelated manifest or public contract changed");
    for (const type of sections)
      for (const name of policy.dependencies) {
        const x = old.manifests[path][type]?.[name],
          y = facts.manifests[path][type]?.[name];
        if (!x && !y) continue;
        if (!x || !y) fail("selected edge added or removed");
        if (
          y.version &&
          (semver.lt(y.version, x.version) ||
            ![null, "patch"].includes(semver.diff(x.version, y.version)))
        )
          fail("only compatible forward patches are supported");
        if (x.declared !== y.declared) {
          if (
            type === "peerDependencies" ||
            x.declared.startsWith("catalog:") !==
              y.declared.startsWith("catalog:") ||
            !semver.subset(y.range, x.range)
          )
            fail("unsupported public range or routing change");
          if (!b.private && b.name && type !== "devDependencies")
            release[b.name] = "patch";
        }
      }
  }
  for (const file of changesets) {
    const match = /^---\n([\s\S]*?)^---(?:\n|$)/m.exec(files[file] ?? "");
    if (
      !match ||
      match.index !== 0 ||
      !equal(match[1].trim() ? YAML.parse(match[1]) : {}, release)
    )
      fail("unexpected release intent");
  }
  if (Object.keys(release).length && !changesets.length)
    fail("runtime patch requires its Changeset");
  verifyCatalogTransition(policy, before, files, old, facts);
  for (const path of policy.chapters) {
    const a = slot(baseDocuments?.[path], policy),
      b = slot(documents[path], policy);
    if (a.managed !== intakeSlot(policy, old) || a.outside !== b.outside)
      fail("manual canonical prose or stale baseline");
  }
  return facts;
}
