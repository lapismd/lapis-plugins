import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Stage source-declared media in the private signed-catalog acceptance fixture. */
export async function stageRegistryAcceptanceMedia({
  metadata,
  packageRoot,
  out,
  artifactOrigin,
  plugin,
  sourceCommit,
}) {
  async function item(source) {
    const images = {};
    for (const [variant, reference] of Object.entries(source.images)) {
      if (
        !/^registry-assets\/[a-zA-Z0-9._/-]+\.(webp|png|svg)$/.test(
          reference.path,
        ) ||
        reference.path.split("/").includes("..")
      ) {
        throw new Error("Unsafe registry acceptance media path.");
      }
      const file = path.join(packageRoot, reference.path);
      const bytes = await readFile(file);
      const dimensions = await sharp(bytes).metadata();
      const target = `v2/media/${plugin.directory}/${reference.path}`;
      await mkdir(path.dirname(path.join(out, target)), { recursive: true });
      await copyFile(file, path.join(out, target));
      images[variant] = {
        url: `${artifactOrigin}/${target}`,
        sourceUrl: `https://raw.githubusercontent.com/lapismd/lapis-plugins/${sourceCommit}/packages/${plugin.directory}/${reference.path}`,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        size: bytes.length,
        mediaType: reference.path.endsWith(".svg")
          ? "image/svg+xml"
          : `image/${dimensions.format}`,
        width: dimensions.width,
        height: dimensions.height,
      };
    }
    return { ...(source.id ? { id: source.id } : {}), alt: source.alt, images };
  }
  return {
    media: Object.fromEntries(
      await Promise.all(
        Object.entries(metadata.media ?? {}).map(async ([role, source]) => [
          role,
          await item(source),
        ]),
      ),
    ),
    gallery: await Promise.all((metadata.gallery ?? []).map(item)),
  };
}
