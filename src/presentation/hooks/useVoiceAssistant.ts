"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceChannel, VoiceChannelState } from "@/domain/voice/voice-channel";
import { createVoiceChannel } from "@/infrastructure/voice/voice-channel-factory";

export interface VoiceAssistantControls {
  readonly supported: boolean;
  readonly state: VoiceChannelState;
  readonly interim: string;
  readonly error: string | null;
  readonly busy: boolean;
  readonly toggle: () => void;
}

/**
 * Conecta el canal de voz (Web Speech API) con el mismo envío que usa el chat:
 * transcript → AssistantService (vía /api/market/assistant) → TTS de la respuesta.
 */
export function useVoiceAssistant(send: (text: string) => Promise<string | null>): VoiceAssistantControls {
  const [channel] = useState<VoiceChannel>(() => createVoiceChannel());
  const sendRef = useRef(send);

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  const [state, setState] = useState<VoiceChannelState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(() => {
    if (!channel.supported) return;

    if (channel.state === "listening") {
      channel.stopListening();
      setInterim("");
      return;
    }

    if (channel.state === "speaking") {
      channel.stopSpeaking();
      return;
    }

    setError(null);
    channel.listen({
      onTranscript: (finalText) => {
        setInterim("");
        void sendRef.current(finalText).then((reply) => {
          if (reply) {
            channel.speak(reply);
          }
        });
      },
      onInterimTranscript: setInterim,
      onStateChange: setState,
      onError: setError,
    });
  }, [channel]);

  return {
    supported: channel.supported,
    state,
    interim,
    error,
    busy: state !== "idle",
    toggle,
  };
}