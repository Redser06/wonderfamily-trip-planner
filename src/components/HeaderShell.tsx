import { Calendar, Compass, Mic, Moon, Settings2, Sun } from 'lucide-react';
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
  { id: 'setup', label: 'Preferences' },
  { id: 'compare', label: 'Compare' },
  { id: 'checks', label: 'Safety Checks' },
  { id: 'change', label: 'Tune Rules' },
  { id: 'approvals', label: 'Saved Holds' },
  { id: 'plan', label: 'Itinerary' }
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
      className="sticky top-0 z-30 border-b backdrop-blur-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--wf-card) 86%, transparent)',
        borderColor: 'var(--wf-outline)'
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectTab('setup')}
            className="flex min-h-[48px] items-center gap-2.5 rounded-xl text-left"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: 'var(--wf-teal-container)' }}
            >
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <span className="block text-base font-extrabold tracking-tight" style={{ color: 'var(--wf-teal)' }}>
                WonderFamily
              </span>
              <span className="font-label block whitespace-nowrap text-[11px] font-medium" style={{ color: 'var(--wf-muted)' }}>
                Sept 2027 · Family of 4
              </span>
            </div>
          </button>

          {/* Editorial Stitch Underline Navigation */}
          <nav aria-label="Primary Planner Navigation" className="hidden items-center gap-0.5 lg:flex xl:gap-1">
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
                  className="font-label relative inline-flex min-h-[52px] shrink-0 whitespace-nowrap items-center gap-1.5 px-2.5 text-sm font-semibold transition-colors xl:px-3"
                  style={{
                    color: isActive ? 'var(--wf-teal)' : 'var(--wf-muted)'
                  }}
                >
                  <span>{tab.label}</span>
                  {badge !== null && (
                    <span
                      className="tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: 'var(--wf-amber-soft)',
                        color: 'var(--wf-amber-ink)'
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2.5 bottom-0 h-[2.5px] rounded-full"
                      style={{ backgroundColor: 'var(--wf-teal-container)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className="font-label hidden items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold 2xl:flex"
            style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
            <span>Sept 2027 · 2 Adults, 1 Toddler, 1 Baby</span>
          </div>

          <button
            type="button"
            onClick={onOpenVoice}
            className="font-label inline-flex min-h-[48px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform active:scale-95"
            style={{
              backgroundColor: 'var(--wf-violet-soft)',
              color: 'var(--wf-violet-ink)'
            }}
          >
            <Mic className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Voice</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--wf-card-low)',
              color: 'var(--wf-muted)'
            }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenVoiceSettings}
            aria-label="Voice and Gemini Live API Settings"
            className="hidden min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors sm:inline-flex"
            style={{
              backgroundColor: 'var(--wf-card-low)',
              color: 'var(--wf-muted)'
            }}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          <div
            className="font-label hidden h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold sm:flex"
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
