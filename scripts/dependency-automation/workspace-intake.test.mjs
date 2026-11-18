import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import { intakeFacts, intakeSlot, verifyIntake } from "./workspace-intake.mjs";

const policyBytes = JSON.stringify({
  schemaVersion: 2,
  kind: "workspace-dependency-intake",
  repository: "lapismd/lapis-plugins",
  slot: "framework-registry",
  dependencies: [
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
  ],
  manifests: [
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
  ],
  chapters: [
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
  ],
  lockClosure: "registry-transitives",
});
const sdk = "@lapismd/spec-validator";
const integrity = (letter) => `sha512-${letter.repeat(86)}==`;
function input(version = "0.2.0") {
  const policy = JSON.parse(policyBytes);
  const manifests = Object.fromEntries(
    policy.manifests.map((path) => [
      path,
      JSON.parse(
        readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"),
      ),
    ]),
  );
  manifests["package.json"].devDependencies[sdk] = `^${version}`;
  const source = Object.fromEntries(
    ["pnpm-workspace.yaml", "pnpm-lock.yaml", ...policy.manifests].map(
      (path) => [
        path,
        readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"),
      ],
    ),
  );
  const actual = intakeFacts(policy, source);
  const importerEntries = {},
    packages = {},
    snapshots = {};
  for (const [path, manifest] of Object.entries(manifests)) {
    const importer = path === "package.json" ? "." : path.slice(0, -13),
      entry = {};
    for (const type of [
      "dependencies",
      "optionalDependencies",
      "devDependencies",
    ])
      for (const name of policy.dependencies) {
        if (!manifest[type]?.[name]) continue;
        const v =
          name === sdk ? version : actual.manifests[path][type][name].version;
        (entry[type] ??= {})[name] = {
          specifier: manifest[type][name],
          version: v,
        };
        packages[`${name}@${v}`] = {
          resolution: {
            integrity: integrity(name === sdk && v === "0.2.1" ? "D" : "A"),
          },
        };
        snapshots[`${name}@${v}`] = {};
      }
    importerEntries[importer] = entry;
  }
  return {
    ...Object.fromEntries(
      Object.entries(manifests).map(([path, manifest]) => [
        path,
        JSON.stringify(manifest),
      ]),
    ),
    "pnpm-workspace.yaml": source["pnpm-workspace.yaml"],
    "pnpm-lock.yaml": YAML.stringify({
      lockfileVersion: "9.0",
      settings: { autoInstallPeers: false },
      importers: importerEntries,
      packages,
      snapshots,
    }),
  };
}
function data() {
  const before = input(),
    files = input("0.2.1"),
    policy = JSON.parse(policyBytes);
  return {
    policyBytes,
    basePolicyBytes: policyBytes,
    before,
    files,
    changedFiles: ["package.json", "pnpm-lock.yaml", ...policy.chapters],
    documents: Object.fromEntries(
      policy.chapters.map((p) => [
        p,
        "# Contract\n\n" +
          intakeSlot(policy, intakeFacts(policy, files)) +
          "\n",
      ]),
    ),
    baseDocuments: Object.fromEntries(
      policy.chapters.map((p) => [
        p,
        "# Contract\n\n" +
          intakeSlot(policy, intakeFacts(policy, before)) +
          "\n",
      ]),
    ),
  };
}
test("accepts a compatible SDK patch with independently derived source facts", () =>
  assert.equal(
    verifyIntake(data()).manifests["package.json"].devDependencies[sdk].version,
    "0.2.1",
  ));
test("accepts provenance-only Bases report refresh with selected intake", () => {
  const d = data();
  d.changedFiles.push("docs/bases-compatibility/report.json");
  assert.equal(
    verifyIntake(d).manifests["package.json"].devDependencies[sdk].version,
    "0.2.1",
  );
});
test("accepts selected package peer metadata and non-selected peer-context refresh", () => {
  const d = data();
  const lock = YAML.parse(d.files["pnpm-lock.yaml"]);
  const selected = Object.keys(lock.packages).find((key) =>
    key.startsWith(`${sdk}@`),
  );
  assert.ok(selected, "selected SDK package entry");
  lock.packages[selected] = {
    ...lock.packages[selected],
    peerDependencies: {
      ...(lock.packages[selected].peerDependencies ?? {}),
      "@lapis-notes/ui": "^0.2.4",
    },
  };
  const apiSnap = Object.keys(lock.snapshots ?? {}).find((key) =>
    key.startsWith("@lapis-notes/api@"),
  );
  if (apiSnap && lock.snapshots[apiSnap]?.dependencies?.["@lapismd/ai-host"]) {
    lock.snapshots[apiSnap].dependencies["@lapismd/ai-host"] =
      "0.3.0(bare-buffer@3.7.3)(zod@4.6.7)";
  }
  d.files["pnpm-lock.yaml"] = YAML.stringify(lock);
  assert.equal(
    verifyIntake(d).manifests["package.json"].devDependencies[sdk].version,
    "0.2.1",
  );
});
for (const [name, mutate] of [
  [
    "unsupported 0.x minor",
    (d) => {
      const p = JSON.parse(d.files["package.json"]);
      p.devDependencies[sdk] = "^0.3.0";
      d.files["package.json"] = JSON.stringify(p);
    },
  ],
  [
    "unrelated public export",
    (d) => {
      const p = JSON.parse(d.files["package.json"]);
      p.exports = { ".": "./other.js" };
      d.files["package.json"] = JSON.stringify(p);
    },
  ],
  ["unrelated source file", (d) => d.changedFiles.push("src/unrelated.ts")],
  ["changed source policy", (d) => (d.basePolicyBytes = policyBytes + "\n")],
  [
    "manual canonical prose",
    (d) => {
      d.documents[JSON.parse(policyBytes).chapters[0]] += "Changed contract.\n";
    },
  ],
  [
    "unrelated direct importer",
    (d) => {
      const l = YAML.parse(d.files["pnpm-lock.yaml"]);
      l.importers["."].devDependencies.other = {
        specifier: "1.0.0",
        version: "1.0.0",
      };
      d.files["pnpm-lock.yaml"] = YAML.stringify(l);
    },
  ],
  [
    "unrelated first-party metadata",
    (d) => {
      const l = YAML.parse(d.files["pnpm-lock.yaml"]);
      l.packages["@lapismd/mira@0.2.0"].engines = { node: ">=99" };
      d.files["pnpm-lock.yaml"] = YAML.stringify(l);
    },
  ],
  [
    "unapproved release intent",
    (d) => {
      d.changedFiles.push(".changeset/lapis-dependencies-123456789abc.md");
      d.files[".changeset/lapis-dependencies-123456789abc.md"] =
        '---\n"@lapismd/design-core": patch\n---\nUnexpected development-only release.\n';
    },
  ],
])
  test(`rejects ${name}`, () => {
    const d = data();
    mutate(d);
    assert.throws(() => verifyIntake(d));
  });
test("same-version integrity mutation is rejected", () => {
  const d = data();
  d.files = input();
  const l = YAML.parse(d.files["pnpm-lock.yaml"]);
  l.packages[`${sdk}@0.2.0`].resolution.integrity = integrity("Z");
  d.files["pnpm-lock.yaml"] = YAML.stringify(l);
  const p = JSON.parse(policyBytes);
  d.documents = Object.fromEntries(
    p.chapters.map((x) => [
      x,
      "# Contract\n\n" + intakeSlot(p, intakeFacts(p, d.files)) + "\n",
    ]),
  );
  assert.throws(() => verifyIntake(d), /integrity/);
});
test("source bootstrap checks actual installed catalog without inventing an update", () => {
  const files = Object.fromEntries(
    [
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
      ...JSON.parse(policyBytes).manifests,
    ].map((p) => [
      p,
      readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"),
    ]),
  );
  const p = JSON.parse(policyBytes);
  assert.equal(
    intakeFacts(p, files).manifests["package.json"].devDependencies[sdk]
      .version,
    "0.2.1",
  );
});

test("same-version first-party metadata mutation is rejected even without an update", () => {
  const d = data();
  d.files = input();
  const lock = YAML.parse(d.files["pnpm-lock.yaml"]);
  lock.packages["@lapismd/mira@0.2.0"].engines = { node: ">=99" };
  d.files["pnpm-lock.yaml"] = YAML.stringify(lock);
  d.documents = d.baseDocuments;
  assert.throws(() => verifyIntake(d), /metadata/);
});

test("actual empty managed Changeset shape retains no publication intent", () => {
  const d = data(),
    note = ".changeset/lapis-dependencies-123456789abc.md";
  d.changedFiles.push(note);
  d.files[note] =
    "---\n---\n\nRefresh first-party Lapis dependencies to the published versions recorded in this pull request.\n";
  assert.doesNotThrow(() => verifyIntake(d));
});
test("null metadata is not an empty managed release map", () => {
  const d = data(),
    note = ".changeset/lapis-dependencies-123456789abc.md";
  d.changedFiles.push(note);
  d.files[note] = "---\nnull\n---\nUnexpected metadata.\n";
  assert.throws(() => verifyIntake(d), /release intent/);
});
