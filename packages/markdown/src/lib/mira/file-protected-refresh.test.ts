import { expect, it, vi } from "vitest";
import { nativeFixture } from "./file-editing.test.fixture";

it("reconciles protected native saved bytes through the existing Mira text lease", async () => {
  const f = nativeFixture();
  const target = f.bind();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  await f.app.fileEditingSessions.guard("note.md", async () => {
    expect(target.session.text!.state.readonly).toBe(true);
    f.external("native saved");
  });
  expect(target.session.text!.state).toMatchObject({
    value: "native saved",
    persistedValue: "native saved",
    dirty: false,
    readonly: false,
  });
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  expect(f.modify).not.toHaveBeenCalled();
  target.edit("subsequent local draft");
  await target.session.flush();
  expect(f.conditionalWrite).toHaveBeenCalledExactlyOnceWith(
    f.file,
    "subsequent local draft",
    "native saved"
  );
  target.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
  expect(f.state()).toBeUndefined();
});

it("keeps failed Mira refresh protected until explicit reconciliation without replay", async () => {
  const f = nativeFixture();
  const target = f.bind();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  vi.mocked(target.session.text!.protectRecovery).mockRejectedValueOnce(
    new Error("Saved refresh failed")
  );
  const mutate = vi.fn(async () => f.external("native saved"));
  await expect(
    f.app.fileEditingSessions.guard("note.md", mutate)
  ).rejects.toThrow("Saved refresh failed");
  expect(target.session.text!.state.readonly).toBe(true);
  expect(f.state()).toMatchObject({ active: true, generation: 2 });
  await f.app.fileEditingSessions.guard("note.md", async () => {});
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(target.session.text!.state).toMatchObject({
    value: "native saved",
    persistedValue: "native saved",
    dirty: false,
    readonly: false,
  });
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  target.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
});

it("retains expected absence and the clean buffer after a managed delete", async () => {
  const f = nativeFixture();
  const target = f.bind();
  f.admit();
  await vi.waitFor(() =>
    expect(target.session.text!.state.readonly).toBe(false)
  );
  await f.app.fileEditingSessions.guard("note.md", async () =>
    f.external(null)
  );
  expect(target.session.text!.state).toMatchObject({
    value: "original",
    persistedValue: "original",
    dirty: false,
    readonly: false,
  });
  expect(f.conditionalWrite).not.toHaveBeenCalled();
  target.binding.release();
  await f.app.fileEditingSessions.afterMutations(async () => {});
  expect(f.state()).toBeUndefined();
  expect(f.disk()).toBeNull();
});
