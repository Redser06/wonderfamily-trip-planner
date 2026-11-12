import { useEffect, useState } from 'react';
import { createInitialTripState } from './data/destinations.ts';
import { evaluateTrip } from './engine/tripEngine.ts';
import type { VoiceActionType } from './engine/tripVoiceAssistant.ts';
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

  const navigateTo = (nextTab: AppTab) => {
    if (nextTab === 'change') {
      setDraftState(tripState);
    }
    setActiveTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Single mobile primary CTA per screen (Design Principle #1 & Hand-back Navigation Flow)
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
    <div className="min-h-screen">
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

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
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
