import type { IAiProvider } from "@/domain/ai/repositories/ai-provider";
import type { AssistantCooldownStore } from "@/domain/ai/repositories/assistant-cooldown-store";
import { AssistantUseCases, type AssistantHistoryMessage, type AssistantReply } from "@/application/ai/assistant-use-cases";
import { buildAssistantSystemPrompt } from "@/application/ai/assistant-prompt";
import { createAssistantTools } from "@/application/ai/create-assistant-tools";
import { InventoryUseCases } from "@/application/market/inventory-use-cases";
import { ProductUseCases } from "@/application/market/product-use-cases";
import { NeonInventoryRepository } from "@/infrastructure/market/repositories/neon-inventory-repository";
import { NeonProductRepository } from "@/infrastructure/market/repositories/neon-product-repository";
import { createAiProvider } from "./ai-provider-factory";
import { assistantCooldownStore } from "./assistant-cooldown-store";

export interface AssistantModelInfo {
  readonly name: string;
  readonly isFreeModel: boolean;
}

export interface AssistantCooldownInfo {
  readonly cooldownSeconds: number;
  readonly retryAfterSeconds: number;
  readonly allowed: boolean;
}

export interface AssistantSessionStatus {
  readonly model: AssistantModelInfo;
  readonly cooldown: AssistantCooldownInfo | null;
}

export interface AssistantServiceReply extends AssistantReply {
  readonly model: AssistantModelInfo;
  readonly cooldown: AssistantCooldownInfo | null;
}

/** Identidad autenticada en backend: la route la resuelve desde la sesión, nunca del cliente. */
export interface AssistantAuthenticatedContext {
  readonly userId: string;
  readonly roleCode: string;
}

export interface AssistantServiceDependencies {
  readonly provider: IAiProvider;
  readonly cooldownStore: AssistantCooldownStore;
  readonly cooldownSeconds: number;
  readonly useCases: AssistantUseCases;
}

export class AssistantCooldownError extends Error {
  constructor(
    readonly cooldown: AssistantCooldownInfo,
    readonly model: AssistantModelInfo,
  ) {
    super(
      `Estás usando el modelo gratuito. Espera ${cooldown.retryAfterSeconds}s antes de escribir de nuevo.`,
    );
    this.name = "AssistantCooldownError";
  }
}

/**
 * Punto de entrada único e independiente del canal: el chat web, la voz y los
 * futuros adaptadores externos (Google, Siri, Alexa) resuelven la identidad en
 * backend y pasan por el mismo servicio, sin duplicar tools ni lógica de negocio.
 */
export class AssistantService {
  constructor(private readonly deps: AssistantServiceDependencies) {}

  async getStatus(userId: string): Promise<AssistantSessionStatus> {
    const { provider, cooldownStore, cooldownSeconds } = this.deps;
    const cooldown = provider.isFreeModel
      ? await cooldownStore.getStatus(userId, cooldownSeconds)
      : { allowed: true, retryAfterSeconds: 0 };

    return {
      model: { name: provider.name, isFreeModel: provider.isFreeModel },
      cooldown: {
        cooldownSeconds: provider.isFreeModel ? cooldownSeconds : 0,
        retryAfterSeconds: cooldown.retryAfterSeconds,
        allowed: cooldown.allowed,
      },
    };
  }

  async reply(
    context: AssistantAuthenticatedContext,
    history: readonly AssistantHistoryMessage[],
  ): Promise<AssistantServiceReply> {
    const { provider, cooldownStore, cooldownSeconds, useCases } = this.deps;

    if (provider.isFreeModel) {
      const status = await cooldownStore.consume(context.userId, cooldownSeconds);
      if (!status.allowed) {
        throw new AssistantCooldownError(
          {
            cooldownSeconds,
            retryAfterSeconds: status.retryAfterSeconds,
            allowed: false,
          },
          { name: provider.name, isFreeModel: provider.isFreeModel },
        );
      }
    }

    const model: AssistantModelInfo = { name: provider.name, isFreeModel: provider.isFreeModel };
    return {
      ...(await useCases.reply(history, context)),
      model,
      cooldown: provider.isFreeModel
        ? { cooldownSeconds, retryAfterSeconds: cooldownSeconds, allowed: true }
        : null,
    };
  }
}

function cooldownSeconds(): number {
  const parsed = Number(process.env.AI_COOLDOWN_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

export function createAssistantService(): AssistantService {
  const provider = createAiProvider();
  const inventoryUseCases = new InventoryUseCases(new NeonInventoryRepository());
  const productUseCases = new ProductUseCases(new NeonProductRepository());
  const tools = createAssistantTools({ inventoryUseCases, productUseCases });
  const useCases = new AssistantUseCases(provider, tools, buildAssistantSystemPrompt());

  return new AssistantService({
    provider,
    cooldownStore: assistantCooldownStore,
    cooldownSeconds: cooldownSeconds(),
    useCases,
  });
}