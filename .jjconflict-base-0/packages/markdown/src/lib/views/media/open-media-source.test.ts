// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "@lapis-notes/api";
import { openMediaSource } from "./open-media-source";

function file(): TFile {
  return { path: "Assets/map.png", extension: "png", baseName: "map" } as TFile;
}

function app(options: {
  url?: Promise<string> | string;
  bytes?: ArrayBuffer;
}): App {
  return {
    vault: {
      getResourceUrl: vi.fn(async () => {
        if (options.url instanceof Promise) return options.url;
        if (options.url === undefined) throw new Error("no resource url");
        return options.url;
      }),
      revokeResourceUrl: vi.fn(),
      readBinary: vi.fn(
        async () => options.bytes ?? new Uint8Array([1, 2, 3, 4]).buffer,
      ),
    },
  } as unknown as App;
}

describe("openMediaSource", () => {
  it("leases a fetchable vault URL and revokes it", async () => {
    const runtime = app({ url: "https://files.example/map.png" });
    const create = vi.spyOn(URL, "createObjectURL");
    const source = await openMediaSource(runtime, file());
    expect(source.url).toBe("https://files.example/map.png");
    expect(runtime.vault.readBinary).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    source.revoke();
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledWith(
      "https://files.example/map.png",
    );
    create.mockRestore();
  });

  it("replaces a non-fetchable vault URL with a typed image blob", async () => {
    const runtime = app({
      url: "memory-vault://panel/Assets/map.png",
    });
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:map");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const source = await openMediaSource(runtime, file());
    expect(source.url).toBe("blob:map");
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledWith(
      "memory-vault://panel/Assets/map.png",
    );
    const blob = create.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect((blob as Blob).type).toBe("image/png");
    source.revoke();
    expect(revoke).toHaveBeenCalledWith("blob:map");
    expect(runtime.vault.revokeResourceUrl).toHaveBeenCalledTimes(1);
    create.mockRestore();
    revoke.mockRestore();
  });

  it("reads the file when the vault cannot issue a URL", async () => {
    const runtime = app({});
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:fallback");
    const source = await openMediaSource(runtime, file());
    expect(source.url).toBe("blob:fallback");
    expect(runtime.vault.readBinary).toHaveBeenCalledWith(file());
    source.revoke();
    create.mockRestore();
  });
});
