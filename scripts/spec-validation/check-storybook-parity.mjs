import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { auditStoryParity } from "./storybook-parity.mjs";
export function trackedFileList(run = execFileSync) {
  return run("git", ["ls-files"], { encoding: "utf8" });
}
const entry =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (entry) {
  const files = trackedFileList().trim().split("\n").filter(Boolean);
  const readOptional = (file) => {
    try {
      return readFileSync(file, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  };
  const contracts = JSON.parse(
    readFileSync("stories/catalog/story-parity.json", "utf8")
  );
  const findings = auditStoryParity({ files, contracts, readOptional });
  for (const finding of findings)
    console.error(
      `${finding.file}:${finding.line} [${finding.code}] ${finding.rule}: ${finding.message}`
    );
  console.log(
    `Story composition: ${Object.keys(contracts).length} families, ${
      findings.length
    } findings.`
  );
  process.exitCode = findings.length ? 1 : 0;
}
