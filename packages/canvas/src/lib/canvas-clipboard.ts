import type { App } from "@lapis-notes/api";

// Clipboard permission varies by host; the fallback belongs to one vault App.
const clipboardByApp = new WeakMap<App, string>();

export function writeCanvasClipboard(app: App, value: string): void { clipboardByApp.set(app, value); }
export function readCanvasClipboard(app: App): string { return clipboardByApp.get(app) ?? ""; }
export function clearCanvasClipboard(app: App): void { clipboardByApp.delete(app); }
