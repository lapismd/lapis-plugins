import test from "node:test";
import assert from "node:assert/strict";
import { HistoryIndexController } from "../../src/lib/repository/controllers/history-index-controller.ts";
const status = (complete, generation = 1) => ({
  complete,
  generation,
  indexed: generation,
  omitted: 0,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { resolve, promise };
};

test("history observation never schedules index batches and drains only its own read", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = deferred();
  const calls = [];
  const states = [];
  const controller = new HistoryIndexController(
    {
      start: async () => {
        calls.push("start");
        return status(false);
      },
      status: async () => {
        calls.push("status");
        return pending.promise;
      },
      step: async () => {
        calls.push("step");
        throw Error("Renderer cannot schedule native batches");
      },
      stop: async () => {
        calls.push("stop");
      },
    },
    {
      report(error) {
        throw error;
      },
      recovered() {},
    },
  );
  controller.subscribe((state) => states.push(state));
  controller.start();
  controller.start();
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start"]);
  assert.equal(states.at(-1).busy, true);
  context.mock.timers.tick(1000);
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start", "status"]);
  let closed = false;
  const close = controller.close().then(() => (closed = true));
  await Promise.resolve();
  assert.equal(closed, false);
  pending.resolve(status(true));
  await close;
  context.mock.timers.tick(60_000);
  assert.deepEqual(calls, ["start", "status"]);
  assert.equal(states.at(-1).busy, true, "No stale completion after disposal");
});

test("failed History observations recover from cached status without restarting the owner", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const calls = [];
  const failures = [];
  let recovered = 0;
  let latest;
  const controller = new HistoryIndexController(
    {
      async start() {
        calls.push("start");
        throw Error("History worker paused");
      },
      async status() {
        calls.push("status");
        return status(true, 2);
      },
    },
    {
      report(error) {
        failures.push(String(error));
      },
      recovered() {
        recovered++;
      },
    },
  );
  controller.subscribe((state) => (latest = state));
  controller.start();
  await new Promise(setImmediate);
  assert.equal(latest.phase, "paused");
  assert.deepEqual(failures, ["Error: History worker paused"]);
  context.mock.timers.tick(1000);
  await new Promise(setImmediate);
  assert.deepEqual(calls, ["start", "status"]);
  assert.equal(latest.phase, "ready");
  assert.equal(latest.status.generation, 2);
  assert.equal(recovered, 1);
  await controller.close();
});
