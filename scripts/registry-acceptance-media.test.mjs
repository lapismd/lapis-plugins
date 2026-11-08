import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { normalizeRegistryCatalogDetail } from "@lapis-notes/api/registry/schema";
import { validateRegistryCardCopy } from "./registry-media-compositor.mjs";
import { stageRegistryAcceptanceMedia } from "./lib/registry-acceptance-media.mjs";

test("Bases generated catalog retains every declared gallery view and verifiable media bytes", async () => {
  const out = await mkdtemp(path.join(tmpdir(), "bases-catalog-media-"));
  try {
    const packageRoot = path.resolve("packages/bases");
    const metadata = JSON.parse(
      await readFile(path.join(packageRoot, "registry.json"), "utf8"),
    );
    const staged = await stageRegistryAcceptanceMedia({
      metadata,
      packageRoot,
      out,
      artifactOrigin: "https://registry.local.lapis.md",
      plugin: { directory: "bases" },
      sourceCommit: "a".repeat(40),
    });
    const detail = normalizeRegistryCatalogDetail({
      schemaVersion: 2,
      id: "bases",
      name: "Bases",
      description: "Structured Markdown records",
      owner: { name: "Lapis Notes", verified: true },
      channel: "official",
      status: "active",
      latestVersion: "0.2.1",
      ...staged,
      versions: {
        "0.2.1": {
          version: "0.2.1",
          releasedAt: "2026-11-08T00:00:00.000Z",
          minAppVersion: "0.1.0",
          platforms: ["web"],
          bundle: {
            url: "https://registry.local.lapis.md/base.lapis-plugin",
            sha256: "b".repeat(64),
            size: 1,
          },
        },
      },
    });
    assert.deepEqual(
      detail.gallery.map((item) => item.id),
      ["table", "cards", "grouped-list", "kanban", "activity"],
    );
    for (const item of [...Object.values(detail.media), ...detail.gallery]) {
      assert.deepEqual(Object.keys(item.images).sort(), [
        "dark",
        "full",
        "light",
        "preview",
      ]);
      for (const image of Object.values(item.images)) {
        const bytes = await readFile(
          path.join(out, new URL(image.url).pathname),
        );
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          image.sha256,
        );
        assert.equal(bytes.length, image.size);
      }
      assert.equal("capture" in item, false);
    }
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});

test("acceptance media rejects paths outside registry assets", async () => {
  await assert.rejects(
    stageRegistryAcceptanceMedia({
      metadata: {
        gallery: [
          {
            id: "escape",
            alt: "Invalid",
            images: { preview: { path: "registry-assets/../secret.webp" } },
          },
        ],
      },
      packageRoot: "/unused",
      out: "/unused",
      artifactOrigin: "https://registry.local.lapis.md",
      plugin: { directory: "bases" },
      sourceCommit: "a".repeat(40),
    }),
    /Unsafe/,
  );
});


test("Bases gallery copy fits the governed compositor", async () => {
  const metadata = JSON.parse(await readFile("packages/bases/registry.json", "utf8"));
  for (const item of metadata.gallery) {
    assert.doesNotThrow(() => validateRegistryCardCopy(item.card), item.id);
  }
});
