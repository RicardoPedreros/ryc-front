import type { VoiceChannel } from "@/domain/voice/voice-channel";
import { WebSpeechVoiceChannel } from "./web-speech-voice-channel";

/**
 * Punto de extensión para futuros canales de voz (Google, Siri, Alexa):
 * los adaptadores externos se registran aquí sin tocar AssistantService.
 */
export function createVoiceChannel(): VoiceChannel {
  return new WebSpeechVoiceChannel();
}