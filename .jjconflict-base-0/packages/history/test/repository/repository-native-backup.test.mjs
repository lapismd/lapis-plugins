import test from "node:test";
import assert from "node:assert/strict";
import { RepositoryBackup } from "../../src/lib/repository/components/repository-backup.ts";

function fixture(native = true, enabled = true) {
  let data = {
    automaticBackup: enabled,
    showWorkingCopyStatus: false,
    other: "retained",
  };
  let selected = enabled;
  const selections = [],
    observations = [];
  const service = {
    async start(_changed) {
      observations.push("start");
      return {
        phase: selected ? "ready" : "closed",
        checkpoint: null,
        error: null,
      };
    },
    async capture() {
      return { phase: "ready", checkpoint: null, error: null };
    },
    async stop() {
      observations.push("stop");
      if (!native) selected = false;
    },
    ...(native
      ? {
          async setEnabled(value) {
            selections.push(value);
            selected = value;
            data = { ...data, automaticBackup: value };
          },
        }
      : {}),
  };
  const plugin = {
    app: {
      notifications: {
        createProgress() {
          return { report() {}, complete() {}, fail() {} };
        },
      },
    },
    id: "repository-history",
    loadData: async () => structuredClone(data),
    report() {},
    feedback() {
      return { report() {}, recovered() {} };
    },
  };
  const backup = new RepositoryBackup(plugin, { backup: service, reader: {} });
  return {
    backup,
    service,
    selections,
    observations,
    get selected() {
      return selected;
    },
    get data() {
      return data;
    },
  };
}

test("explicit native selection persists the setting separately from observation", async () => {
  const f = fixture();
  await f.backup.start();
  await f.backup.setEnabled(false);
  assert.deepEqual(f.selections, [false]);
  assert.equal(f.selected, false);
  assert.deepEqual(f.data, {
    automaticBackup: false,
    showWorkingCopyStatus: false,
    other: "retained",
  });
  await f.backup.close();
});

test("native view leave and close dispose only observation", async () => {
  const f = fixture();
  await f.backup.start();
  await f.backup.prepareLeave();
  await f.backup.resumeLeave();
  await f.backup.close();
  assert.deepEqual(f.selections, []);
  assert.equal(f.selected, true);
  assert.deepEqual(f.observations, ["start", "stop", "start", "stop"]);
});

test("native saved false startup does not select or initialize capture", async () => {
  const f = fixture(true, false);
  await f.backup.start();
  await f.backup.close();
  assert.deepEqual(f.selections, []);
  assert.deepEqual(f.observations, []);
  assert.equal(f.backup.enabled, false);
});

test("lost native selection acknowledgement reconciles saved state without another selection", async () => {
  const f = fixture();
  const apply = f.service.setEnabled;
  f.service.setEnabled = async (value) => {
    await apply(value);
    throw new Error("acknowledgement lost");
  };
  await f.backup.start();
  await assert.rejects(f.backup.setEnabled(false), /acknowledgement lost/);
  assert.equal(f.backup.enabled, false);
  await f.backup.reconcile(false);
  assert.deepEqual(f.selections, [false]);
  assert.equal(f.selected, false);
  await f.backup.close();
});

test("legacy backup services keep their existing explicit stop behavior", async () => {
  const f = fixture(false);
  await f.backup.start();
  await f.backup.setEnabled(false);
  assert.equal(f.selected, false);
  assert.deepEqual(f.observations, ["start", "stop"]);
  await f.backup.close();
});
