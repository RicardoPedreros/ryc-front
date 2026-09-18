import type { ChatMessage } from "@/domain/ai/entities/chat";
import type { ToolDefinition } from "@/domain/ai/entities/tool";
import type { IAiProvider, AiCompletionRequest, AiCompletionResult } from "@/domain/ai/repositories/ai-provider";

export interface OpenAiCompatibleConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl: string;
  readonly isFreeModel?: boolean;
}

interface OpenAiToolCall {
  readonly id: string;
  readonly type: string;
  readonly function: {
    readonly name: string;
    readonly arguments: string;
  };
  readonly extra_content?: {
    readonly google?: { readonly thought_signature?: string };
    readonly vertex?: { readonly thought_signature?: string };
  };
}

function getThoughtSignature(call: OpenAiToolCall): string | undefined {
  return (
    call.extra_content?.google?.thought_signature ??
    call.extra_content?.vertex?.thought_signature
  );
}

interface OpenAiAssistantMessage {
  readonly role: "assistant";
  readonly content: string | null;
  readonly tool_calls?: readonly OpenAiToolCall[];
}

interface OpenAiToolMessage {
  readonly role: "tool";
  readonly tool_call_id: string;
  readonly content: string;
}

interface OpenAiSystemMessage {
  readonly role: "system";
  readonly content: string;
}

interface OpenAiUserMessage {
  readonly role: "user";
  readonly content: string;
}

type OpenAiRequestMessage =
  | OpenAiSystemMessage
  | OpenAiUserMessage
  | OpenAiAssistantMessage
  | OpenAiToolMessage;

interface OpenAiToolPayload {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: ToolDefinition["parameters"];
  };
}

interface OpenAiResponseMessage {
  readonly content: string | null;
  readonly tool_calls?: readonly OpenAiToolCall[];
}

interface OpenAiChoice {
  readonly message: OpenAiResponseMessage;
  readonly finish_reason: string;
}

interface OpenAiResponse {
  readonly choices?: readonly OpenAiChoice[];
  readonly error?: { readonly message: string };
}

function toRequestMessage(message: ChatMessage): OpenAiRequestMessage {
  switch (message.role) {
    case "system":
      return { role: "system", content: message.content };
    case "user":
      return { role: "user", content: message.content };
    case "assistant":
      return {
        role: "assistant",
        content: message.content,
        ...(message.toolCalls.length > 0
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: "function",
                function: { name: call.name, arguments: call.argumentsJson },
                ...(call.thoughtSignature
                  ? {
                      extra_content: {
                        google: { thought_signature: call.thoughtSignature },
                      },
                    }
                  : {}),
              })),
            }
          : {}),
      };
    case "tool":
      return {
        role: "tool",
        tool_call_id: message.toolCallId,
        content: message.content,
      };
  }
}

function toToolPayload(tool: ToolDefinition): OpenAiToolPayload {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

export class OpenAiCompatibleAiProvider implements IAiProvider {
  readonly name = "openai";
  readonly isFreeModel: boolean;

  constructor(private readonly config: OpenAiCompatibleConfig) {
    this.isFreeModel = config.isFreeModel === true;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages.map(toRequestMessage),
        tools: request.tools.map(toToolPayload),
        tool_choice: "auto",
        ...(request.temperature != null ? { temperature: request.temperature } : {}),
        ...(request.maxTokens != null ? { max_tokens: request.maxTokens } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AI provider request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as OpenAiResponse;
    if (payload.error) {
      throw new Error(`AI provider error: ${payload.error.message}`);
    }

    const choice = payload.choices?.[0];
    if (!choice) {
      throw new Error("AI provider returned no choices");
    }

    return {
      content: choice.message.content,
      finishReason: choice.finish_reason,
      toolCalls: (choice.message.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function.name,
        argumentsJson: call.function.arguments,
        thoughtSignature: getThoughtSignature(call),
      })),
    };
  }
}
