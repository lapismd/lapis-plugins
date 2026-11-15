import { expect, it, vi } from "vitest";
import { NativeSyncObserver } from "./native-sync-observer.js";
import type {
  RepositoryNativeSyncSnapshot,
  RepositoryNativeSyncCommand,
} from "./native-sync.js";
import type { SyncState } from "./sync.js";
function fixture() {
  const state: RepositoryNativeSyncSnapshot = {
    revision: 7,
    busy: false,
    phase: "ready",
    enabled: true,
    recovery: false,
  };
  const service = {
    read: vi.fn(async () => ({ ...state })),
    execute: vi.fn(async (_command: RepositoryNativeSyncCommand) => ({
      ...state,
    })),
  };
  const report = vi.fn(),
    recovered = vi.fn();
  const observer = new NativeSyncObserver(service, { report, recovered });
  const values: SyncState[] = [];
  observer.subscribe((s) => values.push(s));
  return { state, service, observer, report, recovered, values };
}
it("fences an older passive read after an explicit native command", async () => {
  const f = fixture();
  await f.observer.refresh();
  let deliver!: (state: RepositoryNativeSyncSnapshot) => void;
  f.service.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        deliver = resolve;
      })
  );
  const reading = f.observer.refresh();
  f.service.execute.mockResolvedValueOnce({
    ...f.state,
    busy: true,
    phase: "publishing",
  });
  await f.observer.run();
  deliver({ ...f.state });
  await reading;
  expect(f.values.at(-1)).toMatchObject({ busy: true, phase: "publishing" });
  expect(f.service.execute.mock.calls).toEqual([
    [{ kind: "run", expected_revision: 7 }],
  ]);
  await f.observer.close();
});
it("observes a lost response and explicitly retries only the retained native apply identity", async () => {
  const f = fixture();
  await f.observer.refresh();
  f.service.execute.mockRejectedValueOnce(
    new Error("Original response was lost")
  );
  f.service.read.mockResolvedValueOnce({
    ...f.state,
    revision: 9,
    phase: "attention",
    recovery: true,
    pendingApply: "retained-native-request",
  });
  await f.observer.run();
  expect(f.service.execute).toHaveBeenCalledOnce();
  expect(
    f.report.mock.calls.some(
      ([error]) => error.message === "Original response was lost"
    )
  ).toBe(true);
  expect(f.values.at(-1)).toMatchObject({ busy: false, recovery: true });
  await f.observer.resume();
  expect(f.service.execute.mock.calls[1]).toEqual([
    {
      kind: "resume_apply",
      expected_revision: 9,
      request_id: "retained-native-request",
    },
  ]);
  await f.observer.close();
});
it("releases local busy state when both command delivery and recovery observation fail", async () => {
  const f = fixture();
  await f.observer.refresh();
  f.service.execute.mockRejectedValueOnce(
    new Error("Original response was lost")
  );
  f.service.read.mockRejectedValueOnce(new Error("Status unavailable"));
  await f.observer.run();
  expect(f.values.at(-1)).toMatchObject({ busy: false, phase: "attention" });
  expect(f.service.execute).toHaveBeenCalledOnce();
  await f.observer.close();
});
it("fences late status delivery and refuses new commands after passive teardown", async () => {
  const f = fixture();
  let deliver!: (state: RepositoryNativeSyncSnapshot) => void;
  f.service.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        deliver = resolve;
      })
  );
  const reading = f.observer.refresh();
  const closing = f.observer.close();
  deliver({ ...f.state, phase: "conflicts" });
  await Promise.all([reading, closing]);
  await f.observer.run();
  expect(f.values).toHaveLength(1);
  expect(f.report).not.toHaveBeenCalled();
  expect(f.service.execute).not.toHaveBeenCalled();
});
