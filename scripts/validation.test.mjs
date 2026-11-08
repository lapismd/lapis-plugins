import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { archiveMember, ciToolDirectory } from "./validation/install-tools.mjs";
import * as toolInstaller from "./validation/install-tools.mjs";
import { createHash } from "node:crypto";

function toolArchiveFixture() {
  const bytes = Buffer.from("verified upstream archive");
  const pin = {
    owner: "jj-vcs/jj",
    version: "0.45.1",
    asset: "jj-v0.45.1-x86_64-unknown-linux-musl.tar.gz",
    digest: createHash("sha256").update(bytes).digest("hex")
  };
  const direct = `https://github.com/${pin.owner}/releases/download/v${pin.version}/${pin.asset}`;
  const metadata = {
    assets: [{ id: 42, name: pin.asset, browser_download_url: direct }]
  };
  return { bytes, pin, direct, metadata };
}

test("pinned tool download recovers a transient release URL through the official asset API", async () => {
  const { bytes, pin, direct, metadata } = toolArchiveFixture();
  const requests = [];
  const result = await toolInstaller.downloadToolArchive(
    pin,
    async (url, init) => {
      requests.push({ url, init });
      if (requests.length === 1)
        return new Response("Gateway timeout", { status: 504 });
      if (requests.length === 2) return Response.json(metadata);
      return new Response(bytes);
    }
  );
  assert.deepEqual(result, bytes);
  assert.deepEqual(
    requests.map((r) => r.url),
    [
      direct,
      "https://api.github.com/repos/jj-vcs/jj/releases/tags/v0.45.1",
      "https://api.github.com/repos/jj-vcs/jj/releases/assets/42"
    ]
  );
  assert.equal(requests[2].init.headers.Accept, "application/octet-stream");
  assert.ok(requests.every((r) => r.init.signal instanceof AbortSignal));
});

test("pinned tool download admits verified direct bytes without using the API", async () => {
  const { bytes, pin } = toolArchiveFixture();
  let calls = 0;
  assert.deepEqual(
    await toolInstaller.downloadToolArchive(pin, async () => {
      calls++;
      return new Response(bytes);
    }),
    bytes
  );
  assert.equal(calls, 1);
});

test("pinned tool download rejects corrupt direct bytes without falling back", async () => {
  const { pin } = toolArchiveFixture();
  let calls = 0;
  await assert.rejects(
    toolInstaller.downloadToolArchive(pin, async () => {
      calls++;
      return new Response("corrupt");
    }),
    /checksum mismatch/
  );
  assert.equal(calls, 1);
});

test("pinned tool download rejects corrupt fallback bytes with the same checksum gate", async () => {
  const { pin, metadata } = toolArchiveFixture();
  let calls = 0;
  await assert.rejects(
    toolInstaller.downloadToolArchive(pin, async () => {
      calls++;
      return calls === 1
        ? new Response(null, { status: 504 })
        : calls === 2
          ? Response.json(metadata)
          : new Response("corrupt");
    }),
    /checksum mismatch/
  );
  assert.equal(calls, 3);
});

test("pinned tool download rejects ambiguous or mismatched release assets", async () => {
  const { pin, metadata } = toolArchiveFixture();
  for (const assets of [
    [],
    [...metadata.assets, ...metadata.assets],
    [{ ...metadata.assets[0], id: -1 }],
    [
      {
        ...metadata.assets[0],
        browser_download_url: "https://example.com/tool.tar.gz"
      }
    ]
  ]) {
    let calls = 0;
    await assert.rejects(
      toolInstaller.downloadToolArchive(pin, async () => {
        calls++;
        return calls === 1
          ? new Response(null, { status: 504 })
          : Response.json({ assets });
      }),
      /identity mismatch/
    );
    assert.equal(calls, 2);
  }
});

test("pinned tool download stops on permanent responses and failed API requests", async () => {
  const { pin, metadata } = toolArchiveFixture();
  for (const [responses, expected] of [
    [[new Response(null, { status: 403 })], /Tool download failed: 403/],
    [
      [
        new Response(null, { status: 504 }),
        new Response(null, { status: 502 })
      ],
      /lookup failed: 502/
    ],
    [
      [
        new Response(null, { status: 504 }),
        Response.json(metadata),
        new Response(null, { status: 503 })
      ],
      /asset download failed: 503/
    ]
  ]) {
    const count = responses.length;
    let calls = 0;
    await assert.rejects(
      toolInstaller.downloadToolArchive(pin, async () => responses[calls++]),
      expected
    );
    assert.equal(calls, count);
  }
});

test("pinned tool download falls back for transport failures but preserves programming errors", async () => {
  const { pin, bytes, metadata } = toolArchiveFixture();
  for (const error of [
    new TypeError("fetch failed"),
    new DOMException("timeout", "TimeoutError")
  ]) {
    let calls = 0;
    assert.deepEqual(
      await toolInstaller.downloadToolArchive(pin, async () => {
        calls++;
        if (calls === 1) throw error;
        return calls === 2 ? Response.json(metadata) : new Response(bytes);
      }),
      bytes
    );
    assert.equal(calls, 3);
  }
  await assert.rejects(
    toolInstaller.downloadToolArchive(pin, async () => {
      throw new Error("programming error");
    }),
    /programming error/
  );
});

test("hosted CI installs Jujutsu only into runner-owned temporary paths", () => {
  assert.throws(() => ciToolDirectory({}), /runner-owned/);
  assert.equal(
    ciToolDirectory({ RUNNER_TEMP: "/tmp/runner", GITHUB_PATH: "/tmp/paths" }),
    "/tmp/runner/lapis-plugins-validation-tools"
  );
});

test("unknown lanes fail before contacting Docker", async () => {
  const { main } = await import("./validation.mjs");
  await assert.rejects(
    main(["run", "not-a-validation-lane"]),
    /Unknown validation lane/
  );
});

test("upstream tool archives accept plain and dot-prefixed root executables only", () => {
  assert.equal(archiveMember("./jj\n./LICENSE\n", "jj"), "./jj");
  assert.equal(archiveMember("mdbook\n", "mdbook"), "mdbook");
  assert.throws(() => archiveMember("../jj\n", "jj"), /root executable/);
  assert.throws(() => archiveMember("jj\n./jj\n", "jj"), /root executable/);
});
import {
  validationConfig,
  imageKey,
  validateArchives,
  validationNodeHeap
} from "./validation/model.mjs";

test("Node heap fits the remote memory budget and is capped at the qualified CI size", () => {
  assert.equal(validationNodeHeap(1), 512);
  assert.equal(validationNodeHeap(4), 2048);
  assert.equal(validationNodeHeap(12), 6144);
  assert.equal(validationNodeHeap(24), 6144);
});
test("Docker is default and native must be explicit", () => {
  assert.equal(validationConfig({}, {}).runtime, "docker");
  assert.equal(
    validationConfig({}, { LAPIS_PLUGINS_VALIDATION_RUNTIME: "native" })
      .runtime,
    "native"
  );
  assert.throws(() => validationConfig({ runtime: "magic" }, {}), /runtime/);
});

test("Turbo preserves explicit runtime selection and separates worker cache identity", async () => {
  const turbo = JSON.parse(
    await readFile(new URL("../turbo.json", import.meta.url))
  );
  assert.ok(turbo.globalEnv.includes("LAPIS_PLUGINS_VALIDATION_WORKER"));
  assert.ok(turbo.globalPassThroughEnv.includes("PLAYWRIGHT_BROWSERS_PATH"));
  assert.ok(
    turbo.globalPassThroughEnv.includes("LAPIS_PLUGINS_VALIDATION_RUNTIME")
  );
  assert.ok(
    turbo.tasks.check.dependsOn.includes("@lapis-notes/markdown#build")
  );
});

test("public validation lanes route through Docker while preserving native commands", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url))
  );
  const lanes = JSON.parse(
    await readFile(new URL("./validation/lanes.json", import.meta.url))
  );
  for (const name of Object.keys(pkg.scripts)) {
    if (
      (name === "test" || name.startsWith("test:")) &&
      !name.startsWith("test:visual")
    )
      assert.ok(Object.hasOwn(lanes, name), `${name} bypasses Docker`);
  }
  for (const [name, command] of Object.entries(lanes)) {
    if (name.startsWith("spec:")) {
      assert.match(
        pkg.scripts[name],
        /^node scripts\/dependency-automation\/spec-policy\.mjs (?:--command spec:lint |(?:check|validate|first|build)\b)/,
        `${name} uses the PR-author policy that delegates ordinary PRs to the installed spec-validator`
      );
    } else {
      assert.equal(
        pkg.scripts[name],
        "node scripts/validation.mjs run " + name
      );
    }
    assert.ok(command.length > 0);
    assert.ok(!command.startsWith("node scripts/validation.mjs"));
  }
  assert.ok(!Object.hasOwn(lanes, "test:visual:update"));
  assert.ok(!Object.hasOwn(lanes, "storybook"));
});

test("all hosted workflows explicitly select their provisioned native runtime", async () => {
  const { readdir } = await import("node:fs/promises");
  const dir = new URL("../.github/workflows/", import.meta.url);
  for (const name of await readdir(dir)) {
    if (!/\.ya?ml$/.test(name)) continue;
    assert.match(
      await readFile(new URL(name, dir), "utf8"),
      /LAPIS_PLUGINS_VALIDATION_RUNTIME: native/
    );
  }
});
test("remote resource limits are bounded positive numbers", () => {
  assert.equal(validationConfig({}, {}).cpus, 8);
  assert.throws(() => validationConfig({ memoryGiB: 0 }, {}), /memoryGiB/);
});
test("image identity changes with recipe, dependency and architecture inputs", () => {
  const a = imageKey({ recipe: "a", lock: "one", arch: "amd64" });
  assert.notEqual(a, imageKey({ recipe: "a", lock: "two", arch: "amd64" }));
  assert.notEqual(a, imageKey({ recipe: "a", lock: "one", arch: "arm64" }));
  assert.equal(a, imageKey({ arch: "amd64", lock: "one", recipe: "a" }));
});
test("archive inputs require identity, version and exact checksum", () => {
  assert.throws(
    () => validateArchives([{ name: "a", path: "a.tgz" }]),
    /archive/
  );
  assert.throws(
    () =>
      validateArchives([
        { name: "a", version: "1.0.0", path: "a.tgz", sha256: "a".repeat(64) },
        { name: "a", version: "1.0.0", path: "b.tgz", sha256: "a".repeat(64) }
      ]),
    /Duplicate/
  );
  assert.equal(
    validateArchives([
      {
        name: "@lapismd/a",
        version: "1.0.0",
        path: "a.tgz",
        sha256: "a".repeat(64)
      }
    ]).length,
    1
  );
});
for (const workspace of [false, true])
  test(`snapshot preserves a dirty JJ commit and its direct parent${
    workspace ? " from a separate workspace" : ""
  }`, async () => {
    const { mkdtemp, writeFile, rm, readFile } = await import(
      "node:fs/promises"
    );
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { execFileSync } = await import("node:child_process");
    const { snapshotFile } = await import("./validation/source.mjs");
    const directory = await mkdtemp(join(tmpdir(), "jj-validation-"));
    const primary = join(directory, "source"),
      repo = workspace ? join(directory, "workspace") : primary,
      destination = join(directory, "input"),
      restored = join(directory, "restored");
    const jj = (args, cwd = repo) =>
      execFileSync(
        "jj",
        [
          "--no-pager",
          "--config",
          'user.name="Validation"',
          "--config",
          'user.email="validation@localhost"',
          ...args
        ],
        { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
      ).trim();
    try {
      jj(["git", "init", primary], directory);
      await writeFile(join(primary, "kept.txt"), "parent");
      await writeFile(join(primary, "removed.txt"), "delete me");
      jj(["commit", "-m", "Parent"], primary);
      if (workspace)
        jj(
          ["workspace", "add", repo, "--name", "validation", "-r", "@-"],
          primary
        );
      await writeFile(join(repo, "kept.txt"), "dirty");
      await rm(join(repo, "removed.txt"));
      await writeFile(join(repo, "new.txt"), "new\n");
      const base = jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"]);
      const manifest = JSON.parse(
        execFileSync(
          process.execPath,
          [
            "--input-type=module",
            "-e",
            "const { snapshot } = await import(process.argv[1]); process.stdout.write(JSON.stringify(await snapshot(process.argv[2], process.argv[3])));",
            new URL("./validation/source.mjs", import.meta.url).href,
            repo,
            destination
          ],
          {
            cwd: repo,
            env: { ...process.env, LAPIS_PLUGINS_CHECK_BASE: base },
            encoding: "utf8"
          }
        )
      );
      assert.equal(manifest.base, base);
      assert.equal(manifest.parents.length, 1);
      assert.equal(
        snapshotFile(repo, manifest.revision, "new.txt").toString(),
        "new\n"
      );
      jj(["git", "init", restored], directory);
      execFileSync("git", ["index-pack", "--stdin"], {
        cwd: restored,
        input: await readFile(join(destination, "source.pack")),
        stdio: ["pipe", "pipe", "pipe"]
      });
      execFileSync(
        "git",
        ["update-ref", "refs/heads/validation-snapshot", manifest.revision],
        { cwd: restored }
      );
      jj(["git", "import"], restored);
      jj(["edit", manifest.revision], restored);
      assert.equal(
        jj(["log", "-r", "@", "--no-graph", "-T", "commit_id"], restored),
        manifest.revision
      );
      assert.equal(
        jj(["log", "-r", "@-", "--no-graph", "-T", "commit_id"], restored),
        manifest.parents[0]
      );
      assert.equal(await readFile(join(restored, "kept.txt"), "utf8"), "dirty");
      assert.equal(await readFile(join(restored, "new.txt"), "utf8"), "new\n");
      await assert.rejects(readFile(join(restored, "removed.txt")), /ENOENT/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
test("SSH context transport quotes arguments and rejects other endpoint types", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [cmd, args] = sshDockerCommand("ssh://steve@example.test:2222", [
    "run",
    "image",
    "a; echo unexpected"
  ]);
  assert.equal(cmd, "ssh");
  assert.ok(args.includes("2222"));
  assert.match(args.at(-1), /'a; echo unexpected'/);
  assert.throws(
    () => sshDockerCommand("unix:///var/run/docker.sock", []),
    /SSH Docker context/
  );
});

test("report collection drains trailing archive bytes and rejects corrupt archives", async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const { receiveDirectory } = await import("./validation/docker.mjs");
  const directory = await mkdtemp(join(tmpdir(), "validation-report-"));
  const originalPath = process.env.PATH;
  try {
    const bin = join(directory, "bin"),
      source = join(directory, "source"),
      destination = join(directory, "reports");
    for (const path of [bin, source, destination]) await mkdir(path);
    await writeFile(join(source, "result.json"), '{"status":"passed"}\n');
    const archive = execFileSync("tar", ["-C", source, "-cf", "-", "."]);
    const docker = join(bin, "docker");
    await writeFile(
      docker,
      `#!/usr/bin/env node\nprocess.stdout.on('error', () => process.exit(1));\nprocess.stdout.write(Buffer.from(${JSON.stringify(
        archive.toString("base64")
      )}, 'base64'));\nsetTimeout(() => process.stdout.end(Buffer.alloc(1024 * 1024)), 100);\n`,
      { mode: 0o755 }
    );
    process.env.PATH = `${bin}:${originalPath}`;
    await receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination);
    assert.equal(
      await readFile(join(destination, "result.json"), "utf8"),
      '{"status":"passed"}\n'
    );
    await writeFile(
      docker,
      "#!/usr/bin/env node\nprocess.stdout.end('invalid archive');\n",
      { mode: 0o755 }
    );
    await assert.rejects(
      receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination)
    );
    await writeFile(
      docker,
      `#!/usr/bin/env node\nprocess.stdout.end(Buffer.from(${JSON.stringify(
        archive.toString("base64")
      )}, 'base64'));\nprocess.exitCode = 1;\n`,
      { mode: 0o755 }
    );
    await assert.rejects(
      receiveDirectory({}, ["cp", "owned:/results/.", "-"], destination),
      /Docker transfer exited 1/
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    await rm(directory, { recursive: true, force: true });
  }
});

test("native lane dispatch resolves project binaries and preserves literal arguments", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, rm } = await import(
    "node:fs/promises"
  );
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { runNative } = await import("./validation.mjs");
  const directory = await mkdtemp(join(tmpdir(), "jj-validation-dispatch-"));
  try {
    await mkdir(join(directory, "scripts/validation"), { recursive: true });
    await mkdir(join(directory, "node_modules/.bin"), { recursive: true });
    await writeFile(
      join(directory, "scripts/validation/lanes.json"),
      JSON.stringify({ probe: "validation-probe" })
    );
    await writeFile(
      join(directory, "node_modules/.bin/validation-probe"),
      `#!/usr/bin/env node\nrequire('node:fs').writeFileSync('actual.json',JSON.stringify({args:process.argv.slice(2),runtime:process.env.LAPIS_PLUGINS_VALIDATION_RUNTIME}));\n`,
      { mode: 0o755 }
    );
    await runNative(
      "probe",
      ["space word", "; echo should-stay-literal"],
      directory
    );
    assert.deepEqual(
      JSON.parse(await readFile(join(directory, "actual.json"), "utf8")),
      { args: ["space word", "; echo should-stay-literal"], runtime: "native" }
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("default browser suites run complete bounded shards without changing explicit targets", async () => {
  const { laneInvocations } = await import("./validation/model.mjs");
  assert.deepEqual(
    laneInvocations("test:storybook", []),
    Array.from({ length: 8 }, (_, i) => [`--shard=${i + 1}/8`])
  );
  assert.deepEqual(
    laneInvocations("test:storybook", [
      "Example.stories.svelte",
      "--shard=1/2"
    ]),
    [["Example.stories.svelte", "--shard=1/2"]]
  );
  assert.deepEqual(laneInvocations("test:storybook", ["--shard=4/4"]), [
    ["--shard=7/8"],
    ["--shard=8/8"]
  ]);
  assert.deepEqual(
    laneInvocations("test:storybook", ["--shard=1/4", "--reporter=default"]),
    [
      ["--shard=1/8", "--reporter=default"],
      ["--shard=2/8", "--reporter=default"]
    ]
  );
  assert.deepEqual(laneInvocations("web:test", []), [[]]);
});

test("explicit archive configuration reaches the isolated install", () => {
  assert.equal(
    validationConfig(
      {},
      { LAPIS_PLUGINS_VALIDATION_ARCHIVES: "/tmp/packages.json" }
    ).archives,
    "/tmp/packages.json"
  );
});

test("clean plugin browser installs retain private Sync dependencies and the repository export", async () => {
  const worker = await readFile(
    new URL("./validation/worker.mjs", import.meta.url),
    "utf8"
  );
  assert.match(
    worker,
    /"packages\/sync"[\s\S]*?"--ignore-workspace"[\s\S]*?"--frozen-lockfile"/
  );
  const config = await readFile(
    new URL("../.storybook/main.ts", import.meta.url),
    "utf8"
  );
  assert.ok(
    config.indexOf('"@lapis-notes/history/repository"') <
      config.indexOf('"@lapis-notes/history",')
  );
});

test("SSH direct mode preserves authentication, port and argument boundaries", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [, args] = sshDockerCommand(
    "ssh://steve@example.test:2222",
    ["logs", "a; echo unexpected"],
    { multiplexing: false }
  );
  for (const option of [
    "BatchMode=yes",
    "ConnectTimeout=10",
    "ConnectionAttempts=5",
    "ControlMaster=no",
    "ControlPath=none"
  ])
    assert.ok(args.includes(option), option);
  assert.ok(args.includes("2222"));
  assert.ok(!args.includes("ControlMaster=auto"));
  assert.ok(!args.some((value) => value.startsWith("ControlPersist=")));
  assert.equal(args.at(-1), "'docker' 'logs' 'a; echo unexpected'");
});

test("SSH direct mode configuration rejects non-boolean values", async () => {
  const { validationConfig } = await import("./validation/model.mjs");
  assert.equal(
    validationConfig({ sshMultiplexing: false }, {}).sshMultiplexing,
    false
  );
  assert.equal(
    validationConfig({ sshMultiplexing: true }, {}).sshMultiplexing,
    true
  );
  assert.throws(
    () => validationConfig({ sshMultiplexing: "off" }, {}),
    /SSH multiplexing/
  );
});

test("SSH direct mode reuses an explicitly owned control connection", async () => {
  const { sshDockerCommand } = await import("./validation/docker.mjs");
  const [, args] = sshDockerCommand("ssh://steve@example.test", ["info"], {
    multiplexing: false,
    controlPath: "/tmp/owned-ssh-%C"
  });
  assert.ok(args.includes("ControlMaster=no"));
  assert.ok(args.includes("ControlPath=/tmp/owned-ssh-%C"));
  assert.ok(!args.includes("ControlPath=none"));
});

test("SSH direct mode rejects invalid control connection paths", async () => {
  const { validationConfig } = await import("./validation/model.mjs");
  assert.equal(
    validationConfig({ sshControlPath: "/tmp/owned-ssh-%C" }, {})
      .sshControlPath,
    "/tmp/owned-ssh-%C"
  );
  for (const value of ["relative", "", 42, "/tmp/path\ncommand"])
    assert.throws(
      () => validationConfig({ sshControlPath: value }, {}),
      /SSH control path/
    );
});
