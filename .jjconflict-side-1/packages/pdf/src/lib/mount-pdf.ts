import type { App, TFile } from "@lapis-notes/api";
// The installed PDFium build, served as a URL so the viewer does not fetch a CDN.
import pdfiumWasmUrl from "@embedpdf/pdfium/pdfium.wasm?url";
import { PDF_VIEWER_DEFAULTS } from "./ids";
import {
  PDF_SETTING_IDS,
  pdfSettingsController,
  readForceDarkPages,
} from "./pdf-settings";

export type PdfMountRole = "file" | "embed";

export type PdfMount = {
  destroy: () => void;
};

type EmbedPdfModule = {
  init: (config: {
    type: "container";
    target: HTMLElement;
    src: string;
    theme?: { preference?: "light" | "dark" };
    worker?: boolean;
    wasmUrl?: string;
    disabledCategories?: string[];
    zoom?: { defaultZoomLevel?: "fit-width" | "fit-page" | "automatic" | number };
    scroll?: {
      defaultStrategy?: "vertical" | "horizontal";
      defaultPageGap?: number;
    };
  }) => ThemedEmbed | undefined;
};

type ThemedEmbed = HTMLElement & {
  setTheme?: (theme: { preference: "light" | "dark" }) => void;
};

const DISABLED_DOCUMENT_CATEGORIES = ["document-open", "document-close"];
const FORCE_DARK_PAGES_CLASS = "lapis-pdf-force-dark-pages";
const FORCE_DARK_PAGES_STYLE_ID = "lapis-pdf-force-dark-pages-style";
const PAGE_INVERSION_FILTER = "invert(1) hue-rotate(180deg)";

function ensurePageInversionStyle(container: HTMLElement): boolean {
  const root = container.shadowRoot;
  if (!root) return false;
  if (!root.getElementById(FORCE_DARK_PAGES_STYLE_ID)) {
    const style = container.ownerDocument.createElement("style");
    style.id = FORCE_DARK_PAGES_STYLE_ID;
    style.textContent = `:host(.${FORCE_DARK_PAGES_CLASS}) img[src^="blob:"] { filter: ${PAGE_INVERSION_FILTER}; }`;
    root.appendChild(style);
  }
  return true;
}

function themePreference(app: App, root: HTMLElement): "light" | "dark" {
  return app.isDarkMode ||
    root.classList.contains("theme-dark") ||
    root.classList.contains("dark")
    ? "dark"
    : "light";
}

export async function openPdfSource(
  app: App,
  file: TFile,
): Promise<{ url: string; revoke: () => void }> {
  let issued: string | undefined;
  try {
    issued = await app.vault.getResourceUrl(file);
  } catch {
    issued = undefined;
  }
  if (issued && /^(?:blob:|https?:)/i.test(issued)) {
    return {
      url: issued,
      revoke: () => app.vault.revokeResourceUrl(issued),
    };
  }
  if (issued) app.vault.revokeResourceUrl(issued);
  const bytes = await app.vault.readBinary(file);
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" }),
  );
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

export function mountPdfViewer(options: {
  app: App;
  file: TFile;
  containerEl: HTMLElement;
  role: PdfMountRole;
}): PdfMount {
  const host = options.containerEl.ownerDocument.createElement("div");
  host.className = "pdf-viewer";
  host.dataset.testid = "pdf-viewer";
  host.dataset.pdfRole = options.role;
  host.style.width = "100%";
  host.style.overflow = "hidden";
  options.containerEl.replaceChildren(host);

  let disposed = false;
  let revoke = () => {};
  let embed: ThemedEmbed | undefined;
  let themeObserver: MutationObserver | null = null;
  let themeFrame: number | null = null;
  let stopSettings: (() => void) | undefined;
  let stopConfiguration: (() => void) | undefined;
  const applyTheme = () => {
    if (disposed || !embed) return;
    const preference = themePreference(
      options.app,
      options.containerEl.ownerDocument.documentElement,
    );
    const dark = readForceDarkPages(options.app) && preference === "dark";
    embed.setTheme?.({ preference });
    const styled = ensurePageInversionStyle(embed);
    embed.classList.toggle(FORCE_DARK_PAGES_CLASS, dark && styled);
    host.classList.toggle("pdf-viewer-force-dark-pages", dark && !styled);
  };
  const syncHeight = () => {
    const height =
      options.containerEl.clientHeight ||
      options.containerEl.getBoundingClientRect().height;
    host.style.height = `${height > 0 ? height : 480}px`;
  };
  syncHeight();
  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(syncHeight);
  resizeObserver?.observe(options.containerEl);

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    themeObserver?.disconnect();
    themeObserver = null;
    stopSettings?.();
    stopSettings = undefined;
    stopConfiguration?.();
    stopConfiguration = undefined;
    if (themeFrame !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(themeFrame);
      themeFrame = null;
    }
    resizeObserver?.disconnect();
    embed?.remove();
    embed = undefined;
    revoke();
    revoke = () => {};
    host.remove();
  };

  void (async () => {
    try {
      const source = await openPdfSource(options.app, options.file);
      if (disposed) {
        source.revoke();
        return;
      }
      revoke = source.revoke;
      const module = (await import("@embedpdf/snippet")) as {
        default: EmbedPdfModule;
      };
      if (disposed) {
        destroy();
        return;
      }
      syncHeight();
      embed = module.default.init({
        type: "container",
        target: host,
        src: source.url,
        worker: false,
        wasmUrl: pdfiumWasmUrl,
        theme: {
          preference: themePreference(
            options.app,
            options.containerEl.ownerDocument.documentElement,
          ),
        },
        disabledCategories: [...DISABLED_DOCUMENT_CATEGORIES],
        zoom: { defaultZoomLevel: PDF_VIEWER_DEFAULTS.defaultZoomLevel },
        scroll: {
          defaultStrategy: PDF_VIEWER_DEFAULTS.scrollStrategy,
          defaultPageGap: PDF_VIEWER_DEFAULTS.pageGap,
        },
      });
      if (embed) {
        embed.style.display = "block";
        embed.style.width = "100%";
        embed.style.height = "100%";
      }
      if (disposed) {
        embed?.remove();
        embed = undefined;
        revoke();
        revoke = () => {};
        return;
      }
      if (embed) {
        applyTheme();
        if (typeof requestAnimationFrame === "function") {
          themeFrame = requestAnimationFrame(() => {
            themeFrame = null;
            applyTheme();
          });
        }
        if (typeof MutationObserver !== "undefined") {
          themeObserver = new MutationObserver(() => applyTheme());
          themeObserver.observe(options.containerEl.ownerDocument.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
          });
        }
        const settings = pdfSettingsController(options.app);
        if (settings) {
          const ref = settings.on("change", (event) => {
            if (event.id && event.id !== PDF_SETTING_IDS.forceDarkPages) return;
            applyTheme();
          });
          stopSettings = () => settings.offref(ref);
        }
        const configuration = options.app.configuration;
        if (configuration?.on && configuration.offref) {
          const ref = configuration.on(
            "updated",
            (event: { key: string }) => {
              if (event.key !== PDF_SETTING_IDS.forceDarkPages) return;
              applyTheme();
            },
          );
          stopConfiguration = () => configuration.offref(ref);
        }
      }
      host.dataset.pdfReady = "true";
    } catch (error) {
      if (disposed) return;
      revoke();
      revoke = () => {};
      host.dataset.pdfError =
        error instanceof Error ? error.message : "PDF viewer failed";
    }
  })();

  return { destroy };
}
