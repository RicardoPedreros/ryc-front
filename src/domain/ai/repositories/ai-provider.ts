import type { ChatMessage, ToolInvocation } from "../entities/chat";
import type { ToolDefinition } from "../entities/tool";

export interface AiCompletionRequest {
  readonly messages: readonly ChatMessage[];
  readonly tools: readonly ToolDefinition[];
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface AiCompletionResult {
  readonly content: string | null;
  readonly toolCalls: readonly ToolInvocation[];
  readonly finishReason: string;
}

export interface IAiProvider {
  readonly name: string;
  readonly isFreeModel: boolean;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}
