import xyflowStyles from "@xyflow/svelte/dist/style.css?inline";

/** Foundation CSS belongs to mounted surfaces, including other owned documents. */
export function acquireCanvasStyles(owner: Document, css = xyflowStyles): () => void {
  let style = owner.querySelector<HTMLStyleElement>("style[data-lapis-canvas-foundation]");
  if (!style) {
    style = owner.createElement("style");
    style.dataset.lapisCanvasFoundation = "";
    style.textContent = css;
    owner.head.prepend(style);
  }
  const sheet = style;
  sheet.dataset.users = String(Number(sheet.dataset.users ?? 0) + 1);
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    const remaining = Number(sheet.dataset.users) - 1;
    if (remaining > 0) sheet.dataset.users = String(remaining);
    else sheet.remove();
  };
}
