import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { frameworkPackageVersions } from "./package-catalog.mjs";

export function checkFrameworkPublication({
  lookup = (coordinate) =>
    spawnSync("npm", ["view", coordinate, "version", "--json"], {
      encoding: "utf8",
    }),
} = {}) {
  const root = JSON.parse(
    readFileSync(
      new URL("../packages/ai/package.json", import.meta.url),
      "utf8"
    )
  );
  const requirements = new Map(frameworkPackageVersions);
  requirements.set(
    "@lapismd/ai-controller",
    root.dependencies["@lapismd/ai-controller"]
  );
  for (const [name, range] of requirements) {
    if (!range)
      throw new Error(`Missing published framework range for ${name}`);
    const coordinate = `${name}@${range}`;
    const result = lookup(coordinate);
    if (result.status !== 0)
      throw new Error(
        `Published framework prerequisite unavailable: ${coordinate}\n${
          result.stderr ?? result.error?.message ?? "npm lookup failed"
        }`
      );
    const versions = JSON.parse(result.stdout);
    if (
      !(typeof versions === "string" && versions.length > 0) &&
      !(
        Array.isArray(versions) &&
        versions.length > 0 &&
        versions.every((v) => typeof v === "string" && v.length > 0)
      )
    ) {
      throw new Error(`npm returned no published versions for ${coordinate}`);
    }
  }
  return [...requirements].map(([name, range]) => `${name}@${range}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  for (const coordinate of checkFrameworkPublication())
    console.log(`Published prerequisite verified: ${coordinate}`);
}
