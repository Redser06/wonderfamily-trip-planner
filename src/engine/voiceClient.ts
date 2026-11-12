export const GEMINI_LIVE_MODEL = 'gemini-3.8-live';
export const GEMINI_FLASH_MODEL = 'gemini-3.8-flash';
export const GEMINI_ARGON_MODEL = 'gemini-4-argon';

export type GeminiModelId =
  | typeof GEMINI_LIVE_MODEL
  | typeof GEMINI_FLASH_MODEL
  | typeof GEMINI_ARGON_MODEL;

export interface VoicePersona {
  id: string;
  label: string;
  voiceName: 'Aoede' | 'Kore' | 'Puck';
  accentHint: string;
  description: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'calm-steward',
    label: 'Calm Trip Steward',
    voiceName: 'Aoede',
    accentHint: 'Warm neutral Irish-English pacing',
    description: 'Low-stimulation guidance focused on naps, heat limits, and clear trade-offs.'
  },
  {
    id: 'dublin-coach',
    label: 'Dublin Parent Coach',
    voiceName: 'Kore',
    accentHint: 'Gentle Hiberno-English inflection',
    description: 'Conversational Irish parent lens (Reuses irish-voice-pwa live pipeline).'
  },
  {
    id: 'concise-brief',
    label: 'Concise Fact Brief',
    voiceName: 'Puck',
    accentHint: 'Crisp short answers for one-handed mobile checks',
    description: 'Short 2-sentence answers while walking or holding a sleeping baby.'
  }
];

export type VoiceConnectionStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export function downsampleTo16kHz(buffer: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000 || inputSampleRate <= 0) {
    return buffer;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.floor(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(buffer.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : buffer[start] ?? 0;
  }
  return result;
}

export function floatTo16BitPcmBase64(float32Audio: Float32Array): string {
  const int16 = new Int16Array(float32Audio.length);
  for (let i = 0; i < float32Audio.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32Audio[i]));
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function parsePcm16Chunk(
  incomingBytes: Uint8Array,
  leftover: Uint8Array | null = null
): { float32: Float32Array; leftover: Uint8Array | null } {
  let combined: Uint8Array;
  if (leftover && leftover.length > 0) {
    combined = new Uint8Array(leftover.length + incomingBytes.length);
    combined.set(leftover, 0);
    combined.set(incomingBytes, leftover.length);
  } else {
    combined = incomingBytes;
  }

  const evenByteLength = combined.length - (combined.length % 2);
  const nextLeftover = combined.length % 2 === 1 ? combined.slice(evenByteLength) : null;

  const sampleCount = evenByteLength / 2;
  const float32 = new Float32Array(sampleCount);
  const view = new DataView(combined.buffer, combined.byteOffset, evenByteLength);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }

  return { float32, leftover: nextLeftover };
}

export function buildRealtimeAudioPacket(base64Pcm: string) {
  return {
    realtimeInput: {
      audio: {
        mimeType: 'audio/pcm;rate=16000',
        data: base64Pcm
      }
    }
  };
}

export function buildRealtimeAudioEndPacket() {
  return {
    realtimeInput: {
      audioStreamEnd: true
    }
  };
}

export function buildSilentToolResponsePacket(callId: string, name: string, result: unknown) {
  return {
    toolResponse: {
      functionResponses: [
        {
          id: callId,
          name,
          response: {
            result,
            scheduling: 'SILENT'
          }
        }
      ]
    }
  };
}

export function shouldGateMicDuringPlayback(
  isAssistantSpeaking: boolean,
  rmsLevel: number,
  bargeInThreshold = 0.06
): boolean {
  if (!isAssistantSpeaking) return false;
  return rmsLevel < bargeInThreshold;
}

export function isForeignLanguageSlip(text: string): boolean {
  return /\b(gracias|bonjour|hola|c'est|muy bien|buenos dias)\b/i.test(text);
}

export interface LiveVoiceCallbacks {
  onStatus: (status: VoiceConnectionStatus) => void;
  onUserTranscript: (text: string) => void;
  onAssistantTranscript: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
}

export class TripVoiceLiveClient {
  private ws: WebSocket | null = null;
  private micContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextPlayTime = 0;
  private leftoverBytes: Uint8Array | null = null;
  private assistantSpeaking = false;
  private speechSilenceTimer: number | null = null;
  private assistantTextBuffer = '';

  async connect(
    apiKey: string,
    voiceName: string,
    systemInstruction: string,
    callbacks: LiveVoiceCallbacks
  ): Promise<void> {
    this.disconnect();
    const cleanedKey = apiKey.trim();
    if (!cleanedKey) {
      callbacks.onError('No Gemini API key set. Using deterministic calm text companion.');
      callbacks.onStatus('error');
      return;
    }

    callbacks.onStatus('connecting');
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(
      cleanedKey
    )}`;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.playbackContext = new AudioCtx({ sampleRate: 24000 });
      if (this.playbackContext.state === 'suspended') {
        await this.playbackContext.resume();
      }
      this.nextPlayTime = this.playbackContext.currentTime + 0.03;

      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = async () => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(
          JSON.stringify({
            setup: {
              model: `models/${GEMINI_LIVE_MODEL}`,
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName
                    }
                  }
                }
              },
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          })
        );
        await this.startMicCapture(callbacks);
        callbacks.onStatus('listening');
      };

      this.ws.onmessage = async (event) => {
        const raw = typeof event.data === 'string' ? event.data : await event.data.text();
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          return;
        }

        const serverContent = payload.serverContent as Record<string, unknown> | undefined;
        if (!serverContent) return;

        const inputTrans = serverContent.inputTranscription as { text?: string } | undefined;
        if (inputTrans?.text) {
          callbacks.onUserTranscript(inputTrans.text);
        }

        const outputTrans = serverContent.outputTranscription as { text?: string } | undefined;
        if (outputTrans?.text && !isForeignLanguageSlip(outputTrans.text)) {
          this.assistantTextBuffer += outputTrans.text;
          callbacks.onAssistantTranscript(this.assistantTextBuffer, false);
        }

        const modelTurn = serverContent.modelTurn as {
          parts?: Array<{ text?: string; inlineData?: { data?: string; mimeType?: string } }>;
        } | undefined;

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            if (part.inlineData?.data && part.inlineData.mimeType?.includes('audio/pcm')) {
              this.assistantSpeaking = true;
              callbacks.onStatus('speaking');
              this.schedulePcm24kAudio(part.inlineData.data);
            }
          }
        }

        if (serverContent.turnComplete) {
          if (this.assistantTextBuffer) {
            callbacks.onAssistantTranscript(this.assistantTextBuffer, true);
            this.assistantTextBuffer = '';
          }
          this.assistantSpeaking = false;
          callbacks.onStatus('listening');
        }
      };

      this.ws.onerror = () => {
        callbacks.onError('Gemini 3.8 Live socket error. Typed fallback stays active.');
        callbacks.onStatus('error');
      };

      this.ws.onclose = () => {
        this.cleanupAudioOnly();
        callbacks.onStatus('idle');
      };
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : 'Unable to start microphone session.');
      callbacks.onStatus('error');
    }
  }

  sendTypedMessage(text: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true
        }
      })
    );
    return true;
  }

  private async startMicCapture(callbacks: LiveVoiceCallbacks): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      callbacks.onError('Microphone access unavailable in this browser.');
      return;
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.micContext = new AudioCtx();
    const source = this.micContext.createMediaStreamSource(this.micStream);
    this.processor = this.micContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (ev) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const input = ev.inputBuffer.getChannelData(0);
      let sumSq = 0;
      for (let i = 0; i < input.length; i++) {
        sumSq += input[i] * input[i];
      }
      const rms = Math.sqrt(sumSq / input.length);
      if (shouldGateMicDuringPlayback(this.assistantSpeaking, rms)) {
        return;
      }

      if (rms > 0.015) {
        if (this.speechSilenceTimer !== null) {
          window.clearTimeout(this.speechSilenceTimer);
        }
        this.speechSilenceTimer = window.setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(buildRealtimeAudioEndPacket()));
          }
        }, 850);
      }

      const pcm16k = downsampleTo16kHz(input, this.micContext?.sampleRate ?? 48000);
      const b64 = floatTo16BitPcmBase64(pcm16k);
      this.ws.send(JSON.stringify(buildRealtimeAudioPacket(b64)));
    };

    source.connect(this.processor);
    this.processor.connect(this.micContext.destination);
  }

  private schedulePcm24kAudio(base64Data: string): void {
    if (!this.playbackContext) return;
    const raw = atob(base64Data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const { float32, leftover } = parsePcm16Chunk(bytes, this.leftoverBytes);
    this.leftoverBytes = leftover;
    if (float32.length === 0) return;

    const buffer = this.playbackContext.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);

    const startAt = Math.max(this.playbackContext.currentTime + 0.02, this.nextPlayTime);
    source.start(startAt);
    this.nextPlayTime = startAt + buffer.duration;
  }

  private cleanupAudioOnly(): void {
    if (this.speechSilenceTimer !== null) {
      window.clearTimeout(this.speechSilenceTimer);
      this.speechSilenceTimer = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micContext) {
      void this.micContext.close();
      this.micContext = null;
    }
    if (this.playbackContext) {
      void this.playbackContext.close();
      this.playbackContext = null;
    }
    this.leftoverBytes = null;
    this.assistantSpeaking = false;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.cleanupAudioOnly();
  }
}
