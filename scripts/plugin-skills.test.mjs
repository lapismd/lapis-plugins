import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const yaml = createRequire(
  new URL("../packages/bases/package.json", import.meta.url),
)("js-yaml");
import { validateJsonCanvas } from "../packages/canvas/src/lib/validate-json-canvas.ts";
async function sourceFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      files.push(
        ...(await sourceFiles(
          new URL(entry.name + "/", directory),
          relative + "/",
        )),
      );
    else if (entry.isFile()) files.push(relative);
    else assert.fail(`Unexpected skill source asset ${relative}`);
  }
  return files.sort();
}
function prose(markdown) {
  let fence;
  return markdown
    .split("\n")
    .filter((line) => {
      const match = /^\s*(`{3,}|~{3,})/.exec(line);
      if (match) {
        if (!fence) fence = match[1];
        else if (match[1][0] === fence[0] && match[1].length >= fence.length)
          fence = undefined;
        return false;
      }
      return !fence;
    })
    .join("\n");
}
for (const plugin of ["bases", "canvas", "markdown"]) {
  test(`${plugin} packaged skill matches the manifest and its source files`, async () => {
    const root = new URL(`../packages/${plugin}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL("manifest.json", root)));
    const bundles = JSON.parse(await readFile(new URL("skills.json", root)));
    const pkg = JSON.parse(await readFile(new URL("package.json", root)));
    assert(pkg.files.includes("skills"));
    assert.equal(pkg.exports["./skills.json"], "./skills.json");
    for (const contribution of manifest.lapis.contributes.agentSkills) {
      const bundle = bundles.find((s) => s.name === contribution.name);
      assert(
        Object.keys(bundle.files).some((file) =>
          file.startsWith("references/"),
        ),
        `${contribution.name} must package its supporting references`,
      );
      assert.equal(bundle.source, manifest.id);
      assert.equal(bundle.version, manifest.version);
      const dir = new URL(contribution.directory + "/", root);
      assert.deepEqual(
        await sourceFiles(dir),
        Object.keys(bundle.files).sort(),
      );
      for (const [file, body] of Object.entries(bundle.files))
        assert.equal(await readFile(new URL(file, dir), "utf8"), body);
      const routed = new Set();
      for (const [file, body] of Object.entries(bundle.files)) {
        if (!file.endsWith(".md")) continue;
        for (const match of prose(body).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
          const href = match[1];
          if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(href)) continue;
          const target = path.posix.normalize(
            path.posix.join(
              path.posix.dirname(file),
              decodeURIComponent(href.split("#")[0]),
            ),
          );
          assert(
            !target.startsWith("../") && Object.hasOwn(bundle.files, target),
            `${file} has missing/escaping reference ${href}`,
          );
          if (file === "SKILL.md") routed.add(target);
        }
      }
      for (const file of Object.keys(bundle.files).filter((file) =>
        file.startsWith("references/"),
      ))
        assert(
          routed.has(file),
          `${contribution.name} does not route to ${file}`,
        );
      const markdown = bundle.files["SKILL.md"];
      const frontmatter = yaml.load(markdown.split("---")[1]);
      assert.equal(frontmatter.name, contribution.name);
      assert(frontmatter.description);
      for (const body of Object.entries(bundle.files)
        .filter(([file]) => file.endsWith(".md"))
        .map(([, body]) => body)) {
        for (const match of body.matchAll(/```(json|yaml)\n([\s\S]*?)```/g)) {
          if (match[1] === "json") validateJsonCanvas(JSON.parse(match[2]));
          else assert(yaml.load(match[2]));
        }
      }
    }
  });
}

for (const plugin of ["bases", "canvas", "markdown"]) {
  test(`${plugin} npm and signed archive contain every skill resource`, async () => {
    const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const path = await import("node:path");
    const { stagePackagedSkills } = await import("./plugin-skill-assets.mjs");
    const {
      packageOfficialPlugin,
      buildPluginPayload,
      signReleaseManifest,
      buildSignedPluginBundle,
      generateTestEd25519KeyPair,
    } = await import("./plugin-release.mjs");
    const { verifyPluginPayload, verifyPluginBundle } = await import(
      "./lib/verify-plugin-release.mjs"
    );
    const temp = await mkdtemp(path.join(tmpdir(), "lapis-skills-"));
    try {
      const input = path.join(temp, "input");
      await mkdir(input);
      const root = new URL(`../packages/${plugin}/`, import.meta.url);
      const manifest = JSON.parse(
        await readFile(new URL("manifest.json", root)),
      );
      // Inspect an actual npm tarball independently of the archive staging path.
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const run = promisify(execFile);
      const packed = await run(
        "npm",
        ["pack", "--ignore-scripts", "--json", "--pack-destination", temp],
        { cwd: root.pathname },
      );
      const [{ filename }] = JSON.parse(packed.stdout);
      const npmFile = (relative) =>
        run("tar", ["-xOf", path.join(temp, filename), `package/${relative}`]);
      const sourceSkills = JSON.parse(
        await readFile(new URL("skills.json", root)),
      );
      assert.deepEqual(
        JSON.parse((await npmFile("skills.json")).stdout),
        sourceSkills,
      );
      for (const skill of sourceSkills) {
        for (const [file, body] of Object.entries(skill.files))
          assert.equal(
            (await npmFile(`skills/${skill.name}/${file}`)).stdout,
            body,
          );
      }
      // Exercise archive packaging with real resources and a minimal executable entry.
      manifest.lapis.runtime.entries = {
        workspace: { path: "main.mjs", format: "esm" },
      };
      await writeFile(
        path.join(input, "manifest.json"),
        JSON.stringify(manifest),
      );
      await writeFile(
        path.join(input, "main.mjs"),
        "export default class Canvas {}\n",
      );
      await writeFile(path.join(input, "styles.css"), "");
      await stagePackagedSkills(new URL(".", root).pathname, input, manifest);
      const release = await packageOfficialPlugin({
        pluginId: manifest.id,
        version: manifest.version,
        inputDir: input,
        outDir: path.join(temp, "out"),
      });
      const bundle = await buildPluginPayload({
        pluginId: manifest.id,
        version: manifest.version,
        releaseDir: release.releaseDir,
      });
      verifyPluginPayload({
        bundleBytes: await readFile(bundle.bundlePath),
        releaseManifest: release.releaseManifest,
      });
      const keys = generateTestEd25519KeyPair();
      const privateKeyFile = path.join(temp, "test-key.pem");
      await writeFile(privateKeyFile, keys.privateKey, { mode: 0o600 });
      const signedReleasePath = path.join(temp, "release.signed.json");
      await signReleaseManifest({
        input: path.join(release.releaseDir, "release.json"),
        out: signedReleasePath,
        keyId: "test-only",
        privateKeyFile,
      });
      const signed = await buildSignedPluginBundle({
        pluginId: manifest.id,
        version: manifest.version,
        releaseDir: release.releaseDir,
        signedReleasePath,
      });
      verifyPluginBundle({
        bundleBytes: await readFile(signed.bundlePath),
        publicKey: keys.publicKey,
      });
      const skills = JSON.parse(await readFile(new URL("skills.json", root)));
      for (const [file, body] of Object.entries(skills[0].files)) {
        const relative = `skills/${skills[0].name}/${file}`;
        assert(release.releaseManifest.files.some((f) => f.path === relative));
        assert.equal(
          await readFile(
            path.join(release.releaseDir, "files", relative),
            "utf8",
          ),
          body,
        );
      }
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
}
