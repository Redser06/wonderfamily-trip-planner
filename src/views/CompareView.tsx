import { ArrowRight, Baby, Clock, Plane, ShieldCheck, Sun, Wallet } from 'lucide-react';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { AppTab, DestinationComputedMetrics, EvaluationSummary, TripState } from '../types/trip.ts';

interface CompareViewProps {
  state: TripState;
  summary: EvaluationSummary;
  onNavigate: (tab: AppTab) => void;
}

function HeroDestinationCard({
  metrics,
  budgetCeilingEur,
  onNavigate
}: {
  metrics: DestinationComputedMetrics;
  budgetCeilingEur: number;
  onNavigate: (tab: AppTab) => void;
}) {
  const withinBudget = budgetCeilingEur > 0 && metrics.netTotalEur <= budgetCeilingEur;

  return (
    <article
      className="wf-card relative flex flex-col justify-between p-6"
      style={{
        boxShadow: metrics.recommended
          ? '0 8px 28px -6px rgba(47, 111, 115, 0.14), inset 0 0 0 1.5px var(--wf-teal-container)'
          : undefined
      }}
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-label rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}
              >
                {metrics.regionBadge}
              </span>
              {metrics.recommended && <SuggestedChip text="Lowest Fatigue Match" />}
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{metrics.name}</h2>
            <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
              {metrics.accommodationSummary}
            </p>
          </div>

          <div className="text-right">
            <span className="tabular-nums block text-3xl font-extrabold tracking-tight">
              €{metrics.netTotalEur.toLocaleString('en-IE')}
              <span className="ml-1 text-sm font-medium" style={{ color: 'var(--wf-muted)' }}>
                net
              </span>
            </span>
            <span className="tabular-nums font-label block text-xs line-through" style={{ color: 'var(--wf-muted)' }}>
              Gross €{metrics.grossTotalEur.toLocaleString('en-IE')}
            </span>
            <span className="tabular-nums font-label text-xs font-semibold" style={{ color: 'var(--wf-pass)' }}>
              Save €{metrics.aviosSavingsEur.toLocaleString('en-IE')} Avios
            </span>
          </div>
        </div>

        {/* Concise Key Metric Pills */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
          <div className="wf-tile p-3">
            <span className="font-label flex items-center gap-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
              <Plane className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Transit</span>
            </span>
            <span className="tabular-nums mt-0.5 block font-bold">{metrics.flightLabel}</span>
          </div>

          <div className="wf-tile p-3">
            <span className="font-label flex items-center gap-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Climate</span>
            </span>
            <span className="tabular-nums mt-0.5 block font-bold">
              {metrics.forecastTempC}°C · {metrics.humidityPct}% hum.
            </span>
          </div>

          <div className="wf-tile p-3">
            <span className="font-label flex items-center gap-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Gate-to-crib</span>
            </span>
            <span className="tabular-nums mt-0.5 block font-bold">{metrics.cribTransitMins} mins</span>
          </div>

          <div className="wf-tile p-3">
            <span className="font-label flex items-center gap-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
              <Baby className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Baby Hubs</span>
            </span>
            <span className="mt-0.5 block font-bold">{metrics.nursingHubsSummary.split('+')[0]}</span>
          </div>
        </div>

        {/* Honest trade-offs */}
        <ul className="mt-4 space-y-1.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
          {metrics.tradeOffs.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--wf-teal-container)' }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Hairline Status Strip */}
      <div
        className="mt-5 flex items-center justify-between gap-3 border-t pt-4"
        style={{ borderColor: 'var(--wf-outline)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <RuleChip
            status={withinBudget ? 'pass' : 'warn'}
            label={withinBudget ? 'Rule: Pass' : 'Rule: Review budget'}
          />
          <span className="tabular-nums font-label text-xs font-bold" style={{ color: 'var(--wf-teal)' }}>
            Fit score: {metrics.fitScore}%
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('checks')}
          className="font-label inline-flex min-h-[48px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors"
          style={{ color: 'var(--wf-teal)', backgroundColor: 'var(--wf-teal-soft)' }}
        >
          <span>Inspect rules</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function CompareView({ state, summary, onNavigate }: CompareViewProps) {
  const compareRows = [
    {
      title: 'Flight & Transit Endurance',
      standard: `Max safe: ${state.maxFlightHours}h`,
      ruleId: 'rule-01'
    },
    {
      title: 'Midday Thermal Comfort & UV',
      standard: `Ceiling: ${state.heatLimitC}°C`,
      ruleId: 'rule-02'
    },
    {
      title: 'Midday Nap Gate-to-Crib',
      standard: `Target <= ${state.maxCribTransitMins}m`,
      ruleId: 'rule-03'
    },
    {
      title: 'Budget Ceiling & Avios Offset',
      standard: `Cap: €${state.budgetCeilingEur.toLocaleString('en-IE')}`,
      ruleId: 'rule-05'
    }
  ];

  return (
    <div className="space-y-7 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Side-by-Side Decision Studio
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">
            {summary.primaryMetrics.name} vs {summary.secondaryMetrics.name}
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            All facts checked against sleep rhythm, {state.heatLimitC}°C thermal comfort, and insurance rules.
          </p>
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('change')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--wf-card)',
              color: 'var(--wf-ink)',
              boxShadow: 'var(--wf-shadow)'
            }}
          >
            <span>Re-run parameters</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('checks')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{
              backgroundColor: 'var(--wf-teal-container)',
              boxShadow: '0 4px 12px rgba(47, 111, 115, 0.22)'
            }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>See all 9 checks</span>
          </button>
        </div>
      </section>

      {/* Hero Destination Cards */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HeroDestinationCard
          metrics={summary.primaryMetrics}
          budgetCeilingEur={state.budgetCeilingEur}
          onNavigate={onNavigate}
        />
        <HeroDestinationCard
          metrics={summary.secondaryMetrics}
          budgetCeilingEur={state.budgetCeilingEur}
          onNavigate={onNavigate}
        />
      </section>

      {/* Calm Parameter-by-Parameter Comparison Matrix */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Comprehensive Decision Parameters</h2>
          <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
            Synced live with your rules engine
          </span>
        </div>

        <div className="space-y-4">
          {compareRows.map((row) => {
            const rule = summary.rules.find((r) => r.id === row.ruleId);
            if (!rule) return null;

            return (
              <div key={row.ruleId} className="wf-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{row.title}</h3>
                  <span
                    className="font-label rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}
                  >
                    {row.standard}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[rule.leftComparison, rule.rightComparison].map((side) => (
                    <div key={side.destinationId} className="wf-tile p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-label text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                          {side.label}
                        </span>
                        <RuleChip status={side.status} />
                      </div>
                      <p className="mt-2 text-sm font-medium">{side.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steward Synthesis Recommendation Card */}
      <section
        className="wf-card p-6"
        style={{
          background: 'linear-gradient(180deg, rgba(108, 99, 168, 0.06) 0%, var(--wf-card) 100%)'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <SuggestedChip text="Steward Synthesis · AI Analysis" />
          </div>
          <div className="flex flex-wrap gap-2">
            <RuleChip status="pass" label={`${summary.passCount} Pass`} />
            {summary.warnCount > 0 && <RuleChip status="warn" label={`${summary.warnCount} Review`} />}
          </div>
        </div>

        <p className="mt-3 text-base sm:text-lg">{summary.stewardSynthesis}</p>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t pt-4 sm:flex-row sm:items-center" style={{ borderColor: 'var(--wf-outline)' }}>
          <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
            <Wallet className="h-4 w-4 shrink-0" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
            <span>€0 due today · Nothing held or booked from Compare.</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('approvals')}
            className="font-label inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold"
            style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-teal)' }}
          >
            <span>Preview Approval Queue</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
