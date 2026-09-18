import type { AssistantBlock } from "@/domain/ai/entities/assistant-blocks";
import type { ChatMessage } from "@/domain/ai/entities/chat";
import type { IAiProvider } from "@/domain/ai/repositories/ai-provider";
import type { AssistantTool, AssistantToolContext, AssistantToolExecution } from "./assistant-tool";
import { parseArguments } from "./tool-arguments";

const MAX_STEPS = 6;
const MAX_BLOCKS = 3;
const FALLBACK_REPLY =
  "No pude completar la respuesta. Prueba reformular la pregunta o inténtalo de nuevo en un momento.";

export interface AssistantHistoryMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface AssistantReply {
  readonly reply: string;
  readonly blocks: readonly AssistantBlock[];
}

export class AssistantUseCases {
  constructor(
    private readonly provider: IAiProvider,
    private readonly tools: readonly AssistantTool[],
    private readonly systemPrompt: string,
  ) {}

  async reply(
    history: readonly AssistantHistoryMessage[],
    context: AssistantToolContext,
  ): Promise<AssistantReply> {
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      ...history.map(toChatMessage),
    ];
    const blocks: AssistantBlock[] = [];
    let reply: string | null = null;

    for (let step = 0; step < MAX_STEPS; step += 1) {
      const result = await this.provider.complete({
        messages,
        tools: this.tools.map((tool) => tool.definition),
      });

      if (result.toolCalls.length === 0) {
        reply = result.content;
        break;
      }

      messages.push({
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCalls,
      });

      for (const call of result.toolCalls) {
        const execution = await this.executeTool(call.name, call.argumentsJson, context);
        if (execution.block && blocks.length < MAX_BLOCKS) {
          blocks.push(execution.block);
        }
        messages.push({
          role: "tool",
          toolCallId: call.id,
          name: call.name,
          content: JSON.stringify(execution.result),
        });
      }
    }

    return { reply: reply ?? FALLBACK_REPLY, blocks };
  }

  private findTool(name: string): AssistantTool | undefined {
    return this.tools.find((tool) => tool.definition.name === name);
  }

  private async executeTool(
    name: string,
    argumentsJson: string,
    context: AssistantToolContext,
  ): Promise<AssistantToolExecution> {
    const tool = this.findTool(name);
    if (!tool) {
      return { result: { error: `Herramienta desconocida: ${name}` } };
    }

    try {
      return await tool.execute(parseArguments(argumentsJson), context);
    } catch (error) {
      return {
        result: {
          error: error instanceof Error ? error.message : "Error al ejecutar la herramienta",
        },
      };
    }
  }
}

function toChatMessage(message: AssistantHistoryMessage): ChatMessage {
  return message.role === "user"
    ? { role: "user", content: message.content }
    : { role: "assistant", content: message.content, toolCalls: [] };
}
