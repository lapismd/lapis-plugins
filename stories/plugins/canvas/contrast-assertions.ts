// Resolve modern CSS colours with the browser's colour parser, then use WCAG's
// sRGB relative luminance. This measures actual rendered theme/preset values.
function rgb(owner: Document, value: string): number[] {
  const context = owner.createElement("canvas").getContext("2d")!;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
}
export function contrastRatio(owner: Document, a: string, b: string) {
  const luminance = (value: string) =>
    rgb(owner, value)
      .map((channel) => channel / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4
      )
      .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
