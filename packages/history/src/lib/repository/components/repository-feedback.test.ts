import type { App } from "@lapis-notes/api";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyRepositoryIdentifier,
  repositoryFeedback,
} from "./repository-feedback";

const host = vi.hoisted(() => ({ dismiss: vi.fn() }));
vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => ({
    controller: { notifications: { dismiss: host.dismiss } },
  }),
}));

function fixture() {
  const notifications = {
    notify: vi.fn(),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  const app = { workspace: {}, notifications } as unknown as App;
  return { app, notifications };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("transient repository feedback", () => {
  it("does not write notification history during repeated healthy observations", () => {
    const { app, notifications } = fixture();
    const feedback = repositoryFeedback(
      app,
      "History index",
      "history-search-index"
    );
    for (let poll = 0; poll < 20; poll++) feedback.recovered();
    expect(notifications.clear).not.toHaveBeenCalled();
    expect(notifications.notify).not.toHaveBeenCalled();
    expect(host.dismiss).toHaveBeenCalledWith("history-search-index");
  });

  it("dismisses a reported transient failure without clearing persisted records", () => {
    const { app, notifications } = fixture();
    const feedback = repositoryFeedback(
      app,
      "History index",
      "history-search-index"
    );
    feedback.report(new Error("Status temporarily unavailable"));
    feedback.recovered();
    expect(notifications.notify).toHaveBeenCalledWith({
      id: "history-search-index",
      title: "History index",
      message: "Status temporarily unavailable",
      source: "repository-history",
      severity: "error",
      persist: false,
    });
    expect(host.dismiss).toHaveBeenCalledWith("history-search-index");
    expect(notifications.clear).not.toHaveBeenCalled();
  });

  it("copies an identifier without writing notification history", async () => {
    const { app, notifications } = fixture();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await copyRepositoryIdentifier(app, "commit-123");
    expect(writeText).toHaveBeenCalledWith("commit-123");
    expect(host.dismiss).toHaveBeenCalledWith("repository-copy:commit-123");
    expect(notifications.clear).not.toHaveBeenCalled();
  });
});
