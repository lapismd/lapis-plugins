import assert from "node:assert/strict";
import { test } from "node:test";
import {
  requiredCatalogFonts,
  waitForCatalogFonts,
} from "../.storybook/catalog-fonts.mjs";

test("waits for a font face registered while the catalog is loading", async () => {
  let frame = 0;
  const loads = [];
  const fonts = {
    ready: Promise.resolve(),
    load: async (font) => {
      loads.push(font);
      return [{ status: "loaded" }];
    },
    check: (font) => font === requiredCatalogFonts[0] || frame >= 2,
  };
  await waitForCatalogFonts(fonts, {
    nextFrame: async () => {
      frame += 1;
    },
  });
  assert.equal(frame, 2);
  assert.deepEqual(loads, [...requiredCatalogFonts, ...requiredCatalogFonts]);
});

test("rejects fallback availability when no catalog font face is registered", async () => {
  await assert.rejects(
    waitForCatalogFonts(
      { ready: Promise.resolve(), load: async () => [], check: () => true },
      { timeoutMs: 10, nextFrame: () => new Promise(() => {}) },
    ),
    /Storybook catalog fonts are unresolved.*DM Sans Variable.*Source Code Pro Variable/,
  );
});

test("preserves font download failures", async () => {
  await assert.rejects(
    waitForCatalogFonts({
      ready: Promise.resolve(),
      load: async () => {
        throw new Error("font download failed");
      },
      check: () => true,
    }),
    /font download failed/,
  );
});
