export type Rgb = readonly [number, number, number];
export type CanvasTheme = {
  board: Rgb; surface: Rgb; text: Rgb; muted: Rgb; border: Rgb; focus: Rgb;
  presets: Record<string, Rgb>;
};
const black: Rgb = [0, 0, 0], white: Rgb = [255, 255, 255];
export const defaultCanvasTheme: CanvasTheme = {
  board: white, surface: [245, 245, 245], text: [25, 25, 25], muted: [90, 90, 90],
  border: [110, 110, 110], focus: [95, 55, 190], presets: {},
};
export function luminance(rgb: Rgb): number {
  const channels = rgb.map((channel) => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
export function contrast(first: Rgb, second: Rgb): number {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function mix(base: Rgb, overlay: Rgb, weight: number): Rgb {
  return base.map((channel, index) => Math.round(channel * (1 - weight) + overlay[index]! * weight)) as unknown as Rgb;
}
export function readableColor(color: Rgb, backgrounds: readonly Rgb[], minimum: number): Rgb {
  const score = (candidate: Rgb) => Math.min(...backgrounds.map((background) => contrast(candidate, background)));
  if (score(color) >= minimum) return color;
  const target = score(black) >= score(white) ? black : white;
  let lower = 0, upper = 1;
  for (let iteration = 0; iteration < 24; iteration++) {
    const weight = (lower + upper) / 2;
    if (score(mix(color, target, weight)) >= minimum + 0.05) upper = weight;
    else lower = weight;
  }
  const adjusted = mix(color, target, upper);
  return score(adjusted) >= minimum ? adjusted : target;
}
export function rgbCss(rgb: Rgb): string { return `rgb(${rgb.join(" ")})`; }
export function canvasAccent(theme: CanvasTheme, color?: string): Rgb {
  if (!color) return theme.border;
  if (theme.presets[color]) return theme.presets[color];
  const hex = /^#([\da-f]{6})$/i.exec(color)?.[1];
  return hex ? [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)) as unknown as Rgb : theme.border;
}
export function canvasCardColors(theme: CanvasTheme, color?: string, group = false) {
  const accent = canvasAccent(theme, color);
  const fill = color ? mix(group ? theme.board : theme.surface, accent, group ? 0.14 : 0.18) : group ? theme.board : theme.surface;
  const labelFill = group ? mix(theme.surface, accent, 0.5) : fill;
  return {
    accent, fill, text: readableColor(theme.text, [fill], 4.5),
    muted: readableColor(theme.muted, [fill], 4.5),
    link: readableColor(theme.focus, [fill], 4.5),
    border: readableColor(accent, [fill, theme.board], 3),
    selected: readableColor(theme.focus, [fill, theme.board], 3),
    labelFill, labelText: readableColor(theme.text, [labelFill], 4.5),
    labelBorder: readableColor(accent, [labelFill], 3),
  };
}
export function canvasCardStyle(theme: CanvasTheme, color?: string, group = false): string {
  const value = canvasCardColors(theme, color, group);
  return Object.entries({
    "--canvas-node-accent": value.accent, "--canvas-node-fill": value.fill,
    "--canvas-node-text": value.text, "--canvas-node-muted": value.muted,
    "--canvas-node-link": value.link, "--canvas-node-border": value.border,
    "--canvas-node-selected-border": value.selected, "--canvas-node-kind-color": value.muted,
    "--canvas-node-input-background": value.fill, "--canvas-group-label-background": value.labelFill,
    "--canvas-group-label-text": value.labelText, "--canvas-group-label-border": value.labelBorder,
  }).map(([name, rgb]) => `${name}:${rgbCss(rgb)}`).join(";");
}
