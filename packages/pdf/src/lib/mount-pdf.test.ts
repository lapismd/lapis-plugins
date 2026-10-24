// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App, TFile } from "@lapis-notes/api";

const harness = vi.hoisted(() => ({
  init: vi.fn((_config: { src: string }) => document.createElement("div")),
}));

vi.mock("@embedpdf/snippet", () => ({
  default: { init: harness.init },
}));

vi.mock(
  "../../../../node_modules/.pnpm/@embedpdf+pdfium@2.15.1/node_modules/@embedpdf/pdfium/dist/pdfium.wasm?url",
  () => ({
    default: "https://files.example/pdfium.wasm",
  }),
);

import { mountPdfViewer, openPdfSource } from "./mount-pdf";

function file(): TFile {
  return { path: "Sample.pdf", extension: "pdf", basename: "Sample" } as TFile;
}

function app(options: {
  url?: Promise<string> | string;
  bytes?: Uint8Array;
}): App {
  return {
    isDarkMode: false,
    vault: {
      getResourceUrl: vi.fn(async () => options.url ?? "https://files.example/sample.pdf"),
      revokeResourceUrl: vi.fn(),
      readBinary: vi.fn(async () => options.bytes ?? new Uint8Array([1, 2, 3])),
    },
  } as unknown as App;
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("PDF mount", () => {
  beforeEach(() => {
    harness.init.mockReset();
    harness.init.mockImplementation(() => document.createElement("div"));
    document.documentElement.classList.remove("theme-dark", "dark");
  });

  it("opens a fetchable resource URL and revokes it on destroy", async () => {
    const runtime = app({});
    const container = document.createElement("div");
    document.body.append(container);
    const handle = mountPdfViewer({
      app: runtime,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() => expect(harness.init).toHaveBeenCalledOnce());
    const config = harness.init.mock.calls[0]?.[0];
    if (!config) throw new Error("EmbedPDF was not initialized");
    expect(config).toMatchObject({
      type: "container",
      src: "https://files.example/sample.pdf",
      wasmUrl: "https://files.example/pdfium.wasm",
      theme: { preference: "light" },
      disabledCategories: ["document-open", "document-close"],
      zoom: { defaultZoomLevel: "fit-width" },
      scroll: { defaultStrategy: "vertical", defaultPageGap: 10 },
    });
    expect(runtime.vault.readBinary).not.toHaveBeenCalled();
    expect(container.querySelector("[data-pdf-ready='true']")).not.toBeNull();
    handle.destroy();
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledWith(
      "https://files.example/sample.pdf",
    );
    expect(container.querySelector("[data-testid='pdf-viewer']")).toBeNull();
  });

  it("uses a blob URL when the vault resource URL is not fetchable", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const runtime = app({ url: "vault://Sample.pdf" });
    const container = document.createElement("div");
    const source = await openPdfSource(runtime, file());
    expect(source.url.startsWith("blob:")).toBe(true);
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledWith(
      "vault://Sample.pdf",
    );
    const handle = mountPdfViewer({
      app: runtime,
      file: file(),
      containerEl: container,
      role: "embed",
    });
    await vi.waitFor(() => expect(harness.init).toHaveBeenCalledOnce());
    expect(harness.init.mock.calls[0]?.[0]?.src.startsWith("blob:")).toBe(true);
    handle.destroy();
    expect(revoke).toHaveBeenCalled();
    revoke.mockRestore();
    source.revoke();
  });

  it("follows a document theme change after the viewer opens", async () => {
    const setTheme = vi.fn();
    let element: HTMLDivElement | undefined;
    harness.init.mockImplementation(() => {
      const created = document.createElement("div") as HTMLDivElement & {
        setTheme: typeof setTheme;
      };
      created.setTheme = setTheme;
      created.attachShadow({ mode: "open" });
      element = created;
      return created;
    });
    const runtime = app({});
    Object.defineProperty(runtime, "isDarkMode", {
      get: () => document.documentElement.classList.contains("theme-dark"),
    });
    const container = document.createElement("div");
    const handle = mountPdfViewer({
      app: runtime,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith({ preference: "light" }),
    );
    setTheme.mockClear();
    document.documentElement.classList.add("dark");
    await vi.waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith({ preference: "dark" }),
    );
    expect(element?.classList.contains("lapis-pdf-force-dark-pages")).toBe(
      true,
    );
    expect(
      element?.shadowRoot
        ?.getElementById("lapis-pdf-force-dark-pages-style")
        ?.textContent,
    ).toContain("invert(1) hue-rotate(180deg)");
    setTheme.mockClear();
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("theme-dark");
    await vi.waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith({ preference: "dark" }),
    );
    setTheme.mockClear();
    document.documentElement.classList.remove("theme-dark");
    await vi.waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith({ preference: "light" }),
    );
    expect(element?.classList.contains("lapis-pdf-force-dark-pages")).toBe(
      false,
    );
    handle.destroy();
    setTheme.mockClear();
    document.documentElement.classList.add("dark");
    await flush();
    expect(setTheme).not.toHaveBeenCalled();
  });

  it("follows the invert-pages setting and leaves pages unchanged when it is off", async () => {
    const setTheme = vi.fn();
    let element: HTMLDivElement | undefined;
    harness.init.mockImplementation(() => {
      const created = document.createElement("div") as HTMLDivElement & {
        setTheme: typeof setTheme;
      };
      created.setTheme = setTheme;
      created.attachShadow({ mode: "open" });
      element = created;
      return created;
    });
    document.documentElement.classList.add("dark");
    let forceDarkPages = false;
    const listeners = new Set<(event: { key: string }) => void>();
    const runtime = app({});
    Object.assign(runtime, {
      configuration: {
        getConfiguration: () => ({
          get: (key: string, fallback?: boolean) =>
            key === "lapis-pdf.forceDarkPages" ? forceDarkPages : fallback,
        }),
        on: (_name: string, listener: (event: { key: string }) => void) => {
          listeners.add(listener);
          return listener;
        },
        offref: (listener: (event: { key: string }) => void) => {
          listeners.delete(listener);
        },
      },
    });
    const container = document.createElement("div");
    const handle = mountPdfViewer({
      app: runtime,
      file: file(),
      containerEl: container,
      role: "file",
    });
    await vi.waitFor(() =>
      expect(setTheme).toHaveBeenCalledWith({ preference: "dark" }),
    );
    expect(element?.classList.contains("lapis-pdf-force-dark-pages")).toBe(
      false,
    );
    forceDarkPages = true;
    for (const listener of listeners) {
      listener({ key: "lapis-pdf.forceDarkPages" });
    }
    await vi.waitFor(() =>
      expect(element?.classList.contains("lapis-pdf-force-dark-pages")).toBe(
        true,
      ),
    );
    handle.destroy();
    expect(listeners.size).toBe(0);
  });

  it("destroys a mount that finishes after dispose", async () => {
    let resolveUrl: (url: string) => void = () => {};
    const runtime = app({
      url: new Promise<string>((resolve) => {
        resolveUrl = resolve;
      }),
    });
    const container = document.createElement("div");
    const handle = mountPdfViewer({
      app: runtime,
      file: file(),
      containerEl: container,
      role: "file",
    });
    handle.destroy();
    resolveUrl("https://files.example/late.pdf");
    await flush();
    await flush();
    expect(harness.init).not.toHaveBeenCalled();
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledWith(
      "https://files.example/late.pdf",
    );
  });
});
