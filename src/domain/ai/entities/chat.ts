export interface SystemMessage {
  readonly role: "system";
  readonly content: string;
}

export interface UserMessage {
  readonly role: "user";
  readonly content: string;
}

export interface ToolInvocation {
  readonly id: string;
  readonly name: string;
  readonly argumentsJson: string;
  readonly thoughtSignature?: string;
}

export interface AssistantMessage {
  readonly role: "assistant";
  readonly content: string | null;
  readonly toolCalls: readonly ToolInvocation[];
}

export interface ToolResultMessage {
  readonly role: "tool";
  readonly toolCallId: string;
  readonly name: string;
  readonly content: string;
}

export type ChatMessage =
  | SystemMessage
  | UserMessage
  | AssistantMessage
  | ToolResultMessage;
