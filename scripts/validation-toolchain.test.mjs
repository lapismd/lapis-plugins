import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { validationToolVersions } from "./validation/model.mjs";

const portable = ["node", "pnpm", "jj", "git", "mdbook"];

async function tools(context, names = portable) {
  const directory = await mkdtemp(join(tmpdir(), "plugins-toolchain-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  for (const name of names)
    await writeFile(
      join(directory, name),
      `#!/bin/sh\n[ "$#" = 1 ] && [ "$1" = --version ] || exit 17\nprintf '%s\\n' '${name} fixture-1'\n`,
      { mode: 0o755 }
    );
  return directory;
}

test("portable tool reporting executes required probes without a Deno executable", async (context) => {
  const directory = await tools(context);
  const versions = validationToolVersions("ui", { PATH: directory });
  assert.deepEqual(
    versions,
    Object.fromEntries(portable.map((name) => [name, `${name} fixture-1`]))
  );
});

test("missing mandatory tools remain fatal without a Deno fallback", async (context) => {
  const directory = await tools(
    context,
    portable.filter((t) => t !== "mdbook")
  );
  assert.throws(
    () => validationToolVersions("ui", { PATH: directory }),
    (error) => error.code === "ENOENT" && error.path === "mdbook"
  );
});

test("a failed required version probe remains fatal", async (context) => {
  const directory = await tools(context);
  await writeFile(join(directory, "git"), "#!/bin/sh\nexit 23\n", {
    mode: 0o755
  });
  assert.throws(
    () => validationToolVersions("ui", { PATH: directory }),
    (error) => error.status === 23
  );
});

test("full image tool reporting retains mandatory Rust probes", async (context) => {
  const directory = await tools(context, [...portable, "rustc", "cargo"]);
  const versions = validationToolVersions("full", { PATH: directory });
  assert.equal(versions.rustc, "rustc fixture-1");
  assert.equal(versions.cargo, "cargo fixture-1");
  await rm(join(directory, "cargo"));
  assert.throws(
    () => validationToolVersions("full", { PATH: directory }),
    (error) => error.code === "ENOENT" && error.path === "cargo"
  );
});

test("actual image admission rejects Deno presence and accepts a Deno-free PATH", async (context) => {
  const directory = await tools(context, []);
  const recipe = await readFile(
    new URL("./validation/Dockerfile", import.meta.url),
    "utf8"
  );
  const admission = recipe
    .split("\n")
    .find((line) => line.startsWith("RUN if command -v deno "));
  assert.ok(admission, "portable image must admit the actual tool environment");
  assert.doesNotMatch(recipe, /(?:FROM denoland\/deno|COPY --from=deno)/);
  const execute = () =>
    spawnSync("/bin/sh", ["-c", admission.slice(4)], {
      env: { PATH: directory },
      encoding: "utf8"
    });
  assert.equal(execute().status, 0);
  await writeFile(join(directory, "deno"), "#!/bin/sh\nexit 91\n", {
    mode: 0o755
  });
  const rejected = execute();
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /Unexpected Deno runtime/);
});
