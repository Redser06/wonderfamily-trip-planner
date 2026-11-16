import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { createInitialTripState } from './data/destinations.ts';
import { evaluateTrip } from './engine/tripEngine.ts';
import type { VoiceActionType } from './engine/tripVoiceAssistant.ts';
import { AppleHeroJourney } from './components/AppleHeroJourney.tsx';
import { BottomDock } from './components/BottomDock.tsx';
import { HeaderShell } from './components/HeaderShell.tsx';
import { VoiceSheet } from './components/VoiceSheet.tsx';
import { ApprovalQueueView } from './views/ApprovalQueueView.tsx';
import { ChangeRerunView } from './views/ChangeRerunView.tsx';
import { ChecksView } from './views/ChecksView.tsx';
import { CompareView } from './views/CompareView.tsx';
import { DayPlanView } from './views/DayPlanView.tsx';
import { TripSetupView } from './views/TripSetupView.tsx';
import type { AppTab, TripState } from './types/trip.ts';

const THEME_STORAGE_KEY = 'wonderfamily_theme_dark';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('setup');
  const [tripState, setTripState] = useState<TripState>(() => createInitialTripState());
  const [draftState, setDraftState] = useState<TripState>(() => createInitialTripState());
  const [isComparing, setIsComparing] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [voiceSettingsInitial, setVoiceSettingsInitial] = useState(false);
  const [isDark, setIsDark] = useState(() => window.localStorage.getItem(THEME_STORAGE_KEY) === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, String(isDark));
  }, [isDark]);

  const summary = evaluateTrip(tripState);

  const workspaceRef = useRef<HTMLElement | null>(null);

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navigateTo = (nextTab: AppTab) => {
    if (nextTab === 'change') {
      setDraftState(tripState);
    }
    setActiveTab(nextTab);
    scrollToWorkspace();
  };

  const handleStartCompare = () => {
    if (summary.hasBlockingDobError) return;
    setIsComparing(true);
    window.setTimeout(() => {
      setIsComparing(false);
      navigateTo('compare');
    }, 350);
  };

  const handleVoiceAction = (action: VoiceActionType) => {
    if (action === 'apply_all_fixes') {
      setTripState((prev) => ({
        ...prev,
        mitigations: { overnightFlight: true, middayAcBreak: true }
      }));
      navigateTo('checks');
      return;
    }
    if (action === 'shift_late_sept') {
      setTripState((prev) => ({ ...prev, weekShift: 'late' }));
      navigateTo('checks');
      return;
    }
    if (action === 'swap_pool_afternoon') {
      setTripState((prev) => ({ ...prev, swapAfternoonPool: true }));
      navigateTo('plan');
      return;
    }
    if (action === 'navigate_approvals') {
      navigateTo('approvals');
      return;
    }
    if (action === 'navigate_checks') {
      navigateTo('checks');
      return;
    }
    if (action === 'navigate_plan') {
      navigateTo('plan');
    }
  };

  const getMobilePrimaryConfig = (): {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
  } => {
    switch (activeTab) {
      case 'setup':
        return {
          label: isComparing ? 'Comparing trips…' : 'Compare trips',
          onClick: handleStartCompare,
          disabled: summary.hasBlockingDobError || !tripState.travelMonth || tripState.budgetCeilingEur === 0,
          loading: isComparing
        };
      case 'compare':
        return {
          label: 'See checks',
          onClick: () => navigateTo('checks')
        };
      case 'checks':
        return summary.warnCount + summary.failCount > 0
          ? { label: 'Change & re-run', onClick: () => navigateTo('change') }
          : { label: 'Review approvals', onClick: () => navigateTo('approvals') };
      case 'change':
        return {
          label: 'Keep change & re-run',
          onClick: () => {
            setTripState(draftState);
            navigateTo('checks');
          }
        };
      case 'approvals':
        return {
          label: 'Open day plan',
          onClick: () => navigateTo('plan')
        };
      case 'plan':
        return {
          label: tripState.swapAfternoonPool
            ? 'Restore indoor activity'
            : 'Swap afternoon with pool',
          onClick: () =>
            setTripState((prev) => ({ ...prev, swapAfternoonPool: !prev.swapAfternoonPool }))
        };
    }
  };

  const mobilePrimary = getMobilePrimaryConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderShell
        activeTab={activeTab}
        onSelectTab={navigateTo}
        onOpenVoice={() => {
          setVoiceSettingsInitial(false);
          setIsVoiceOpen(true);
        }}
        onOpenVoiceSettings={() => {
          setVoiceSettingsInitial(true);
          setIsVoiceOpen(true);
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        summary={summary}
      />

      <AppleHeroJourney
        summary={summary}
        onJumpToPlanner={scrollToWorkspace}
        onOpenVoice={() => {
          setVoiceSettingsInitial(false);
          setIsVoiceOpen(true);
        }}
      />

      <main
        id="planner-workspace"
        ref={workspaceRef}
        className="mx-auto w-full max-w-7xl flex-1 scroll-mt-20 px-4 pt-6 sm:px-6"
      >
        <div
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{
            backgroundColor: 'var(--wf-card-low)',
            borderColor: 'var(--wf-outline)'
          }}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
              style={{
                backgroundColor: 'var(--wf-teal-soft)',
                color: 'var(--wf-teal)'
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Interactive Workspace</span>
            </span>
            <span className="tabular-nums font-label text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
              {summary.travelWindowLabel} · {summary.ticketBreakdown.totalTravellers} pax ({summary.ticketBreakdown.totalPaidTickets} paid passes) · {summary.passCount}/9 rules passing · €0 held
            </span>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-label inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--wf-card)',
              color: 'var(--wf-teal)'
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Replay visual story</span>
          </button>
        </div>

        {activeTab === 'setup' && (
          <TripSetupView
            state={tripState}
            summary={summary}
            onChangeState={setTripState}
            onStartCompare={handleStartCompare}
            isComparing={isComparing}
          />
        )}

        {activeTab === 'compare' && (
          <CompareView state={tripState} summary={summary} onNavigate={navigateTo} />
        )}

        {activeTab === 'checks' && (
          <ChecksView summary={summary} onNavigate={navigateTo} />
        )}

        {activeTab === 'change' && (
          <ChangeRerunView
            committedSummary={summary}
            draft={draftState}
            onChangeDraft={setDraftState}
            onApplyAndReturn={() => {
              setTripState(draftState);
              navigateTo('checks');
            }}
            onDiscardAndReturn={() => navigateTo('checks')}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueueView
            state={tripState}
            summary={summary}
            onChangeState={setTripState}
            onNavigate={navigateTo}
          />
        )}

        {activeTab === 'plan' && (
          <DayPlanView state={tripState} summary={summary} onChangeState={setTripState} />
        )}
      </main>

      <footer
        className="hidden border-t py-6 lg:block"
        style={{ borderColor: 'var(--wf-outline)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs" style={{ color: 'var(--wf-muted)' }}>
          <span className="font-label font-medium">
            <strong className="font-bold" style={{ color: 'var(--wf-ink)' }}>WonderFamily</strong> · Fatigue-Aware Calm Itinerary Engine · Zero Dark Patterns Guarantee
          </span>
          <span className="font-label flex items-center gap-4">
            <span>€0 due until dual parent consensus</span>
            <span>Verified infant comfort checks</span>
          </span>
        </div>
      </footer>

      <BottomDock
        activeTab={activeTab}
        onSelectTab={navigateTo}
        summary={summary}
        primaryCtaLabel={mobilePrimary.label}
        onPrimaryCta={mobilePrimary.onClick}
        primaryCtaDisabled={mobilePrimary.disabled}
        primaryCtaLoading={mobilePrimary.loading}
        showSecondarySetupShortcut={activeTab !== 'setup'}
      />

      <VoiceSheet
        isOpen={isVoiceOpen}
        initialShowSettings={voiceSettingsInitial}
        onClose={() => setIsVoiceOpen(false)}
        state={tripState}
        summary={summary}
        onExecuteVoiceAction={handleVoiceAction}
      />
    </div>
  );
}

export default App;
