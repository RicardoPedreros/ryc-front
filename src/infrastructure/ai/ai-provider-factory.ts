import type { IAiProvider } from "@/domain/ai/repositories/ai-provider";
import { MockAiProvider } from "./providers/mock-ai-provider";
import { OpenAiCompatibleAiProvider } from "./providers/openai-compatible-ai-provider";

export const SUPPORTED_AI_PROVIDERS = ["mock", "openai", "gemini"] as const;
export type SupportedAiProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

const GeminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
const GeminiModelDefault = "gemini-3.1-flash-lite";

function requiredApiKey(providerName: string): string {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error(`AI_API_KEY is required when AI_PROVIDER=${providerName}`);
  }
  return apiKey;
}

export function createAiProvider(): IAiProvider {
  const providerName = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

  switch (providerName) {
    case "mock":
      return new MockAiProvider();

    case "openai": {
      return new OpenAiCompatibleAiProvider({
        apiKey: requiredApiKey(providerName),
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
      });
    }

    case "gemini": {
      return new OpenAiCompatibleAiProvider({
        apiKey: requiredApiKey(providerName),
        model: process.env.AI_MODEL ?? "gemini-3.1-flash-lite",
        baseUrl: process.env.AI_BASE_URL ?? GeminiBaseUrl,
      });
    }

    default:
      throw new Error(
        `Unsupported AI_PROVIDER "${providerName}". Supported: ${SUPPORTED_AI_PROVIDERS.join(", ")}`,
      );
  }
}
