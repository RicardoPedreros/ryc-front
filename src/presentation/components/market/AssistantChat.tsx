"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAssistant } from "@/presentation/hooks/useAssistant";
import { Icon } from "@/presentation/components/ui/Icon";
import { AssistantBlockView } from "./AssistantBlockView";
import { AssistantMarkdown } from "./AssistantMarkdown";

const QUICK_PROMPTS = [
  "¿Qué puedo cocinar hoy?",
  "¿Qué vence pronto?",
  "Quiero usar los huevos",
] as const;

export function AssistantChat() {
  const { messages, sending, error, send, isFreeModel, cooldownSeconds, onCooldown } = useAssistant();
  const [input, setInput] = useState("");
  const trimmed = input.trim();

  const threadRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    const element = threadRef.current;
    if (!element) return;
    let container: HTMLElement | null = element.parentElement;
    while (container) {
      const overflowY = getComputedStyle(container).overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        container.scrollHeight > container.clientHeight
      ) {
        container.scrollTop = container.scrollHeight;
        return;
      }
      container = container.parentElement;
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const submit = (text: string) => {
    if (!text.trim() || sending || onCooldown) return;
    setInput("");
    void send(text);
  };

  return (
    <>
      <div className="asst-thread" ref={threadRef}>
        {messages.map((message) => (
          <div key={message.id} className={`asst-msg ${message.role === "user" ? "user" : "bot"}`}>
            <div className="asst-bubble">
              {message.role === "user" ? (
                message.content
              ) : (
                <AssistantMarkdown content={message.content} />
              )}
            </div>

            {message.blocks.map((block, index) => (
              <AssistantBlockView key={`${message.id}-block-${index}`} block={block} />
            ))}

            {message.id === "welcome" && (
              <div className="asst-chip-row">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="asst-chip"
                    onClick={() => submit(prompt)}
                    disabled={sending || onCooldown}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {message.time && <span className="asst-time">{message.time}</span>}
          </div>
        ))}

        {sending && (
          <div className="asst-msg bot">
            <div className="asst-bubble asst-typing" aria-label="Asistente escribiendo">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {error && <p className="asst-error">{error}</p>}

      {(isFreeModel || onCooldown) && (
        <div className="asst-model-row">
          {isFreeModel && <span className="asst-model-chip free">Modelo gratuito</span>}
          {onCooldown && (
            <span className="asst-model-chip cooldown">
              Espera {cooldownSeconds}s para escribir
            </span>
          )}
        </div>
      )}

      <form
        className="asst-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submit(trimmed);
        }}
      >
        <div className="asst-composer-box">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pregunta por recetas con tu inventario…"
            aria-label="Mensaje al asistente"
            disabled={sending || onCooldown}
          />
          <button
            className="asst-send"
            type="submit"
            aria-label="Enviar mensaje"
            disabled={sending || !trimmed || onCooldown}
          >
            <Icon name="send" size={18} />
          </button>
        </div>
        <span className="asst-hint">El asistente usa el inventario real de tu Mercado.</span>
      </form>
    </>
  );
}
