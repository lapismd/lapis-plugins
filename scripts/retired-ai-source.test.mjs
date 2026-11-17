import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { auditRetiredAi } from "./check-retired-ai.mjs";
import { validate } from "./spec-validation/retired-ai.mjs";
import { pluginPackageBySelector } from "./package-catalog.mjs";

test("retired shared AI has no source, catalog import or dependency", async () => {
  assert.deepEqual(await auditRetiredAi(), []);
  assert.equal(pluginPackageBySelector("ai"), undefined);
  assert.equal(pluginPackageBySelector("@lapis-notes/ai"), undefined);
});

test("source audit catches reintroduction while allowing independently owned AI", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-retired-ai-audit-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of ["packages", "stories", ".storybook"])
    await mkdir(path.join(root, dir));
  await writeFile(path.join(root, "package.json"), '{"private":true}\n');
  await writeFile(
    path.join(root, "pnpm-lock.yaml"),
    'lockfileVersion: "9.0"\n',
  );
  await writeFile(
    path.join(root, "stories/retained.ts"),
    'import { x } from "@lapismd/mira-plugin-ai";\n',
  );
  assert.deepEqual(await auditRetiredAi(root), []);
  for (const [file, source] of [
    ["retired.ts", 'import "@lapis-notes/ai/styles.css";\n'],
    ["retired.css", '@import "@lapis-notes/ai/styles.css";\n'],
    ["retired.mdx", 'import Demo from "../ai/AiChatDemo.svelte";\n'],
  ]) {
    await writeFile(path.join(root, "stories", file), source);
    assert.ok(
      (await auditRetiredAi(root)).some((error) =>
        error.includes(`stories/${file}:1`),
      ),
    );
    await rm(path.join(root, "stories", file));
  }
  await mkdir(path.join(root, "packages/ai"));
  const findings = validate({ model: { repoRoot: root } });
  assert.equal(findings[0].code, "RETIRED-SHARED-AI");
  assert.equal(findings[0].rule, "LP-SPEC-061");
  assert.match(findings[0].message, /Remove the retired source/);
  assert.ok(
    (await auditRetiredAi(root)).some((error) =>
      error.includes("source must be absent"),
    ),
  );
});

test("canonical validation receives synchronous structured findings", () => {
  const findings = validate({
    model: { repoRoot: new URL("../", import.meta.url).pathname },
  });
  assert.ok(Array.isArray(findings));
  assert.deepEqual(findings, []);
});
