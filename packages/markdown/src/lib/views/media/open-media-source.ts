import type { App, TFile } from "@lapis-notes/api";

export const MIME_TYPES: Record<string, string> = Object.freeze({
  gif: "image/gif",
  tif: "image/tiff",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp",
  apng: "image/apng",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/vnd.microsoft.icon",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
});

const FETCHABLE_URL = /^(?:blob:|https?:)/i;

export type MediaSource = {
  url: string;
  revoke: () => void;
};

export async function openMediaSource(
  app: App,
  file: TFile,
): Promise<MediaSource> {
  let issued: string | undefined;
  try {
    issued = await app.vault.getResourceUrl(file);
  } catch {
    issued = undefined;
  }
  if (issued && FETCHABLE_URL.test(issued)) {
    const url = issued;
    return {
      url,
      revoke: () => {
        app.vault.revokeResourceUrl(url);
      },
    };
  }
  if (issued) app.vault.revokeResourceUrl(issued);
  const bytes = await app.vault.readBinary(file);
  const type = MIME_TYPES[file.extension.toLowerCase()];
  const url = URL.createObjectURL(
    new Blob([bytes], type ? { type } : undefined),
  );
  return {
    url,
    revoke: () => {
      URL.revokeObjectURL(url);
    },
  };
}
