import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import YAML from "yaml";
import { verifyIntake } from "./workspace-intake.mjs";

const fixture = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL(
        "../fixtures/reviewed-notes-design-cohort-transition.json.gz",
        import.meta.url,
      ),
    ),
  ),
);
const fresh = () => structuredClone(fixture);

test("real Notes and Design cohort transition admits exact immutable source only", () => {
  const data = fresh();
  const saved = structuredClone(data);
  const facts = verifyIntake(data);
  assert.equal(
    facts.manifests["package.json"].devDependencies["@lapis-notes/api"].version,
    "0.6.12",
  );
  assert.equal(
    facts.manifests["package.json"].devDependencies["@lapis-notes/ui"].version,
    "0.2.8",
  );
  assert.equal(
    facts.manifests["package.json"].devDependencies["@lapis-notes/workspace"]
      .version,
    "0.4.10",
  );
  assert.equal(
    facts.manifests["package.json"].devDependencies["@lapismd/design-core"]
      .version,
    "0.13.7",
  );
  assert.deepEqual(data, saved);
});

test("ordinary canonical patch cannot change the reviewed cohort metadata", () => {
  const data = fresh();
  data.changedFiles = data.changedFiles.filter(
    (path) =>
      path !==
      "scripts/dependency-automation/reviewed-notes-design-cohort-transition.mjs",
  );
  assert.throws(() => verifyIntake(data));
});

for (const [name, mutate] of [
  ["wrong parent", (data) => (data.sourceSha = "f".repeat(40))],
  ["wrong base policy", (data) => (data.basePolicyBytes += " ")],
  ["wrong package", (data) => (data.files["package.json"] += "\n")],
  ["wrong lock", (data) => (data.files["pnpm-lock.yaml"] += "\n")],
  [
    "missing reviewed implementation",
    (data) =>
      (data.changedFiles = data.changedFiles.filter(
        (path) =>
          path !== "scripts/dependency-automation/workspace-catalog.mjs",
      )),
  ],
  ["extra path", (data) => data.changedFiles.push("src/unreviewed.ts")],
  [
    "extra selected metadata",
    (data) => {
      const lock = YAML.parse(data.files["pnpm-lock.yaml"]);
      lock.packages["@lapis-notes/api@0.6.12"].deprecated = "unreviewed";
      data.files["pnpm-lock.yaml"] = YAML.stringify(lock);
    },
  ],
  [
    "unrelated immutable metadata",
    (data) => {
      const lock = YAML.parse(data.files["pnpm-lock.yaml"]);
      const key = Object.keys(lock.packages).find((entry) =>
        entry.startsWith("@lapis-notes/history@"),
      );
      assert.ok(key);
      lock.packages[key].deprecated = "unreviewed";
      data.files["pnpm-lock.yaml"] = YAML.stringify(lock);
    },
  ],
  [
    "workspace setting",
    (data) =>
      (data.files["pnpm-workspace.yaml"] +=
        "\nonlyBuiltDependencies: [unreviewed]\n"),
  ],
  [
    "unreviewed canonical prose",
    (data) => (data.documents[Object.keys(data.documents)[0]] += "unreviewed"),
  ],
  [
    "stale canonical baseline",
    (data) =>
      (data.baseDocuments[Object.keys(data.baseDocuments)[0]] += "unreviewed"),
  ],
])
  test(`Notes and Design cohort transition rejects ${name}`, () => {
    const data = fresh();
    mutate(data);
    assert.throws(() => verifyIntake(data));
  });

const localizationFixture = JSON.parse(
  gunzipSync(
    readFileSync(
      new URL(
        "../fixtures/reviewed-localization-peer-transition.json.gz",
        import.meta.url,
      ),
    ),
  ),
);
test("published localization peer intake admits its exact reviewed source", () => {
  const data = structuredClone(localizationFixture);
  const saved = structuredClone(data);
  const facts = verifyIntake(data);
  assert.equal(
    facts.manifests["package.json"].devDependencies["@lapis-notes/api"].version,
    "0.6.14",
  );
  assert.deepEqual(data, saved);
});
for (const [name, mutate] of [
  [
    "historical receipt replay",
    (data) => (data.sourceSha = "32b1680b478e8094716c94cdc89a4854660bf4d8"),
  ],
  [
    "changed localization peer",
    (data) => {
      const lock = YAML.parse(data.files["pnpm-lock.yaml"]);
      lock.packages["@lapis-notes/api@0.6.14"].peerDependencies.i18next = "*";
      data.files["pnpm-lock.yaml"] = YAML.stringify(lock);
    },
  ],
  ["another base", (data) => (data.sourceSha = "e".repeat(40))],
  ["changed policy", (data) => (data.policyBytes += " ")],
  ["changed manifest", (data) => (data.files["package.json"] += " ")],
  ["changed lock", (data) => (data.files["pnpm-lock.yaml"] += " ")],
  ["changed workspace", (data) => (data.files["pnpm-workspace.yaml"] += " ")],
  ["extra scope", (data) => data.changedFiles.push("src/unreviewed.ts")],
  [
    "ordinary intake",
    (data) =>
      (data.changedFiles = data.changedFiles.filter(
        (p) =>
          p !==
          "scripts/dependency-automation/reviewed-notes-design-cohort-transition.mjs",
      )),
  ],
  [
    "canonical prose",
    (data) => (data.documents[Object.keys(data.documents)[0]] += "unreviewed"),
  ],
  [
    "canonical baseline",
    (data) =>
      (data.baseDocuments[Object.keys(data.baseDocuments)[0]] += "unreviewed"),
  ],
])
  test(`localization peer transition rejects ${name}`, () => {
    const data = structuredClone(localizationFixture);
    mutate(data);
    assert.throws(() => verifyIntake(data));
  });
