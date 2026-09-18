import type { ChatMessage, ToolInvocation, ToolResultMessage } from "@/domain/ai/entities/chat";
import type { IAiProvider, AiCompletionRequest, AiCompletionResult } from "@/domain/ai/repositories/ai-provider";

const RECIPE_PATTERN = /receta|cocinar|cocin|comer|almuerz|cenar|cena|desayun|prepar|ingrediente|plato/i;
const EXPIRY_PATTERN = /vence|vencimient|vencid|tirar|pronto|caduc/i;
const STOCK_PATTERN = /stock|inventario|ten[eé]s|hay|producto/i;

function isToolResult(message: ChatMessage): message is ToolResultMessage {
  return message.role === "tool";
}

function lastUserText(messages: readonly ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "user") return message.content;
  }
  return "";
}

function invocation(name: string, args: Readonly<Record<string, unknown>>, seed: number): ToolInvocation {
  return {
    id: `mock-call-${seed}`,
    name,
    argumentsJson: JSON.stringify(args),
  };
}

function completion(toolCalls: readonly ToolInvocation[], content: string | null = null): AiCompletionResult {
  return {
    content,
    toolCalls,
    finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
  };
}

const SAMPLE_RECIPE_ARGS: Readonly<Record<string, unknown>> = {
  title: "Pollo al verdeo con arroz",
  minutes: 35,
  servings: 4,
  ingredients: [
    { name: "Pechuga de pollo", quantity: "500 g", available: true },
    { name: "Puerro", quantity: "2 unidades", available: true },
    { name: "Arroz", quantity: "1 kg", available: true },
    { name: "Verduras de hoja verde", quantity: "a gusto", available: false },
  ],
  steps: [
    "Rehogar el puerro en la sartén con un poco de aceite.",
    "Agregar la pechuga cortada y cocinar hasta dorar.",
    "Sumar el arroz y caldo, cocinar 18 minutos.",
    "Terminar con las verduras de hoja verde y servir.",
  ],
};

export class MockAiProvider implements IAiProvider {
  readonly name = "mock";

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const text = lastUserText(request.messages);
    const calledTools = new Set(
      request.messages.filter(isToolResult).map((message) => message.name),
    );
    const seed = request.messages.length;

    if (RECIPE_PATTERN.test(text)) {
      if (!calledTools.has("get_stock")) {
        return completion([invocation("get_stock", {}, seed)]);
      }
      if (!calledTools.has("propose_recipe")) {
        return completion([invocation("propose_recipe", SAMPLE_RECIPE_ARGS, seed + 1)]);
      }
      return completion(
        [],
        "Con lo que tienes en el inventario te propongo esta receta. Solo falta un detalle para completarla.",
      );
    }

    if (EXPIRY_PATTERN.test(text)) {
      if (!calledTools.has("get_expiring_products")) {
        return completion([invocation("get_expiring_products", { days: 7 }, seed)]);
      }
      return completion(
        [],
        "Estos son los productos que conviene usar pronto para no tirar nada.",
      );
    }

    if (STOCK_PATTERN.test(text)) {
      if (!calledTools.has("get_stock")) {
        return completion([invocation("get_stock", {}, seed)]);
      }
      return completion([], "Este es el stock actual de tu inventario.");
    }

    if (calledTools.size === 0) {
      return completion([invocation("get_stock", {}, seed)]);
    }

    return completion(
      [],
      "Soy el asistente en modo local (sin proveedor de IA configurado). Puedo consultar tu inventario y armar recetas con lo que tienes.",
    );
  }
}
