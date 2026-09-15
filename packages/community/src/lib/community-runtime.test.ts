import { describe, expect, it } from "vitest";

import {
  communityRelayHttpOrigin,
  createCommunityPluginProjectsOptions,
} from "./community-runtime";

describe("community plugin runtime options", () => {
  it("maps relay URLs to HTTP auth origins", () => {
    expect(communityRelayHttpOrigin("ws://local-community.lapis.md/")).toBe(
      "http://local-community.lapis.md"
    );
    expect(communityRelayHttpOrigin("wss://community.lapis.md/nostr")).toBe(
      "https://community.lapis.md"
    );
  });

  it("enables the Projects data source for the selected relay", () => {
    const options = createCommunityPluginProjectsOptions(
      "ws://local-community.lapis.md/"
    );

    expect(options.relayUrl).toBe("ws://local-community.lapis.md/");
    expect(options.httpBaseUrl).toBe("http://local-community.lapis.md");
    expect(options.source).toHaveProperty("open");
  });
});
