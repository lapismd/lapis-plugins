#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pluginPackages } from "./package-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "--check";
assert.ok(
  mode === "--check" || mode === "--write",
  "Usage: sync-package-docs.mjs --check|--write",
);
const license = await readFile(path.join(root, "LICENSE.md"), "utf8");
const findings = [];

for (const plugin of pluginPackages) {
  const packageRoot = path.join(root, "packages", plugin.directory);
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "manifest.json"), "utf8"),
  );
  const readme = `# ${manifest.name}\n\n${manifest.description}\n\n## Install for static composition\n\n\`\`\`sh\npnpm add ${plugin.packageName}\n\`\`\`\n\nRegister the exported plugin class in the application's \`PluginProfile\`. Import\n\`${plugin.packageName}/styles.css?inline\` and pass the CSS through the static\nregistration so the host owns its lifecycle.\n\nThe runtime plugin ID is \`${plugin.pluginId}\`. A matching signed\n\`${plugin.pluginId}-${manifest.version}.lapis-plugin\` archive is attached to the\npackage-scoped GitHub release for manual or registry installation.\n\nSee the [repository README](https://github.com/lapismd/lapis-plugins#readme) for\ndevelopment, validation, and release-gate details.\n`;
  const changelog = `# ${manifest.name} changelog\n\n## ${manifest.version}\n\n- Initial independent public package extracted from Lapis Notes without changing\n  the runtime plugin ID.\n`;
  await compareOrWrite(path.join(packageRoot, "README.md"), readme);
  await compareOrWrite(path.join(packageRoot, "CHANGELOG.md"), changelog);
  await compareOrWrite(path.join(packageRoot, "LICENSE.md"), license);
}

if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    mode === "--write"
      ? `Synchronized documentation for ${pluginPackages.length} packages.`
      : `Verified documentation for ${pluginPackages.length} packages.`,
  );
}

async function compareOrWrite(filePath, expected) {
  let actual = "";
  try {
    actual = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (mode === "--write") {
    if (actual !== expected) await writeFile(filePath, expected);
  } else if (actual !== expected) {
    findings.push(
      `${path.relative(root, filePath)} is not synchronized; run pnpm packages:sync`,
    );
  }
}
