import type { AssistantBlock } from "@/domain/ai/entities/assistant-blocks";
import type { ToolDefinition } from "@/domain/ai/entities/tool";

export interface AssistantToolContext {
  readonly userId: string | null;
  readonly roleCode: string | null;
}

export interface AssistantToolExecution {
  readonly result: unknown;
  readonly block?: AssistantBlock;
}

export interface AssistantTool {
  readonly definition: ToolDefinition;
  execute(
    args: Readonly<Record<string, unknown>>,
    context: AssistantToolContext,
  ): Promise<AssistantToolExecution>;
}
