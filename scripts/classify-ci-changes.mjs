import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const objectId = "(?:[a-f0-9]{40}|[a-f0-9]{64})";
const revision = new RegExp(`^${objectId}$`);
const rawHeader = new RegExp(
  `^:(000000|100644) (000000|100644) ${objectId} ${objectId} [AMD]$`
);

export function isSpecOnlyDiff(diff) {
  // NUL delimiters and disabled rename detection retain both sides of moves.
  if (!diff || !diff.endsWith("\0")) return false;
  const fields = diff.slice(0, -1).split("\0");
  if (fields.length % 2 !== 0) return false;
  for (let index = 0; index < fields.length; index += 2) {
    const path = fields[index + 1];
    if (!rawHeader.test(fields[index])) return false;
    if (!/^spec\/(?:src|records)\/.+\.md$/.test(path)) return false;
    if (/[\\\x00-\x1f\x7f]/.test(path)) return false;
    if (
      path.split("/").some((part) => !part || part === "." || part === "..")
    ) {
      return false;
    }
  }
  return true;
}

export function classifyCiChanges({
  eventName,
  baseSha,
  headSha,
  runGit = (args) => execFileSync("git", args, { encoding: "utf8" }),
}) {
  // Pushes, manual runs and release callers always retain full validation.
  if (eventName !== "pull_request") return false;
  if (!revision.test(baseSha ?? "") || !revision.test(headSha ?? ""))
    return false;
  try {
    const base = runGit(["merge-base", "--all", baseSha, headSha]).trim();
    if (!revision.test(base)) return false;
    return isSpecOnlyDiff(
      runGit([
        "diff",
        "--no-ext-diff",
        "--raw",
        "--no-abbrev",
        "--no-renames",
        "-z",
        `${base}..${headSha}`,
        "--",
      ])
    );
  } catch {
    // Missing history, ambiguous comparisons and Git errors cannot grant a skip.
    return false;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const specOnly = classifyCiChanges({
    eventName: process.env.GITHUB_EVENT_NAME,
    baseSha: process.env.PR_BASE_SHA,
    headSha: process.env.PR_HEAD_SHA,
  });
  const output = `spec_only=${specOnly}\n`;
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  console.log(output.trim());
}
