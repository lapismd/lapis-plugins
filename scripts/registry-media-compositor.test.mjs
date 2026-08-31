import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import {
  composeRegistryMedia,
  composeRegistryProductMedia,
  defaultRegistryMediaFontPath,
  REGISTRY_MEDIA_DIMENSIONS,
  REGISTRY_MEDIA_SCREENSHOT_RIGHT_GUTTER,
  REGISTRY_MEDIA_SPLIT,
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
    lightSource: source,
    darkSource: source,
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

test("product media uses a fixed dark-upper-left and light-lower-right split", async () => {
  const lightSource = await solidCapture("#F8FAFC");
  const darkSource = await solidCapture("#111827");
  const media = await composeRegistryProductMedia({ lightSource, darkSource });
  const decoded = await sharp(media.full)
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.deepEqual(
    pixel(decoded, REGISTRY_MEDIA_SPLIT.topX - 100, 100),
    [17, 24, 39]
  );
  assert.deepEqual(
    pixel(decoded, REGISTRY_MEDIA_SPLIT.bottomX + 100, 1500),
    [248, 250, 252]
  );
  assert.equal((await sharp(media.preview).metadata()).width, 1200);
  assert.equal((await sharp(media.light).metadata()).width, 2400);
  assert.equal((await sharp(media.dark).metadata()).width, 2400);
});

function solidCapture(background) {
  return sharp({
    create: {
      width: REGISTRY_MEDIA_DIMENSIONS.capture.width,
      height: REGISTRY_MEDIA_DIMENSIONS.capture.height,
      channels: 3,
      background,
    },
  })
    .png()
    .toBuffer();
}

function pixel({ data, info }, x, y) {
  const offset = (y * info.width + x) * info.channels;
  return [...data.subarray(offset, offset + Math.min(info.channels, 3))];
}
