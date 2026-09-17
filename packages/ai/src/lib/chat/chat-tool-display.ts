import {
  isOneLineToolAlert,
  presentToolPayload,
  toolCallTarget,
} from "@lapismd/design-core/ai/chat";
import type { AiChatItem } from "./chat-items";

export type AiChatToolItem = Extract<AiChatItem, { type: "tool" }>;

export {
  isOneLineToolAlert as isOneLineAlert,
  presentToolPayload,
  toolCallTarget,
};

export function toolCallStatus(
  state: AiChatToolItem["state"]
): "complete" | "error" | "running" {
  if (state === "completed") return "complete";
  if (state === "error") return "error";
  return "running";
}
