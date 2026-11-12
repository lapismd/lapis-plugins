import { expect, test } from "vitest";
import { canvasCardColors, contrast, defaultCanvasTheme, luminance, readableColor, type CanvasTheme } from "./canvas-contrast";

test("WCAG luminance and contrast match reference endpoints", () => {
  expect(luminance([0, 0, 0])).toBe(0);
  expect(luminance([255, 255, 255])).toBe(1);
  expect(contrast([0, 0, 0], [255, 255, 255])).toBe(21);
  expect(contrast([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.478, 3);
});

for (const dark of [false, true]) test(`all stored RGB colours retain readable ${dark ? "dark" : "light"} presentation`, () => {
  const theme: CanvasTheme = dark ? { ...defaultCanvasTheme, board: [20, 20, 20], surface: [32, 32, 32], text: [220, 220, 220], muted: [130, 130, 130] } : defaultCanvasTheme;
  for (let red = 0; red <= 255; red += 51) for (let green = 0; green <= 255; green += 51) for (let blue = 0; blue <= 255; blue += 51) {
    const color = `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    for (const group of [false, true]) {
      const card = canvasCardColors(theme, color, group);
      expect(contrast(card.text, card.fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(card.muted, card.fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(card.link, card.fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(card.labelText, card.labelFill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(card.border, card.fill)).toBeGreaterThanOrEqual(3);
      expect(contrast(card.border, theme.board)).toBeGreaterThanOrEqual(3);
      expect(contrast(card.selected, card.fill)).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(readableColor(cardAccent(color), [theme.board], 3), theme.board)).toBeGreaterThanOrEqual(3);
  }
});
function cardAccent(color: string): readonly [number, number, number] {
  return [0, 2, 4].map((start) => Number.parseInt(color.slice(1 + start, 3 + start), 16)) as [number, number, number];
}

test("already readable theme colours are retained and preset overrides are resolved", () => {
  expect(readableColor([0, 0, 0], [[255, 255, 255]], 4.5)).toEqual([0, 0, 0]);
  const theme = { ...defaultCanvasTheme, presets: { "1": [0, 0, 255] as const } };
  expect(canvasCardColors(theme, "1").accent).toEqual([0, 0, 255]);
  expect(theme.presets["1"]).toEqual([0, 0, 255]);
});
