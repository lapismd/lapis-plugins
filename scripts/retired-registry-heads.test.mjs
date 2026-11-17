import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertRegistryHeadsActive } from "./lib/retired-registry-heads.mjs";

test("retired heads reject mixed renewal batches while retained heads remain eligible", () => {
  assert.doesNotThrow(() =>
    assertRegistryHeadsActive([{ pluginId: "lapis-graph" }]),
  );
  assert.throws(
    () =>
      assertRegistryHeadsActive([
        { pluginId: "lapis-graph" },
        { pluginId: "ai" },
      ]),
    /retired/i,
  );
});

test("renewal fences retirement before authorization and template creation", async () => {
  const source = await readFile(
    new URL("./renew-registry-heads.mjs", import.meta.url),
    "utf8",
  );
  const guard = source.indexOf("assertRegistryHeadsActive(expiring)");
  assert.ok(guard >= 0);
  assert.ok(guard < source.indexOf("const oidcToken = await requestOidcToken"));
  const template = source.split("export function createRenewedHeadTemplate")[1];
  assert.ok(template.indexOf("assertRegistryHeadsActive") >= 0);
  assert.ok(
    template.indexOf("assertRegistryHeadsActive") <
      template.indexOf("createNip29RegistryHeadTemplate"),
  );
});
