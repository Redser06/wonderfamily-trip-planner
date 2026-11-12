import { Compass, Mic, Moon, Settings2, Sun } from 'lucide-react';
import type { AppTab, EvaluationSummary } from '../types/trip.ts';

interface HeaderShellProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenVoice: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  summary: EvaluationSummary;
  onOpenVoiceSettings: () => void;
}

const DESKTOP_TABS: Array<{ id: AppTab; label: string }> = [
  { id: 'setup', label: '1. Setup' },
  { id: 'compare', label: '2. Compare' },
  { id: 'checks', label: '3. Checks' },
  { id: 'change', label: '4. Re-run' },
  { id: 'approvals', label: '5. Approvals' },
  { id: 'plan', label: '6. Day Plan' }
];

export function HeaderShell({
  activeTab,
  onSelectTab,
  onOpenVoice,
  isDark,
  onToggleTheme,
  summary,
  onOpenVoiceSettings
}: HeaderShellProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--wf-card) 88%, transparent)',
        borderColor: 'var(--wf-outline)'
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('setup')}
            className="flex min-h-[48px] items-center gap-2.5 rounded-xl px-1 text-left"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: 'var(--wf-teal-container)' }}
            >
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="block text-base font-extrabold tracking-tight" style={{ color: 'var(--wf-teal)' }}>
                WonderFamily
              </span>
              <span className="font-label block whitespace-nowrap text-[11px] sm:text-xs" style={{ color: 'var(--wf-muted)' }}>
                Sept 2027 · Family of 4
              </span>
            </div>
          </button>

          <nav aria-label="Primary Planner Navigation" className="hidden items-center gap-1 lg:flex lg:pl-4">
            {DESKTOP_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const badge =
                tab.id === 'approvals' && summary.readyForApprovalCount > 0
                  ? summary.readyForApprovalCount
                  : tab.id === 'checks' && summary.warnCount + summary.failCount > 0
                    ? summary.warnCount + summary.failCount
                    : null;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className="font-label inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--wf-teal-soft)' : 'transparent',
                    color: isActive ? 'var(--wf-teal)' : 'var(--wf-muted)'
                  }}
                >
                  <span>{tab.label}</span>
                  {badge !== null && (
                    <span
                      className="tabular-nums rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--wf-amber-soft)',
                        color: 'var(--wf-amber-ink)'
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenVoice}
            className="font-label inline-flex min-h-[48px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-transform active:scale-95"
            style={{
              backgroundColor: 'var(--wf-violet-soft)',
              color: 'var(--wf-violet-ink)',
              borderColor: 'color-mix(in srgb, var(--wf-violet) 30%, transparent)'
            }}
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Voice</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border"
            style={{
              backgroundColor: 'var(--wf-card-low)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-ink)'
            }}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onOpenVoiceSettings}
            aria-label="Voice and Gemini Live API Settings"
            className="hidden min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border sm:inline-flex"
            style={{
              backgroundColor: 'var(--wf-card-low)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-ink)'
            }}
          >
            <Settings2 className="h-5 w-5" />
          </button>

          <div
            className="font-label hidden h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold sm:flex"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
            title="Sarah & Mark family profile"
          >
            SM
          </div>
        </div>
      </div>
    </header>
  );
}
