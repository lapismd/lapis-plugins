type Rect = { x: number; y: number; width: number; height: number };
type Viewport = { x: number; y: number; zoom: number };
/** Include painted connectors/labels, whose curves can extend beyond cards. */
export function canvasPaintedBounds(
  source: HTMLElement,
  nodes: Rect,
  zoom: number,
): Rect {
  const origin = source.getBoundingClientRect();
  let left = nodes.x,
    top = nodes.y,
    right = nodes.x + nodes.width,
    bottom = nodes.y + nodes.height;
  for (const element of source.querySelectorAll(
    ".canvas-flow-edge-path, .canvas-flow-edge-arrow, .canvas-edge-passive-label, .canvas-edge-label-hit-target-text",
  )) {
    const rect = element.getBoundingClientRect();
    if (!rect.width && !rect.height) continue;
    left = Math.min(left, (rect.left - origin.left) / zoom);
    top = Math.min(top, (rect.top - origin.top) / zoom);
    right = Math.max(right, (rect.right - origin.left) / zoom);
    bottom = Math.max(bottom, (rect.bottom - origin.top) / zoom);
  }
  // Browser screen transforms can introduce sub-micro-pixel floating noise.
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  return {
    x: round(left),
    y: round(top),
    width: round(right - left),
    height: round(bottom - top),
  };
}
export function canvasExportPlan({
  scope,
  bounds,
  viewport,
  size,
  ratio,
}: {
  scope: "board" | "viewport";
  bounds: Rect;
  viewport: Viewport;
  size: { width: number; height: number };
  ratio: number;
}) {
  if (![1, 2, 4].includes(ratio))
    throw new Error("Choose a supported export quality.");
  if (
    ![
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      viewport.x,
      viewport.y,
      viewport.zoom,
      size.width,
      size.height,
    ].every(Number.isFinite) ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    viewport.zoom <= 0 ||
    size.width <= 0 ||
    size.height <= 0
  )
    throw new Error("Canvas export geometry is unavailable.");
  const width = Math.ceil(scope === "board" ? bounds.width + 96 : size.width),
    height = Math.ceil(scope === "board" ? bounds.height + 96 : size.height);
  const pixelWidth = width * ratio,
    pixelHeight = height * ratio;
  if (
    pixelWidth > 16384 ||
    pixelHeight > 16384 ||
    pixelWidth * pixelHeight > 32_000_000
  )
    throw new Error(
      "Choose a smaller viewport or lower export quality (maximum 32 megapixels).",
    );
  const x = scope === "board" ? 48 - bounds.x : viewport.x,
    y = scope === "board" ? 48 - bounds.y : viewport.y,
    zoom = scope === "board" ? 1 : viewport.zoom;
  return {
    width,
    height,
    pixelWidth,
    pixelHeight,
    transform: `translate(${x}px, ${y}px) scale(${zoom})`,
  };
}
