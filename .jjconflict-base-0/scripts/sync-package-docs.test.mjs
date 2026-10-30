import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");

test("documentation sync preserves the Changesets-owned changelog", async (t) => {
  const workspace = await mkdtemp(path.join(tmpdir(), "lapis-plugin-docs-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));

  await mkdir(path.join(workspace, "scripts"), { recursive: true });
  await mkdir(path.join(workspace, "packages", "example"), {
    recursive: true,
  });
  await copyFile(
    path.join(root, "scripts", "sync-package-docs.mjs"),
    path.join(workspace, "scripts", "sync-package-docs.mjs")
  );
  await writeFile(
    path.join(workspace, "scripts", "package-catalog.mjs"),
    `export const pluginPackages = [{ directory: "example", packageName: "@lapis-notes/example", pluginId: "lapis-example" }];\n`
  );
  await writeFile(path.join(workspace, "LICENSE.md"), "Example license\n");
  await writeFile(
    path.join(workspace, "packages", "example", "manifest.json"),
    `${JSON.stringify({
      name: "Example",
      description: "Example plugin",
      version: "1.2.3",
    })}\n`
  );
  const changelog = "# Example changelog\n\n## 1.2.3\n\n- Preserved entry.\n";
  await writeFile(
    path.join(workspace, "packages", "example", "CHANGELOG.md"),
    changelog
  );

  await execFileAsync(
    process.execPath,
    ["scripts/sync-package-docs.mjs", "--write"],
    {
      cwd: workspace,
    }
  );

  assert.equal(
    await readFile(
      path.join(workspace, "packages", "example", "CHANGELOG.md"),
      "utf8"
    ),
    changelog
  );
});
