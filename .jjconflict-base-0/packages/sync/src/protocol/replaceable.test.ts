import { describe, expect, it } from "vitest";
import {
  compareReplaceableEvents,
  replaceableEventAddress,
} from "../engine.js";
import type { SignedNostrEvent } from "../engine.js";
const head = (
  id: string,
  timestamp: number,
  d = "vault:head:device",
): SignedNostrEvent => ({
  id,
  pubkey: "outer",
  created_at: timestamp,
  kind: 30078,
  tags: [["d", d]],
  content: "ciphertext",
  sig: "signature",
});
describe("replaceable event ordering", () => {
  it("orders latest first, breaking ties with lowest lexical ID", () => {
    expect(
      [head("c", 10), head("b", 11), head("a", 11)]
        .sort(compareReplaceableEvents)
        .map((e) => e.id),
    ).toEqual(["a", "b", "c"]);
  });
  it("keeps device addresses separate under a shared outer identity", () => {
    expect(replaceableEventAddress(head("a", 10))).not.toBe(
      replaceableEventAddress(head("b", 10, "vault:head:phone")),
    );
  });
  it("refuses comparisons between different addresses", () => {
    expect(() =>
      compareReplaceableEvents(head("a", 10), head("b", 10, "other")),
    ).toThrow(/address/i);
    expect(() =>
      compareReplaceableEvents(head("a", 10), {
        ...head("b", 10),
        pubkey: "other",
      }),
    ).toThrow(/address/i);
    expect(() =>
      compareReplaceableEvents(head("a", 10), {
        ...head("b", 10),
        kind: 30079,
      }),
    ).toThrow(/address/i);
  });
  it("uses the first d tag and refuses immutable revisions", () => {
    expect(
      replaceableEventAddress({
        ...head("a", 10),
        tags: [
          ["d", "first"],
          ["d", "second"],
        ],
      }),
    ).toBe(JSON.stringify([30078, "outer", "first"]));
    expect(() =>
      replaceableEventAddress({ ...head("a", 10), kind: 78 }),
    ).toThrow(/replaceable/i);
  });
});
