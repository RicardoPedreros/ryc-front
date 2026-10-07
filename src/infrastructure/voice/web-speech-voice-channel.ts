import type { VoiceChannel, VoiceChannelEventHandlers, VoiceChannelState } from "@/domain/voice/voice-channel";

/* SpeechRecognition no forma parte de lib.dom: se tipa de forma minimalista. */
interface RecognitionAlternative {
  readonly transcript: string;
}

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly item: (index: number) => RecognitionAlternative;
  readonly [index: number]: RecognitionAlternative;
}

interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly item: (index: number) => RecognitionResult;
    readonly [index: number]: RecognitionResult;
  };
}

interface RecognitionErrorEvent {
  readonly error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function readRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const candidates = (window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  });
  const ctor = candidates.SpeechRecognition ?? candidates.webkitSpeechRecognition;
  return typeof ctor === "function" ? (ctor as RecognitionConstructor) : null;
}

function isTtsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function friendlyRecognitionError(code: string | undefined): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permiso de micrófono denegado. Habilítalo desde el navegador.";
    case "no-speech":
      return "No se detectó voz. Intenta de nuevo.";
    case "network":
      return "Error de red en el reconocimiento de voz.";
    case "audio-capture":
      return "No hay micrófono disponible en este dispositivo.";
    default:
      return `Error de voz: ${code ?? "desconocido"}`;
  }
}

function sanitizeForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~#>]/g, " ")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class WebSpeechVoiceChannel implements VoiceChannel {
  readonly supported =
    readRecognitionConstructor() !== null &&
    isTtsAvailable();

  private recognition: SpeechRecognitionLike | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private handlers: VoiceChannelEventHandlers | null = null;
  private internalState: VoiceChannelState = "idle";

  get state(): VoiceChannelState {
    return this.internalState;
  }

  listen(handlers: VoiceChannelEventHandlers): void {
    const Recognition = readRecognitionConstructor();
    if (!Recognition || this.internalState === "listening") return;

    this.handlers = handlers;
    const recognition = new Recognition();
    this.recognition = recognition;

    recognition.lang = "es-AR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => this.setInternalState("listening");

    recognition.onresult = (event) => {
      const transcript = collectTranscript(event);
      const finalText = collectFinalText(event);
      this.handlers?.onInterimTranscript(transcript);
      if (finalText) {
        this.stopListening();
        const text = finalText.trim();
        if (text) {
          this.handlers?.onTranscript(text);
        }
      }
    };

    recognition.onerror = (event) => {
      this.stopListening();
      this.handlers?.onError(friendlyRecognitionError(event.error));
    };

    recognition.onend = () => this.setInternalState("idle");

    try {
      recognition.start();
    } catch {
      this.stopListening();
      this.handlers?.onError("No se pudo iniciar el micrófono.");
    }
  }

  stopListening(): void {
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        recognition.abort();
      }
    }
    this.setInternalState(this.activeUtterance ? "speaking" : "idle");
  }

  speak(text: string): void {
    if (!isTtsAvailable()) return;
    const cleaned = sanitizeForSpeech(text);
    if (!cleaned) return;

    window.speechSynthesis.cancel();
    if (this.recognition) {
      this.stopListening();
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "es-AR";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      this.activeUtterance = null;
      this.setInternalState("idle");
    };
    utterance.onerror = () => {
      this.activeUtterance = null;
      this.setInternalState("idle");
    };

    this.activeUtterance = utterance;
    this.setInternalState("speaking");
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (!isTtsAvailable()) return;
    window.speechSynthesis.cancel();
    this.activeUtterance = null;
    this.setInternalState(this.recognition ? "listening" : "idle");
  }

  private setInternalState(next: VoiceChannelState): void {
    if (this.internalState === next) return;
    this.internalState = next;
    this.handlers?.onStateChange(next);
  }
}

function collectTranscript(event: RecognitionEvent): string {
  let transcript = "";
  for (let index = 0; index < event.results.length; index += 1) {
    transcript += event.results.item(index).item(0).transcript;
  }
  return transcript.trim();
}

function collectFinalText(event: RecognitionEvent): string | null {
  let finalText = "";
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results.item(index);
    if (result.isFinal) {
      finalText += result.item(0).transcript;
    }
  }
  const trimmed = finalText.trim();
  return trimmed.length > 0 ? trimmed : null;
}