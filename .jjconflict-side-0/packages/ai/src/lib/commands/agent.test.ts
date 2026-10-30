import { describe, expect, it } from "vitest";
import { composerAgentLabel, parseAgentCommand } from "./agent";

describe("OpenCode harness selection", () => {
  it("keeps ACP and Native as distinct composer choices", () => {
    expect(parseAgentCommand("opencode-acp")).toMatchObject({
      agent: "opencode", runtimePreference: "acp", label: "OpenCode ACP",
    });
    expect(parseAgentCommand("opencode-native")).toMatchObject({
      agent: "opencode", runtimePreference: "opencode-native", label: "OpenCode Native",
    });
    expect(composerAgentLabel("opencode", "acp")).toBe("OpenCode ACP");
    expect(composerAgentLabel("opencode", "opencode-native")).toBe("OpenCode Native");
  });
});
