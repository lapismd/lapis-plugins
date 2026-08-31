import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  composeRegistryMedia,
  defaultRegistryMediaFontPath,
  REGISTRY_MEDIA_DIMENSIONS,
  REGISTRY_MEDIA_SCREENSHOT_RIGHT_GUTTER,
  resolveRegistryScreenshotFrame,
} from "./registry-media-compositor.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("full-shell cards preserve both source edges and a dark outer gutter", async () => {
  const frame = resolveRegistryScreenshotFrame("full-shell");
  assert.deepEqual(frame, {
    width: 1440,
    height: 960,
    radius: 16,
  });
  assert.deepEqual(resolveRegistryScreenshotFrame("right-sidebar"), {
    width: 1440,
    height: 1280,
    radius: 16,
  });

  const source = await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 4,
      background: "#171717",
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="2400" height="1600" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="1600" fill="#FF0000"/><rect x="2280" width="120" height="1600" fill="#00FFFF"/></svg>'
        ),
      },
    ])
    .png()
    .toBuffer();

  const { full } = await composeRegistryMedia({
    source,
    focus: "full-shell",
    card: {
      headline: [{ text: "Full window", tone: "neutral" }],
      description: [{ text: "Both edges remain visible.", tone: "neutral" }],
    },
    fontPath: defaultRegistryMediaFontPath(root),
  });
  const decoded = await sharp(full).raw().toBuffer({ resolveWithObject: true });
  const screenshotRight =
    REGISTRY_MEDIA_DIMENSIONS.full.width -
    REGISTRY_MEDIA_SCREENSHOT_RIGHT_GUTTER;
  const screenshotLeft = screenshotRight - frame.width;

  assert.deepEqual(pixel(decoded, screenshotLeft + 20, 800), [255, 0, 0]);
  assert.deepEqual(pixel(decoded, screenshotRight - 20, 800), [0, 255, 255]);
  assert.notDeepEqual(pixel(decoded, screenshotRight + 20, 800), [0, 255, 255]);
});

function pixel({ data, info }, x, y) {
  const offset = (y * info.width + x) * info.channels;
  return [...data.subarray(offset, offset + Math.min(info.channels, 3))];
}
