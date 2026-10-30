import { expect, it } from "vitest";
import type { App } from "@lapis-notes/api";
import {
  bindReplacementGuardObserver,
  bindTranscriptWriters,
  guardTranscriptReplacement,
} from "./transcript-writers.js";

it("enters the host observer only within acquired protection and releases after effects", async () => {
  const calls: string[] = [];
  const app = {
    fileEditingSessions: {
      guard: async (_path: unknown, apply: () => Promise<unknown>) => {
        calls.push("protected");
        try {
          return await apply();
        } finally {
          calls.push("unprotected");
        }
      },
    },
  } as unknown as App;
  const dispose = bindReplacementGuardObserver(app, (path) => {
    calls.push(`entered:${path}`);
    return () => {
      calls.push("left");
    };
  });
  expect(
    await guardTranscriptReplacement(app, "Note.md", async () => {
      calls.push("effect");
      return 42;
    })
  ).toBe(42);
  expect(calls).toEqual([
    "protected",
    "entered:Note.md",
    "effect",
    "left",
    "unprotected",
  ]);
  dispose();
});

it("preserves AI writer protection and releases observers when an effect rejects", async () => {
  const app = {} as App;
  const calls: string[] = [];
  const writers = bindTranscriptWriters(app, async (_path, apply) => {
    calls.push("AI protected");
    return apply();
  });
  const observer = bindReplacementGuardObserver(app, () => {
    calls.push("entered");
    return () => {
      calls.push("left");
    };
  });
  await expect(
    guardTranscriptReplacement(app, undefined, async () => {
      throw new Error("Native refusal");
    })
  ).rejects.toThrow("Native refusal");
  expect(calls).toEqual(["AI protected", "entered", "left"]);
  observer();
  writers();
});

it("keeps leases App-owned and prevents an old disposer from removing a new observer", async () => {
  const first = {} as App,
    second = {} as App;
  let entries = 0;
  const callback = () => {
    entries++;
    return () => {};
  };
  const old = bindReplacementGuardObserver(first, callback);
  expect(() => bindReplacementGuardObserver(first, callback)).toThrow(
    "already bound"
  );
  old();
  const current = bindReplacementGuardObserver(first, callback);
  old();
  const firstWriter = bindTranscriptWriters(first, (_path, apply) => apply());
  const secondWriter = bindTranscriptWriters(second, (_path, apply) => apply());
  await guardTranscriptReplacement(second, undefined, async () => {});
  expect(entries).toBe(0);
  await guardTranscriptReplacement(first, undefined, async () => {});
  expect(entries).toBe(1);
  current();
  firstWriter();
  secondWriter();
});
