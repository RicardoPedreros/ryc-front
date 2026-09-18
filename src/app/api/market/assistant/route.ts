import { NextRequest, NextResponse } from "next/server";
import { AssistantUseCases, type AssistantHistoryMessage } from "@/application/ai/assistant-use-cases";
import { buildAssistantSystemPrompt } from "@/application/ai/assistant-prompt";
import { createAssistantTools } from "@/application/ai/create-assistant-tools";
import { InventoryUseCases } from "@/application/market/inventory-use-cases";
import { ProductUseCases } from "@/application/market/product-use-cases";
import { createAiProvider } from "@/infrastructure/ai/ai-provider-factory";
import { assistantCooldownStore } from "@/infrastructure/ai/assistant-cooldown-store";
import { NeonInventoryRepository } from "@/infrastructure/market/repositories/neon-inventory-repository";
import { NeonProductRepository } from "@/infrastructure/market/repositories/neon-product-repository";
import { getSessionFromRequest } from "@/infrastructure/auth/session";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;

function cooldownSeconds(): number {
  const parsed = Number(process.env.AI_COOLDOWN_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

function parseHistory(body: unknown): AssistantHistoryMessage[] | null {
  if (typeof body !== "object" || body === null) return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const history: AssistantHistoryMessage[] = [];
  for (const raw of messages.slice(-MAX_MESSAGES)) {
    if (typeof raw !== "object" || raw === null) continue;
    const { role, content } = raw as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    history.push({ role, content: trimmed.slice(0, MAX_CONTENT_LENGTH) });
  }

  return history.length > 0 ? history : null;
}

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const provider = createAiProvider();
  const seconds = cooldownSeconds();
  const cooldown = provider.isFreeModel
    ? await assistantCooldownStore.getStatus(session.id, seconds)
    : { allowed: true, retryAfterSeconds: 0 };

  return NextResponse.json({
    model: { name: provider.name, isFreeModel: provider.isFreeModel },
    cooldown: { cooldownSeconds: provider.isFreeModel ? seconds : 0, ...cooldown },
  });
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let history: AssistantHistoryMessage[] | null;
  try {
    history = parseHistory(await request.json());
  } catch {
    history = null;
  }

  if (!history) {
    return NextResponse.json({ error: "Se requiere al menos un mensaje." }, { status: 400 });
  }

  try {
    const provider = createAiProvider();
    const seconds = cooldownSeconds();

    if (provider.isFreeModel) {
      const status = await assistantCooldownStore.consume(session.id, seconds);
      if (!status.allowed) {
        return NextResponse.json(
          {
            error: `Estás usando el modelo gratuito. Espera ${status.retryAfterSeconds}s antes de escribir de nuevo.`,
            cooldown: { cooldownSeconds: seconds, retryAfterSeconds: status.retryAfterSeconds },
            model: { name: provider.name, isFreeModel: true },
          },
          { status: 429 },
        );
      }
    }

    const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());
    const productUseCases = new ProductUseCases(new NeonProductRepository());
    const tools = createAssistantTools({ inventoryUseCases, productUseCases });
    const assistant = new AssistantUseCases(provider, tools, buildAssistantSystemPrompt());

    const result = await assistant.reply(history, {
      userId: session.id,
      roleCode: session.roleCode,
    });

    return NextResponse.json({
      ...result,
      model: { name: provider.name, isFreeModel: provider.isFreeModel },
      cooldown: provider.isFreeModel ? { cooldownSeconds: seconds, retryAfterSeconds: seconds } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
