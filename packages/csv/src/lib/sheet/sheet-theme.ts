const THEME_ATTRIBUTES = [
  "class",
  "style",
  "data-theme",
  "data-mode",
  "data-ui-theme",
];

/** Repaint when the document switches between light and dark. */
export function watchSheetTheme(
  node: HTMLElement,
  onChange: () => void,
): () => void {
  const doc = node.ownerDocument;
  const observer = new MutationObserver(onChange);
  const options = { attributes: true, attributeFilter: THEME_ATTRIBUTES };
  const seen = new Set<Node>();
  for (let current: Node | null = node; current; current = current.parentNode) {
    if (seen.has(current) || !(current instanceof Element)) continue;
    seen.add(current);
    observer.observe(current, options);
  }
  const media = doc.defaultView?.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}
