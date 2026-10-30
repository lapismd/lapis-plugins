// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { watchSheetTheme } from "./sheet-theme";

describe("watchSheetTheme", () => {
  it("notifies when an ancestor switches to the dark theme", async () => {
    const node = document.createElement("div");
    document.body.append(node);
    const seen: string[] = [];
    const stop = watchSheetTheme(node, () => {
      seen.push(document.documentElement.className);
    });

    document.documentElement.classList.add("dark");
    await Promise.resolve();
    expect(seen).toEqual(["dark"]);

    stop();
    document.documentElement.classList.remove("dark");
    await Promise.resolve();
    expect(seen).toEqual(["dark"]);
    node.remove();
  });
});
