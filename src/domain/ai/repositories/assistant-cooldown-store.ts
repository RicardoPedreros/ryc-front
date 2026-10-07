export interface CooldownResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

export interface AssistantCooldownStore {
  consume(userId: string, cooldownSeconds: number): Promise<CooldownResult>;
  getStatus(userId: string, cooldownSeconds: number): Promise<CooldownResult>;
}