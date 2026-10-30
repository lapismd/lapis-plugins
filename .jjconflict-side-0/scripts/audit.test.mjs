import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  chmod,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./audit.mjs", import.meta.url));

for (const candidate of [false, true]) {
  test(`audit forwards the ${candidate ? "installed candidate" : "registry"} graph and failure status`, async () => {
    const root = await mkdtemp(join(tmpdir(), "lapis-audit-test-"));
    try {
      const bin = join(root, "bin");
      await mkdir(bin);
      const executable = join(bin, "pnpm");
      const receipt = join(root, "receipt.json");
      await writeFile(
        executable,
        `#!/usr/bin/env node
const fs = require("node:fs");
fs.writeFileSync(process.env.AUDIT_TEST_RECEIPT, JSON.stringify({
  cwd: process.cwd(),
  lock: fs.readFileSync("pnpm-lock.yaml", "utf8"),
  manifest: JSON.parse(fs.readFileSync("package.json", "utf8")),
  args: process.argv.slice(2)
}));
process.exit(7);
`,
      );
      await chmod(executable, 0o755);
      const graph = candidate ? join(root, ".local/validation/audit") : root;
      await mkdir(graph, { recursive: true });
      await writeFile(join(root, "pnpm-lock.yaml"), "registry graph");
      await writeFile(join(root, "package.json"), '{"name":"registry"}');
      if (candidate) {
        await writeFile(join(graph, "pnpm-lock.yaml"), "candidate graph");
        await writeFile(join(graph, "package.json"), '{"name":"candidate"}');
      }
      const result = spawnSync(process.execPath, [script, "--json"], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          LAPIS_PLUGINS_VALIDATION_WORKER: candidate ? "1" : "0",
          AUDIT_TEST_RECEIPT: receipt,
        },
      });
      assert.equal(result.status, 7, result.stderr);
      const actual = JSON.parse(await readFile(receipt, "utf8"));
      assert.deepEqual(actual.args, ["audit", "--json"]);
      assert.equal(
        actual.lock,
        candidate ? "candidate graph" : "registry graph",
      );
      assert.equal(actual.manifest.name, candidate ? "candidate" : "registry");
      if (candidate) {
        assert.ok(!resolve(actual.cwd).startsWith(resolve(root) + "/"));
        await assert.rejects(readFile(join(actual.cwd, "pnpm-lock.yaml")), {
          code: "ENOENT",
        });
      }
      assert.equal(
        await readFile(join(root, "pnpm-lock.yaml"), "utf8"),
        "registry graph",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
