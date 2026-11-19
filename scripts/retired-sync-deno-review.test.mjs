import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { auditRetiredSyncDenoReview } from "./check-retired-sync-deno-review.mjs";
import { validate } from "./spec-validation/retired-sync-deno-review.mjs";

test("retired live-Deno Sync review has no driver or current authority", () => {
  assert.deepEqual(auditRetiredSyncDenoReview(), []);
});

test("audit rejects live-Deno review restoration but keeps engine portability", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "lapis-sync-deno-review-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ["dev/sync", "spec/src/plugins/sync"])
    await mkdir(path.join(root, directory), { recursive: true });
  for (const file of [
    "dev/sync/main.ts",
    "dev/sync/Review.svelte",
    "dev/sync/playwright.config.ts",
    "dev/sync/vite.config.mjs",
    "spec/src/distribution.md",
    "spec/src/spec-governance.md",
    "spec/src/plugins/sync/index.md",
    "spec/src/verification.md",
  ])
    await writeFile(
      path.join(root, file),
      file.endsWith("index.md")
        ? "The engine remains portable in Node and Deno.\n"
        : "retained\n",
    );
  assert.deepEqual(auditRetiredSyncDenoReview(root), []);
  await writeFile(
    path.join(root, "dev/sync/native-sign-in.spec.ts"),
    'spawn("deno", ["run", "driver.ts"]);\n',
  );
  const findings = auditRetiredSyncDenoReview(root);
  assert.ok(
    findings.some((finding) =>
      finding.includes("retired live-Deno Sync review entrypoint"),
    ),
  );
  const diagnostics = validate({ model: { repoRoot: root } });
  assert.equal(diagnostics[0].code, "RETIRED-SYNC-DENO-REVIEW");
  assert.equal(diagnostics[0].rule, "LP-SPEC-063");
  assert.match(diagnostics[0].message, /do not restore the retired live-Deno/);
});
