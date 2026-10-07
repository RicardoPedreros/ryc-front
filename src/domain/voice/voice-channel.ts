export type VoiceChannelState = "idle" | "listening" | "speaking";

export interface VoiceChannelEventHandlers {
  readonly onTranscript: (text: string) => void;
  readonly onInterimTranscript: (text: string) => void;
  readonly onStateChange: (state: VoiceChannelState) => void;
  readonly onError: (message: string) => void;
}

/**
 * Contrato independiente del proveedor de voz. El canal Web Voice (Web Speech
 * API) es la primera implementación; los adaptadores de Google, Siri y Alexa se
 * conectan detrás de esta misma interfaz sin tocar AssistantService.
 */
export interface VoiceChannel {
  readonly supported: boolean;
  readonly state: VoiceChannelState;
  listen(handlers: VoiceChannelEventHandlers): void;
  stopListening(): void;
  speak(text: string): void;
  stopSpeaking(): void;
}