import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveTurboConcurrency,
  resolveWorkerLimit,
  runBoundedWorkers,
} from "./lib/concurrency.mjs";

test("Turbo defaults to half the processors capped at four", () => {
  assert.equal(resolveTurboConcurrency({}, 1), "1");
  assert.equal(resolveTurboConcurrency({}, 6), "3");
  assert.equal(resolveTurboConcurrency({}, 32), "4");
});

test("Turbo accepts numeric and percentage overrides", () => {
  assert.equal(resolveTurboConcurrency({ TURBO_CONCURRENCY: "2" }, 32), "2");
  assert.equal(resolveTurboConcurrency({ TURBO_CONCURRENCY: "50%" }, 32), "50%");
  assert.throws(
    () => resolveTurboConcurrency({ TURBO_CONCURRENCY: "0" }, 4),
    /positive integer/,
  );
});

test("worker overrides cannot exceed the deterministic maximum", () => {
  assert.equal(resolveWorkerLimit("WORKERS", 4, {}), 4);
  assert.equal(resolveWorkerLimit("WORKERS", 4, { WORKERS: "2" }), 2);
  assert.equal(resolveWorkerLimit("WORKERS", 4, { WORKERS: "20" }), 4);
});

test("bounded workers retain input order despite completion order", async () => {
  const results = await runBoundedWorkers([3, 1, 2], 3, async (value) => {
    await new Promise((resolve) => setTimeout(resolve, value));
    return value * 2;
  });
  assert.deepEqual(results, [6, 2, 4]);
});

test("bounded workers stop scheduling queued work after failure", async () => {
  const started = [];
  await assert.rejects(
    runBoundedWorkers([0, 1, 2, 3], 2, async (value) => {
      started.push(value);
      if (value === 0) throw new Error("failed worker");
      await new Promise((resolve) => setTimeout(resolve, 5));
      return value;
    }),
    /failed worker/,
  );
  assert.deepEqual(started.sort(), [0, 1]);
});
