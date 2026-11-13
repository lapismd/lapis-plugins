import { PRESET_COLORS } from "./json-canvas";
import { defaultCanvasTheme, readableColor, rgbCss, type CanvasTheme, type Rgb } from "./canvas-contrast";

/** One computed theme per board; custom JSON hex colours need no DOM work. */
export function createCanvasTheme() {
  let current = $state.raw<CanvasTheme>(defaultCanvasTheme);
  return {
    get current() { return current; },
    get style() {
      return `--canvas-readable-text:${rgbCss(readableColor(current.text, [current.surface, current.board], 4.5))};--canvas-readable-muted:${rgbCss(readableColor(current.muted, [current.surface, current.board], 4.5))};--canvas-readable-indicator:${rgbCss(readableColor(current.focus, [current.surface, current.board], 3))};--canvas-readable-surface:${rgbCss(current.surface)};--canvas-readable-board:${rgbCss(current.board)}`;
    },
    attach(element: HTMLElement): () => void {
      const owner = element.ownerDocument, view = owner.defaultView!;
      const probe = owner.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0";
      probe.setAttribute("aria-hidden", "true"); element.append(probe);
      const canvas = owner.createElement("canvas"); canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      let last = "", frame: number | null = null, active = true;
      const read = (value: string, fallback: Rgb): Rgb => {
        if (!context) return fallback;
        probe.style.color = "";
        probe.style.color = value;
        if (!probe.style.color) return fallback;
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = view.getComputedStyle(probe).color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
        if (!alpha) return fallback;
        return [r!, g!, b!].map((channel, index) => Math.round(channel * (alpha! / 255) + fallback[index]! * (1 - alpha! / 255))) as unknown as Rgb;
      };
      const update = () => {
        if (!active) return;
        frame = null;
        const ancestors: HTMLElement[] = [];
        for (let parent = element.parentElement; parent; parent = parent.parentElement) ancestors.unshift(parent);
        let backdrop = defaultCanvasTheme.board;
        for (const parent of ancestors) backdrop = read(view.getComputedStyle(parent).backgroundColor, backdrop);
        const board = read(view.getComputedStyle(element).backgroundColor, backdrop);
        const next: CanvasTheme = {
          board, surface: read("var(--background-secondary, white)", board),
          text: read("var(--text-normal, black)", defaultCanvasTheme.text),
          muted: read("var(--text-muted, black)", defaultCanvasTheme.muted),
          border: read("var(--background-modifier-border, gray)", defaultCanvasTheme.border),
          focus: read("var(--interactive-accent, #6030c0)", defaultCanvasTheme.focus),
          presets: Object.fromEntries(Object.entries(PRESET_COLORS).map(([id, value]) => [id, read(value, defaultCanvasTheme.border)])),
        };
        const key = JSON.stringify(next);
        if (key !== last) { last = key; current = next; }
      };
      const schedule = () => { if (active && frame === null) frame = view.requestAnimationFrame(update); };
      const observer = new view.MutationObserver(schedule);
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) observer.observe(ancestor, { attributes: true, attributeFilter: ["class", "style", "data-ui-theme", "data-color-mode"] });
      observer.observe(owner.head, { childList: true, subtree: true, characterData: true });
      const media = view.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", schedule);
      update();
      return () => { active = false; observer.disconnect(); media.removeEventListener("change", schedule); if (frame !== null) view.cancelAnimationFrame(frame); probe.remove(); };
    },
  };
}
export type CanvasThemeContext = ReturnType<typeof createCanvasTheme>;
