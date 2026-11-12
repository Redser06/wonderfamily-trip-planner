import { CalendarDays, CheckSquare, Columns2, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { AppTab, EvaluationSummary } from '../types/trip.ts';

interface BottomDockProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  summary: EvaluationSummary;
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
  primaryCtaDisabled?: boolean;
  primaryCtaLoading?: boolean;
  showSecondarySetupShortcut?: boolean;
}

const MOBILE_TABS: Array<{ id: AppTab; label: string; icon: typeof Columns2 }> = [
  { id: 'compare', label: 'Compare', icon: Columns2 },
  { id: 'checks', label: 'Checks', icon: ShieldCheck },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'plan', label: 'Plan', icon: CalendarDays }
];

export function BottomDock({
  activeTab,
  onSelectTab,
  summary,
  primaryCtaLabel,
  onPrimaryCta,
  primaryCtaDisabled = false,
  primaryCtaLoading = false,
  showSecondarySetupShortcut = false
}: BottomDockProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--wf-card) 94%, transparent)',
        borderColor: 'var(--wf-outline)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Mobile Single Primary Action Bar pinned inside bottom third for effortless thumb reach */}
      <div className="mx-auto flex max-w-xl items-center gap-2 px-4 pt-2.5 pb-2">
        {showSecondarySetupShortcut && (
          <button
            type="button"
            onClick={() => onSelectTab('setup')}
            aria-label="Edit trip setup"
            className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: 'var(--wf-card-low)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-teal)'
            }}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          disabled={primaryCtaDisabled || primaryCtaLoading}
          onClick={onPrimaryCta}
          className="font-label inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          style={{ backgroundColor: 'var(--wf-teal-container)' }}
        >
          {primaryCtaLoading && (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              aria-hidden="true"
            />
          )}
          <span>{primaryCtaLabel}</span>
        </button>
      </div>

      {/* Bottom Tab Bar: Compare, Checks, Approvals (count badge), Plan */}
      <nav aria-label="Mobile Bottom Tabs" className="mx-auto grid max-w-xl grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const countBadge =
            tab.id === 'approvals'
              ? summary.readyForApprovalCount
              : tab.id === 'checks'
                ? summary.warnCount + summary.failCount
                : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-xs font-semibold"
              style={{
                color: isActive ? 'var(--wf-teal)' : 'var(--wf-muted)',
                backgroundColor: isActive ? 'var(--wf-teal-soft)' : 'transparent'
              }}
            >
              <div className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {countBadge > 0 && (
                  <span
                    className="tabular-nums absolute -top-1.5 -right-3 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-extrabold leading-tight"
                    style={{
                      backgroundColor: 'var(--wf-amber-accent)',
                      color: '#111e1f'
                    }}
                  >
                    {countBadge}
                  </span>
                )}
              </div>
              <span className="font-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
