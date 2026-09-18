"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantBlock } from "@/domain/ai/entities/assistant-blocks";

export interface AssistantUiMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly blocks: readonly AssistantBlock[];
  readonly time: string | null;
}

interface AssistantModelInfo {
  readonly name?: string;
  readonly isFreeModel?: boolean;
}

interface AssistantCooldownInfo {
  readonly cooldownSeconds?: number;
  readonly retryAfterSeconds?: number;
}

interface AssistantApiResponse {
  readonly reply?: string;
  readonly blocks?: readonly AssistantBlock[];
  readonly error?: string;
  readonly model?: AssistantModelInfo;
  readonly cooldown?: AssistantCooldownInfo | null;
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
  const [modelInfo, setModelInfo] = useState<AssistantModelInfo | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market/assistant")
      .then((response) => response.json().catch(() => null))
      .then((body) => {
        if (cancelled || !body) return;
        setModelInfo(body.model ?? null);
        const retryAfter = Number(body.cooldown?.retryAfterSeconds ?? 0);
        if (retryAfter > 0) {
          cooldownUntilRef.current = Date.now() + retryAfter * 1000;
          setCooldownSeconds(retryAfter);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((cooldownUntilRef.current - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining <= 0) cooldownUntilRef.current = 0;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || sending) return;

      const cooldownLeft = Math.max(0, Math.round((cooldownUntilRef.current - Date.now()) / 1000));
      if (cooldownLeft > 0) {
        setCooldownSeconds(cooldownLeft);
        return;
      }

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
          const retryAfter = Number(body?.cooldown?.retryAfterSeconds ?? 0);
          const cooldownPeriod = Number(body?.cooldown?.cooldownSeconds ?? 0);
          if (retryAfter > 0) {
            cooldownUntilRef.current = Date.now() + retryAfter * 1000;
            setCooldownSeconds(retryAfter);
          }
          if (body?.model?.isFreeModel != null) {
            setModelInfo((previous) => ({ ...previous, ...body?.model }));
          }
          if (cooldownPeriod > 0) {
            throw new Error(
              `El modelo gratuito tiene un descanso de ${cooldownPeriod}s entre consultas. Espera ${retryAfter}s para volver a escribir.`,
            );
          }
          throw new Error(body?.error ?? `HTTP ${response.status}`);
        }

        if (body?.model?.isFreeModel != null) {
          setModelInfo((previous) => ({ ...previous, ...body?.model }));
        }
        const fullCooldown = Number(body?.cooldown?.cooldownSeconds ?? 0);
        if (fullCooldown > 0 && body?.cooldown !== null) {
          cooldownUntilRef.current = Date.now() + fullCooldown * 1000;
          setCooldownSeconds(fullCooldown);
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

  const isFreeModel = modelInfo?.isFreeModel === true;
  const onCooldown = cooldownSeconds > 0;

  return { messages, sending, error, send, isFreeModel, cooldownSeconds, onCooldown };
}