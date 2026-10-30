import { build } from "esbuild";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const result = await build({
  entryPoints: ["src/engine.ts"],
  outfile: "dist/engine.js",
  format: "esm",
  platform: "neutral",
  target: "es2022",
  bundle: true,
  legalComments: "eof",
  metafile: true,
});

const licenses = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes("node_modules/")) continue;
  let directory = dirname(resolve(input));
  while (directory !== dirname(directory)) {
    const metadata = join(directory, "package.json");
    if (existsSync(metadata)) {
      const pkg = JSON.parse(readFileSync(metadata, "utf8"));
      if (pkg.name) {
        const file = ["LICENSE", "LICENSE.md", "LICENSE.txt"].find((name) =>
          existsSync(join(directory, name)),
        );
        if (!file) throw new Error(`Missing bundled license: ${pkg.name}`);
        licenses.set(
          `${pkg.name}@${pkg.version}`,
          readFileSync(join(directory, file), "utf8").trim(),
        );
        break;
      }
    }
    directory = dirname(directory);
  }
}
writeFileSync(
  "dist/THIRD_PARTY_LICENSES.md",
  "# Bundled dependency licenses\n\n" +
    [...licenses]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, license]) => `## ${name}\n\n${license}\n`)
      .join("\n"),
);
