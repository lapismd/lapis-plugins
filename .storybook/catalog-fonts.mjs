export const requiredCatalogFonts = [
  '16px "DM Sans Variable"',
  '16px "Source Code Pro Variable"',
];

/**
 * @param {FontFaceSet} fonts
 * @param {{ timeoutMs?: number, nextFrame?: () => Promise<unknown> }} options
 */
export async function waitForCatalogFonts(
  fonts,
  {
    timeoutMs = 5_000,
    nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve)),
  } = {},
) {
  let missing = [...requiredCatalogFonts];
  let timeout;
  const expired = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      reject(
        new Error(
          `Storybook catalog fonts are unresolved: ${missing.join(", ")}`,
        ),
      );
    }, timeoutMs);
  });
  try {
    while (true) {
      const loaded = await Promise.race([
        Promise.all(requiredCatalogFonts.map((font) => fonts.load(font))),
        expired,
      ]);
      await Promise.race([fonts.ready, expired]);
      // Story imports can register additional faces while a load is pending.
      await Promise.race([nextFrame(), expired]);
      missing = requiredCatalogFonts.filter(
        (font, index) => loaded[index].length === 0 || !fonts.check(font),
      );
      if (missing.length === 0) return;
    }
  } finally {
    clearTimeout(timeout);
  }
}
