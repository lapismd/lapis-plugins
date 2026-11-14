import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  functionKeys,
  validateInventory,
} from "./bases-compatibility-core.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (name) =>
  JSON.parse(
    readFileSync(path.join(root, "docs/bases-compatibility", name), "utf8")
  );
const args = process.argv.slice(2);
if (
  args.length > 1 ||
  (args.length && !["--write", "--upstream", "--refresh-provenance"].includes(args[0]))
) {
  throw new Error(
    "Usage: node scripts/bases-compatibility.mjs [--write|--upstream|--refresh-provenance]"
  );
}
const upstream = read("upstream.json");
validateInventory(read("inventory.json"), upstream);

if (args[0] === "--upstream") {
  const changes = [];
  for (const doc of upstream.documents) {
    const url = `https://raw.githubusercontent.com/${upstream.repository}/${
      upstream.branch
    }/${doc.path.split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok)
      throw new Error(`Upstream fetch failed: ${response.status} ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const blob = createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex");
    if (blob !== doc.blob)
      changes.push({
        path: doc.path,
        reviewedBlob: doc.blob,
        currentBlob: blob,
      });
    if (doc.path.endsWith("/Functions.md")) {
      const current = functionKeys(bytes.toString("utf8"));
      const added = current.filter((key) => !upstream.functions.includes(key));
      const removed = upstream.functions.filter(
        (key) => !current.includes(key)
      );
      if (added.length || removed.length)
        changes.push({ addedFunctions: added, removedFunctions: removed });
    }
  }
  console.log(
    JSON.stringify({ reviewedAt: upstream.reviewedAt, changes }, null, 2)
  );
  process.exitCode = changes.length ? 1 : 0;
} else {
  const run = spawnSync(
    "pnpm",
    [
      "--dir",
      "packages/bases",
      "exec",
      "vitest",
      "run",
      "--config",
      "test/compatibility/vite.config.ts",
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        BASES_COMPATIBILITY_WRITE: args[0] === "--write" ? "1" : "0",
        BASES_COMPATIBILITY_REFRESH_PROVENANCE:
          args[0] === "--refresh-provenance" ? "1" : "0",
      },
      stdio: "inherit",
    }
  );
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
  console.log(
    "Actual observations: .release/bases-compatibility/report.md and report.json"
  );
  if (run.status === 0)
    console.log(
      "Bases compatibility results: docs/bases-compatibility/report.md (known gaps remain tracked)."
    );
}
