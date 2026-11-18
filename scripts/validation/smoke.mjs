import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chromium, webkit } from "@playwright/test";

assert.equal(process.platform, "linux");
const deno = spawnSync(
  "/bin/sh",
  ["-c", "if command -v deno >/dev/null 2>&1; then exit 0; else exit 1; fi"],
  {
    encoding: "utf8"
  }
);
assert.equal(deno.error, undefined);
assert.equal(deno.status, 1, "finished portable image must not expose Deno");
for (const tool of ["node", "pnpm", "jj", "mdbook"])
  console.log(execFileSync(tool, ["--version"], { encoding: "utf8" }).trim());
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<button>Container browser ready</button>");
    assert.equal(
      await page.getByRole("button").textContent(),
      "Container browser ready"
    );
  } finally {
    await browser.close();
  }
}
console.log("Container source, tools and Chromium/WebKit smoke passed.");
