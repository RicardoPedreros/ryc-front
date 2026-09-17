"use client";

import { useState } from "react";
import { useAssistant } from "@/presentation/hooks/useAssistant";
import { AssistantBlockView } from "./AssistantBlockView";

const QUICK_PROMPTS = [
  "¿Qué puedo cocinar hoy?",
  "¿Qué vence pronto?",
  "Quiero usar los huevos",
] as const;

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function AssistantChat() {
  const { messages, sending, error, send } = useAssistant();
  const [input, setInput] = useState("");
  const trimmed = input.trim();

  const submit = (text: string) => {
    if (!text.trim() || sending) return;
    setInput("");
    void send(text);
  };

  return (
    <>
      <div className="asst-thread">
        {messages.map((message) => (
          <div key={message.id} className={`asst-msg ${message.role === "user" ? "user" : "bot"}`}>
            <div className="asst-bubble">{message.content}</div>

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
                    disabled={sending}
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
            placeholder="Preguntá por recetas con tu inventario…"
            aria-label="Mensaje al asistente"
            disabled={sending}
          />
          <button
            className="asst-send"
            type="submit"
            aria-label="Enviar mensaje"
            disabled={sending || !trimmed}
          >
            <SendIcon />
          </button>
        </div>
        <span className="asst-hint">El asistente usa el inventario real de tu Mercado.</span>
      </form>
    </>
  );
}
