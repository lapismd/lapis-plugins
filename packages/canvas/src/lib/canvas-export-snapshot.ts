import { toBlob } from "html-to-image";
import type { canvasExportPlan } from "./canvas-export-plan";

export type CanvasExportPrivacy = {
  text: boolean;
  files: boolean;
  addresses: boolean;
  images: boolean;
};
const omit =
  "script, style, link, iframe, object, embed, audio, video, source, .canvas-node-toolbar, .svelte-flow__node-toolbar, .svelte-flow__handle, .canvas-node-resize-handle, .canvas-node-resize-line, .canvas-node-edge-activator, .canvas-card-edit-button, [data-canvas-background-probe], .canvas-web-actions button, .canvas-web-fallback";
const svgAttributes = new Set([
  "d",
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "points",
  "preserveAspectRatio",
  "id",
  "transform",
  "markerWidth",
  "markerHeight",
  "refX",
  "refY",
  "orient",
  "offset",
]);

/** Copy presentation into a private inert tree; never clone live network sources. */
export function canvasExportSnapshot(
  source: HTMLElement,
  privacy: CanvasExportPrivacy,
): HTMLElement {
  const doc = source.ownerDocument,
    view = doc.defaultView!;
  function pixels(node: HTMLImageElement | HTMLCanvasElement): string | null {
    if (
      node instanceof HTMLImageElement &&
      !/^(blob:|data:image\/)/i.test(node.currentSrc || node.src)
    )
      return null;
    try {
      const width =
          node instanceof HTMLImageElement ? node.naturalWidth : node.width,
        height =
          node instanceof HTMLImageElement ? node.naturalHeight : node.height;
      if (!width || !height || width * height > 16_000_000) return null;
      const canvas = doc.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(node, 0, 0);
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }
  function clone(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE)
      return doc.createTextNode(node.textContent ?? "");
    if (!(node instanceof Element) || node.matches(omit)) return null;
    const kind = node
      .closest("[data-canvas-card-kind]")
      ?.getAttribute("data-canvas-card-kind");
    if (
      !privacy.files &&
      kind === "file" &&
      node.matches(".canvas-node-file-label")
    )
      return null;
    const copy = doc.createElementNS(node.namespaceURI, node.localName) as
      | HTMLElement
      | SVGElement;
    const computed = view.getComputedStyle(node);
    for (const property of Array.from(computed)) {
      const value = computed.getPropertyValue(property);
      if (
        property.startsWith("--") ||
        /url\s*\(/i.test(value) ||
        property === "content" ||
        property === "animation" ||
        property === "transition"
      )
        continue;
      copy.style.setProperty(property, value);
    }
    // No classes, event attributes, source URLs, browsing contexts or form state.
    // SVG geometry/paint is retained; arbitrary URL-bearing attributes are not.
    if (node.namespaceURI === "http://www.w3.org/2000/svg") {
      for (const { name, value } of Array.from(node.attributes))
        if (svgAttributes.has(name) && !/url\s*\(/i.test(value))
          copy.setAttribute(name, value);
    }
    copy.style.animation = "none";
    copy.style.transition = "none";
    if (privacy.images && node.matches("[data-canvas-group-background]")) {
      const probe = node.querySelector<HTMLImageElement>(
        "[data-canvas-background-probe]",
      );
      const image = probe && pixels(probe);
      if (image) copy.style.backgroundImage = `url("${image}")`;
    }
    const hiddenContent =
      node.matches(".canvas-node-label") &&
      ((kind === "text" && !privacy.text) ||
        (kind === "file" && !privacy.files) ||
        (kind === "link" && !privacy.addresses));
    if (hiddenContent) {
      copy.textContent =
        kind === "file"
          ? "File card"
          : kind === "link"
            ? "Web page"
            : "Text card";
      return copy;
    }
    if (
      node instanceof HTMLImageElement ||
      node instanceof HTMLCanvasElement ||
      node instanceof SVGImageElement
    ) {
      if (!privacy.images || node instanceof SVGImageElement) return null;
      // Read already-decoded local pixels only. No HTTP fetch is made for export.
      const data = pixels(node);
      if (!data) return null;
      const image = doc.createElement("img");
      image.src = data;
      image.style.cssText = copy.style.cssText;
      return image;
    }
    for (const child of Array.from(node.childNodes)) {
      const next = clone(child);
      if (next) copy.appendChild(next);
    }
    return copy;
  }
  return clone(source) as HTMLElement;
}

export async function canvasPng(
  source: HTMLElement,
  plan: ReturnType<typeof canvasExportPlan>,
  privacy: CanvasExportPrivacy,
  background?: string,
): Promise<Blob> {
  const doc = source.ownerDocument,
    host = doc.createElement("div");
  host.inert = true;
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:0;top:0;transform:translateX(-100000px);width:${plan.width}px;height:${plan.height}px;overflow:hidden;pointer-events:none;`;
  const clone = canvasExportSnapshot(source, privacy);
  clone.style.transform = plan.transform;
  clone.style.transformOrigin = "0 0";
  clone.style.width = "100%";
  clone.style.height = "100%";
  // Global pseudo-element rules cannot introduce new resources into the snapshot.
  const id = `canvas-export-${crypto.randomUUID()}`;
  host.id = id;
  const style = doc.createElement("style");
  style.textContent = `#${id}::before,#${id}::after,#${id} *::before,#${id} *::after{content:none!important;background-image:none!important;}`;
  host.append(style, clone);
  doc.body.appendChild(host);
  try {
    const blob = await toBlob(host, {
      width: plan.width,
      height: plan.height,
      pixelRatio: plan.pixelWidth / plan.width,
      backgroundColor: background,
      skipFonts: true,
      fontEmbedCSS: "",
      skipAutoScale: true,
      filter: (node) => node.tagName !== "STYLE",
      style: { left: "0", top: "0", position: "relative", transform: "none" },
    });
    if (!blob || blob.type !== "image/png")
      throw new Error("PNG export is unavailable in this browser.");
    return blob;
  } finally {
    host.remove();
  }
}
