import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const retiredReference =
  /@lapis-notes\/ai(?:["'\s/@]|$)|@lapismd\/ai-controller(?:["'\s/@]|$)|packages\/ai(?:[:"'\s/]|$)|stories\/plugins\/ai(?:["'\s/]|$)|plugins-ai--|plugins-ai-|from\s+["\'](?:\.\.?\/)+ai\//;

export function auditRetiredAi(directory = root) {
  const errors = [];
  for (const retired of [
    "packages/ai",
    "stories/plugins/ai",
    ".storybook/controller-connection-bridge.ts",
  ]) {
    try {
      statSync(path.join(directory, retired));
      errors.push(`${retired}: retired shared AI source must be absent`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  function inspect(relative) {
    const absolute = path.join(directory, relative);
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      if (
        [
          "node_modules",
          "dist",
          "build",
          ".turbo",
          "vendor",
          "test-results",
        ].includes(entry.name)
      )
        continue;
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (
        /\.(?:[cm]?[jt]sx?|svelte|json|mdx|css|html)$/.test(entry.name)
      ) {
        const lines = readFileSync(path.join(directory, file), "utf8").split(
          "\n",
        );
        lines.forEach((line, index) => {
          if (retiredReference.test(line))
            errors.push(`${file}:${index + 1}: retired shared AI reference`);
        });
      }
    }
  }
  for (const relative of ["packages", "stories", ".storybook"])
    inspect(relative);
  for (const file of ["package.json", "pnpm-lock.yaml"]) {
    if (retiredReference.test(readFileSync(path.join(directory, file), "utf8")))
      errors.push(`${file}: retired shared AI dependency`);
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = await auditRetiredAi();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Retired shared AI source and catalog boundaries pass.");
}
