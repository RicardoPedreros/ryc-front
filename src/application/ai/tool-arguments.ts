export type ArgumentRecord = Readonly<Record<string, unknown>>;

export function asRecord(value: unknown): ArgumentRecord {
  return typeof value === "object" && value !== null
    ? (value as ArgumentRecord)
    : {};
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function parseArguments(json: string): ArgumentRecord {
  if (!json.trim()) return {};
  try {
    return asRecord(JSON.parse(json) as unknown);
  } catch {
    return {};
  }
}
