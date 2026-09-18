export interface CooldownResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export interface AssistantCooldownStore {
  consume(userId: string, cooldownSeconds: number): Promise<CooldownResult>;
  getStatus(userId: string, cooldownSeconds: number): Promise<CooldownResult>;
}

/**
 * Cooldown sin persistencia: solo lógica en memoria del proceso Next.js.
 * El chequeo y la actualización ocurren en un mismo tick síncrono, así dos
 * requests concurrentes del mismo usuario (mismo proceso) no pueden pasar ambos.
 * El estado no se comparte entre instancias serverless ni sobrevive a reinicios.
 */
export class InMemoryAssistantCooldownStore implements AssistantCooldownStore {
  private readonly lastPromptAt = new Map<string, number>();

  consume(userId: string, cooldownSeconds: number): Promise<CooldownResult> {
    const now = Date.now();
    const windowMs = cooldownSeconds * 1000;
    const last = this.lastPromptAt.get(userId) ?? 0;
    const retryAfterSeconds = Math.ceil((last + windowMs - now) / 1000);

    if (retryAfterSeconds > 0) {
      return Promise.resolve({ allowed: false, retryAfterSeconds });
    }

    this.lastPromptAt.set(userId, now);
    return Promise.resolve({ allowed: true, retryAfterSeconds: 0 });
  }

  getStatus(userId: string, cooldownSeconds: number): Promise<CooldownResult> {
    const now = Date.now();
    const windowMs = cooldownSeconds * 1000;
    const last = this.lastPromptAt.get(userId) ?? 0;
    const retryAfterSeconds = Math.max(0, Math.ceil((last + windowMs - now) / 1000));
    return Promise.resolve({ allowed: retryAfterSeconds === 0, retryAfterSeconds });
  }
}

/** Singleton compartido entre requests del mismo proceso. */
export const assistantCooldownStore = new InMemoryAssistantCooldownStore();