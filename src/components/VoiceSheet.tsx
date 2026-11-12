import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Settings2, Sparkles, X } from 'lucide-react';
import {
  answerTripVoiceQuery,
  buildTripVoiceSystemInstruction,
  type VoiceActionType
} from '../engine/tripVoiceAssistant.ts';
import {
  GEMINI_ARGON_MODEL,
  GEMINI_FLASH_MODEL,
  GEMINI_LIVE_MODEL,
  TripVoiceLiveClient,
  VOICE_PERSONAS,
  type GeminiModelId,
  type VoiceConnectionStatus
} from '../engine/voiceClient.ts';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { EvaluationSummary, TripState } from '../types/trip.ts';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ruleChip?: { status: 'pass' | 'warn' | 'fail'; text: string };
  aiChip?: string;
  suggestedAction?: { label: string; action: VoiceActionType };
}

interface VoiceSheetProps {
  isOpen: boolean;
  initialShowSettings?: boolean;
  onClose: () => void;
  state: TripState;
  summary: EvaluationSummary;
  onExecuteVoiceAction: (action: VoiceActionType) => void;
}

const API_KEY_STORAGE = 'wonderfamily_gemini_api_key';
const VOICE_PERSONA_STORAGE = 'wonderfamily_voice_persona';
const MODEL_STORAGE = 'wonderfamily_gemini_model';

const QUICK_PROMPTS = [
  'Why does Orlando warn on heat?',
  'Can we fix all warnings?',
  'How much does Avios save us?',
  'What happens if we swap to the pool?'
];

export function VoiceSheet({
  isOpen,
  initialShowSettings = false,
  onClose,
  state,
  summary,
  onExecuteVoiceAction
}: VoiceSheetProps) {
  const [status, setStatus] = useState<VoiceConnectionStatus>('idle');
  const [showSettings, setShowSettings] = useState(initialShowSettings);
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem(API_KEY_STORAGE) ?? '');
  const [personaId, setPersonaId] = useState(
    () => window.localStorage.getItem(VOICE_PERSONA_STORAGE) ?? VOICE_PERSONAS[0].id
  );
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(
    () => (window.localStorage.getItem(MODEL_STORAGE) as GeminiModelId) || GEMINI_LIVE_MODEL
  );
  const [typedInput, setTypedInput] = useState('');
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'Hello Sarah & Mark. Tap the microphone for Gemini 3.8 Live voice, or type a question below—I can explain heat warnings, Avios savings, or adjust your afternoon nap plan.',
      ruleChip: { status: 'pass', text: 'Voice & Typed Ready' }
    }
  ]);

  const liveClientRef = useRef<TripVoiceLiveClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowSettings(initialShowSettings);
  }, [initialShowSettings]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  if (!isOpen) return null;

  const activePersona = VOICE_PERSONAS.find((p) => p.id === personaId) ?? VOICE_PERSONAS[0];
  const systemPrompt = buildTripVoiceSystemInstruction(state, summary);

  const handleToggleMic = async () => {
    if (status === 'listening' || status === 'speaking' || status === 'connecting') {
      liveClientRef.current?.disconnect();
      setStatus('idle');
      return;
    }

    setErrorNote(null);
    const effectiveKey = apiKey.trim() || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
    if (!effectiveKey) {
      setErrorNote('Live mic uses your optional Gemini API key in Settings. Typed companion below works immediately without a key.');
      setShowSettings(true);
      return;
    }

    if (!liveClientRef.current) {
      liveClientRef.current = new TripVoiceLiveClient();
    }

    await liveClientRef.current.connect(effectiveKey, activePersona.voiceName, systemPrompt, {
      onStatus: setStatus,
      onError: (msg) => setErrorNote(msg),
      onUserTranscript: (text) => {
        setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
      },
      onAssistantTranscript: (text, isFinal) => {
        if (!isFinal) return;
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', text, aiChip: 'Live Gemini 3.8' }
        ]);
      }
    });
  };

  const handleSendTyped = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    setTypedInput('');

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);

    // If Live WebSocket is active, also forward to Gemini Live; otherwise answer deterministically right away
    const sentLive = liveClientRef.current?.sendTypedMessage(trimmed);
    if (!sentLive) {
      const response = answerTripVoiceQuery(trimmed, state, summary);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now() + 1}`,
          role: 'assistant',
          text: response.reply,
          ruleChip: response.ruleChip,
          aiChip: response.aiChip,
          suggestedAction: response.suggestedAction
        }
      ]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-sheet-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-3xl"
        style={{ backgroundColor: 'var(--wf-card)', borderColor: 'var(--wf-outline)' }}
      >
        {/* Sheet Header */}
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4"
          style={{ borderColor: 'var(--wf-outline)', backgroundColor: 'var(--wf-card-low)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: 'var(--wf-violet)' }}
            >
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="voice-sheet-title" className="text-lg font-extrabold">
                Calm Voice Steward
              </h2>
              <p className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                {activePersona.label} · {selectedModel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              aria-label="Toggle voice and API settings"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border"
              style={{
                backgroundColor: showSettings ? 'var(--wf-teal-soft)' : 'var(--wf-card)',
                borderColor: 'var(--wf-outline)',
                color: 'var(--wf-ink)'
              }}
            >
              <Settings2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                liveClientRef.current?.disconnect();
                setStatus('idle');
                onClose();
              }}
              aria-label="Close voice sheet"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border"
              style={{
                backgroundColor: 'var(--wf-card)',
                borderColor: 'var(--wf-outline)',
                color: 'var(--wf-ink)'
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Optional Voice / Gemini 3.8 Live Settings */}
        {showSettings && (
          <div
            className="space-y-3 border-b p-4 sm:px-5"
            style={{ backgroundColor: 'var(--wf-card-mid)', borderColor: 'var(--wf-outline)' }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="voice-persona-select" className="font-label block text-xs font-bold">
                  Voice Persona (irish-voice-pwa pipeline)
                </label>
                <select
                  id="voice-persona-select"
                  value={personaId}
                  onChange={(e) => {
                    setPersonaId(e.target.value);
                    window.localStorage.setItem(VOICE_PERSONA_STORAGE, e.target.value);
                  }}
                  className="mt-1 min-h-[48px] w-full rounded-xl border px-3 text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--wf-card)',
                    borderColor: 'var(--wf-outline)',
                    color: 'var(--wf-ink)'
                  }}
                >
                  {VOICE_PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.voiceName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="gemini-model-select" className="font-label block text-xs font-bold">
                  Model Generation (Gemini 3.8 / 4)
                </label>
                <select
                  id="gemini-model-select"
                  value={selectedModel}
                  onChange={(e) => {
                    const m = e.target.value as GeminiModelId;
                    setSelectedModel(m);
                    window.localStorage.setItem(MODEL_STORAGE, m);
                  }}
                  className="mt-1 min-h-[48px] w-full rounded-xl border px-3 text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--wf-card)',
                    borderColor: 'var(--wf-outline)',
                    color: 'var(--wf-ink)'
                  }}
                >
                  <option value={GEMINI_LIVE_MODEL}>gemini-3.8-live (Realtime Bidi Audio)</option>
                  <option value={GEMINI_FLASH_MODEL}>gemini-3.8-flash (Fast Text Fallback)</option>
                  <option value={GEMINI_ARGON_MODEL}>gemini-4-argon (Heavy Analysis)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="gemini-key-input" className="font-label block text-xs font-bold">
                Optional Gemini API Key (stored locally in browser only)
              </label>
              <input
                id="gemini-key-input"
                type="password"
                value={apiKey}
                placeholder="AIza... (leave empty for offline typed steward)"
                onChange={(e) => {
                  setApiKey(e.target.value);
                  window.localStorage.setItem(API_KEY_STORAGE, e.target.value);
                }}
                className="mt-1 min-h-[48px] w-full rounded-xl border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--wf-card)',
                  borderColor: 'var(--wf-outline)',
                  color: 'var(--wf-ink)'
                }}
              />
            </div>
          </div>
        )}

        {/* Live Transcript History */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5" aria-live="polite">
          {errorNote && (
            <div
              className="rounded-xl border p-3 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--wf-amber-soft)',
                borderColor: 'var(--wf-amber)',
                color: 'var(--wf-amber-ink)'
              }}
            >
              {errorNote}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className="max-w-[88%] rounded-2xl border p-3.5 text-sm sm:text-base"
                style={{
                  backgroundColor: msg.role === 'user' ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                  borderColor: 'var(--wf-outline)'
                }}
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="font-label text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                    {msg.role === 'user' ? 'You' : 'Steward'}
                  </span>
                  {msg.aiChip && <SuggestedChip text={msg.aiChip} />}
                  {msg.ruleChip && <RuleChip status={msg.ruleChip.status} label={msg.ruleChip.text} />}
                </div>
                <p>{msg.text}</p>

                {msg.suggestedAction && (
                  <button
                    type="button"
                    onClick={() => {
                      onExecuteVoiceAction(msg.suggestedAction!.action);
                      onClose();
                    }}
                    className="font-label mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--wf-teal-container)' }}
                  >
                    <span>{msg.suggestedAction.label}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>

        {/* Quick Questions Bar */}
        <div className="flex gap-2 overflow-x-auto border-t px-4 py-2.5" style={{ borderColor: 'var(--wf-outline)' }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendTyped(prompt)}
              className="font-label min-h-[48px] shrink-0 rounded-full border px-3.5 text-xs font-bold"
              style={{
                backgroundColor: 'var(--wf-card-low)',
                borderColor: 'var(--wf-outline)',
                color: 'var(--wf-teal)'
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Microphone + Typed Fallback Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTyped(typedInput);
          }}
          className="flex items-center gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          style={{ borderColor: 'var(--wf-outline)', backgroundColor: 'var(--wf-card-low)' }}
        >
          <button
            type="button"
            onClick={() => void handleToggleMic()}
            aria-label={status === 'listening' || status === 'speaking' ? 'Stop voice microphone' : 'Start Gemini Live voice microphone'}
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border text-white"
            style={{
              backgroundColor:
                status === 'listening' || status === 'speaking' ? 'var(--wf-error)' : 'var(--wf-violet)',
              borderColor: 'transparent'
            }}
          >
            {status === 'listening' || status === 'speaking' ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          <label htmlFor="voice-typed-input" className="sr-only">
            Ask the planner a typed question
          </label>
          <input
            id="voice-typed-input"
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Ask by voice or type a question…"
            className="min-h-[48px] flex-1 rounded-xl border px-3.5 text-base"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-ink)'
            }}
          />

          <button
            type="submit"
            aria-label="Send message"
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
