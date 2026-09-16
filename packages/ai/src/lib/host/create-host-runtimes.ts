import { hasNativeDesktopCapability } from "@lapis-notes/api/desktop-native";
import type { AgentRuntime } from "../core/types";
import { ControllerAgentRuntime } from "./controller-runtime";
import type { ControllerConnectionPool } from "./controller-connection";
import { hostLiveRuntimesEnabled } from "./host-runtime-availability";
export function createHostAgentRuntimes(
  connections: ControllerConnectionPool
): AgentRuntime[] {
  if (!hostLiveRuntimesEnabled(hasNativeDesktopCapability)) return [];
  return [
    new ControllerAgentRuntime("acp", connections),
    new ControllerAgentRuntime("codex-native", connections),
  ];
}
