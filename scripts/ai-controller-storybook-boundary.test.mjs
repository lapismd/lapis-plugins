import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("Storybook AI controller boundary", () => {
  it("registers the controller connection bridge and never starts a sidecar", () => {
    const preview = readFileSync(
      resolve(repoRoot, ".storybook/preview.ts"),
      "utf8",
    );
    const main = readFileSync(resolve(repoRoot, ".storybook/main.ts"), "utf8");
    assert.match(preview, /createControllerConnectionBridge/);
    assert.match(preview, /Storybook never starts the host/);
    assert.doesNotMatch(preview, /storybook:agent/);
    assert.doesNotMatch(preview, /lapis-ai-host/);
    assert.match(main, /LAPIS_AGENT_RUNTIME_URL/);
    assert.match(main, /LAPIS_AGENT_RUNTIME_TOKEN/);
  });
});
