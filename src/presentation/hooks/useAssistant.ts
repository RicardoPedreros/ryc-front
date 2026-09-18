"use client";

import { useCallback, useState } from "react";
import type { AssistantBlock } from "@/domain/ai/entities/assistant-blocks";

export interface AssistantUiMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly blocks: readonly AssistantBlock[];
  readonly time: string | null;
}

interface AssistantApiResponse {
  readonly reply?: string;
  readonly blocks?: readonly AssistantBlock[];
  readonly error?: string;
}

const WELCOME_MESSAGE: AssistantUiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! Puedo sugerirte recetas con lo que ya tienes, avisarte cuando algo está por vencer y armar la lista de compras de lo que falta.",
  blocks: [],
  time: null,
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function useAssistant() {
  const [messages, setMessages] = useState<readonly AssistantUiMessage[]>([WELCOME_MESSAGE]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;

      const userMessage: AssistantUiMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        blocks: [],
        time: formatTime(new Date()),
      };

      const history = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setMessages((previous) => [...previous, userMessage]);
      setSending(true);
      setError(null);

      try {
        const response = await fetch("/api/market/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const body = (await response.json().catch(() => null)) as AssistantApiResponse | null;

        if (!response.ok) {
          throw new Error(body?.error ?? `HTTP ${response.status}`);
        }

        setMessages((previous) => [
          ...previous,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: body?.reply ?? "",
            blocks: body?.blocks ?? [],
            time: formatTime(new Date()),
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setSending(false);
      }
    },
    [messages, sending],
  );

  return { messages, sending, error, send };
}
