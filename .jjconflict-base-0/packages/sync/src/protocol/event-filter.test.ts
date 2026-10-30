import { describe, expect, it } from "vitest";
import {
  matchesEventFilter,
  matchesEventFilters,
  validateEventFilter,
} from "../engine.js";
import type { NostrEventFilter, SignedNostrEvent } from "../engine.js";
const event: SignedNostrEvent = {
  id: "a".repeat(64),
  pubkey: "b".repeat(64),
  created_at: 10,
  kind: 78,
  tags: [
    ["d", "first"],
    ["d", "second"],
    ["p", "device"],
    ["p", "other"],
    ["v", "vault"],
  ],
  content: "ciphertext",
  sig: "c".repeat(128),
};
describe("Nostr sync event filters", () => {
  it.each<[NostrEventFilter, boolean]>([
    [{}, true],
    [{ ids: [event.id] }, true],
    [{ ids: ["a"] }, false],
    [{ authors: [event.pubkey] }, true],
    [{ authors: ["b"] }, false],
    [{ kinds: [78, 30078] }, true],
    [{ kinds: [30079] }, false],
    [{ "#d": ["first"] }, true],
    [{ "#d": ["second"] }, false],
    [{ "#p": ["other"] }, true],
    [{ "#p": ["missing"] }, false],
    [{ "#v": ["vault"] }, true],
    [{ since: 10 }, true],
    [{ since: 11 }, false],
    [{ kinds: [78], "#v": ["vault"], since: 9 }, true],
    [{ kinds: [78], "#v": ["missing"] }, false],
    [{ ids: [] }, false],
    [{ authors: [] }, false],
    [{ kinds: [] }, false],
    [{ "#d": [] }, false],
    [{ "#p": [] }, false],
    [{ "#v": [] }, false],
  ])("matches %j as %s", (filter, expected) =>
    expect(matchesEventFilter(event, filter)).toBe(expected),
  );
  it("combines filters with OR, and matches no filters as nothing", () => {
    expect(
      matchesEventFilters(event, [{ kinds: [30079] }, { "#v": ["vault"] }]),
    ).toBe(true);
    expect(matchesEventFilters(event, [])).toBe(false);
    expect(() =>
      matchesEventFilters(event, [{}, { until: 20 } as NostrEventFilter]),
    ).toThrow(/unsupported/i);
  });
  it("rejects unknown fields rather than widening the request", () => {
    expect(() => validateEventFilter({ "#f": ["file"] })).toThrow(
      /unsupported/i,
    );
    expect(() => validateEventFilter({ until: 20 })).toThrow(/unsupported/i);
    expect(() =>
      matchesEventFilter(event, { limit: 1 } as NostrEventFilter),
    ).toThrow(/unsupported/i);
  });
  it.each([
    null,
    [],
    { since: -1 },
    { since: 1.5 },
    { since: NaN },
    { since: Infinity },
    { ids: "bad" },
    { "#d": [1] },
    { kinds: ["78"] },
    { kinds: [-1] },
  ])("rejects malformed input %j", (filter) =>
    expect(() => validateEventFilter(filter)).toThrow(),
  );
  it("filters outer authors rather than a device key in content", () => {
    expect(
      matchesEventFilter(
        {
          ...event,
          content: JSON.stringify({ deviceEvent: { pubkey: "device" } }),
        },
        { authors: ["device"] },
      ),
    ).toBe(false);
  });
});
