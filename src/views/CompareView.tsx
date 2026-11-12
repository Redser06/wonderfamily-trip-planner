import { ArrowRight, Baby, Clock, Plane, ShieldCheck, Sun, Wallet } from 'lucide-react';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { AppTab, DestinationComputedMetrics, EvaluationSummary, TripState } from '../types/trip.ts';

interface CompareViewProps {
  state: TripState;
  summary: EvaluationSummary;
  onNavigate: (tab: AppTab) => void;
}

function DestinationCard({
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
      className="wf-card flex flex-col justify-between p-5 sm:p-6"
      style={{
        borderColor: metrics.recommended ? 'var(--wf-teal)' : 'var(--wf-outline)',
        borderWidth: metrics.recommended ? '2px' : '1px'
      }}
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold">{metrics.name}</h2>
              {metrics.recommended && <SuggestedChip text="Recommended Fit" />}
            </div>
            <p className="font-label mt-0.5 text-sm font-medium" style={{ color: 'var(--wf-muted)' }}>
              {metrics.subtitle} · {metrics.regionBadge}
            </p>
          </div>

          <div
            className="tabular-nums rounded-2xl px-3.5 py-2 text-right"
            style={{ backgroundColor: 'var(--wf-teal-soft)' }}
          >
            <span className="font-label block text-[11px] font-bold uppercase" style={{ color: 'var(--wf-teal)' }}>
              Family Fit
            </span>
            <span className="text-xl font-extrabold" style={{ color: 'var(--wf-teal)' }}>
              {metrics.fitScore}%
            </span>
          </div>
        </div>

        {/* Headline Price vs Avios */}
        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: 'var(--wf-card-low)' }}>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                Net after Avios points
              </span>
              <span className="tabular-nums text-3xl font-extrabold">
                €{metrics.netTotalEur.toLocaleString('en-IE')}
              </span>
            </div>
            <div className="text-right">
              <span className="tabular-nums font-label block text-xs line-through" style={{ color: 'var(--wf-muted)' }}>
                Gross €{metrics.grossTotalEur.toLocaleString('en-IE')}
              </span>
              <span className="tabular-nums font-label text-xs font-bold" style={{ color: 'var(--wf-pass)' }}>
                Save €{metrics.aviosSavingsEur.toLocaleString('en-IE')} w/ Avios
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <RuleChip
              status={withinBudget ? 'pass' : 'warn'}
              label={
                withinBudget
                  ? `Rule: Pass (€${(budgetCeilingEur - metrics.netTotalEur).toLocaleString('en-IE')} buffer)`
                  : 'Rule: Review budget'
              }
            />
          </div>
        </div>

        {/* Key Parent Metrics */}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--wf-outline)' }}>
            <dt className="font-label flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
              <Plane className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Travel time</span>
            </dt>
            <dd className="tabular-nums mt-1 font-bold">{metrics.flightLabel}</dd>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--wf-outline)' }}>
            <dt className="font-label flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sept climate</span>
            </dt>
            <dd className="tabular-nums mt-1 font-bold">
              {metrics.forecastTempC}°C / {metrics.humidityPct}% hum.
            </dd>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--wf-outline)' }}>
            <dt className="font-label flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Gate-to-crib</span>
            </dt>
            <dd className="tabular-nums mt-1 font-bold">{metrics.cribTransitMins} min transit</dd>
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--wf-outline)' }}>
            <dt className="font-label flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
              <Baby className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Infant care</span>
            </dt>
            <dd className="mt-1 font-bold">{metrics.nursingHubsSummary.split('+')[0]}</dd>
          </div>
        </dl>

        {/* Cost breakdown */}
        <div className="mt-4 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--wf-outline)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--wf-muted)' }}>Stay · {metrics.hotelOrVillaName}</span>
            <span className="tabular-nums font-semibold">€{metrics.lodgingCostEur.toLocaleString('en-IE')}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--wf-muted)' }}>Flights (4 travellers)</span>
            <span className="tabular-nums font-semibold">€{metrics.flightCostEur.toLocaleString('en-IE')}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--wf-muted)' }}>Park entry &amp; meal estimate</span>
            <span className="tabular-nums font-semibold">€{metrics.ticketsAndDiningEur.toLocaleString('en-IE')}</span>
          </div>
        </div>

        {/* Honest trade-offs */}
        <ul className="mt-4 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--wf-outline)' }}>
          {metrics.tradeOffs.map((item) => (
            <li key={item} className="flex items-start gap-2" style={{ color: 'var(--wf-muted)' }}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--wf-teal)' }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Explicit anti-dark-pattern notice: holds ONLY happen on Screen 5 */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--wf-outline)' }}>
        <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
          €0 due today · No auto-hold
        </span>
        <button
          type="button"
          onClick={() => onNavigate('checks')}
          className="font-label inline-flex min-h-[48px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold"
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
  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Step 2 of 6 · Side-by-Side Comparison
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            {summary.primaryMetrics.name} vs {summary.secondaryMetrics.name}
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Calibrated for Sept 2027 ({state.heatLimitC}°C cap · €{state.budgetCeilingEur.toLocaleString('en-IE')} max).
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('change')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-ink)'
            }}
          >
            <span>Tweak rules</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('checks')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>See all 9 checks</span>
          </button>
        </div>
      </section>

      {/* AI Steward Synthesis Card */}
      <section
        className="wf-card p-5"
        style={{
          backgroundColor: 'var(--wf-card)',
          borderColor: 'color-mix(in srgb, var(--wf-violet) 38%, var(--wf-outline))'
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SuggestedChip text="Suggested · Steward Synthesis" />
          <div className="flex flex-wrap gap-2">
            <RuleChip status="pass" label={`${summary.passCount} Rules Pass`} />
            {summary.warnCount > 0 && (
              <RuleChip status="warn" label={`${summary.warnCount} Reviews`} />
            )}
            {summary.failCount > 0 && (
              <RuleChip status="fail" label={`${summary.failCount} Fails`} />
            )}
          </div>
        </div>
        <p className="mt-3 text-base font-medium">{summary.stewardSynthesis}</p>
      </section>

      {/* Two-Column Destination Comparison */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DestinationCard
          metrics={summary.primaryMetrics}
          budgetCeilingEur={state.budgetCeilingEur}
          onNavigate={onNavigate}
        />
        <DestinationCard
          metrics={summary.secondaryMetrics}
          budgetCeilingEur={state.budgetCeilingEur}
          onNavigate={onNavigate}
        />
      </section>

      {/* Bottom Desktop Reassurance & Clear Next Step */}
      <section className="wf-card-tinted flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Wallet className="mt-1 h-5 w-5 shrink-0" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold">Calm No-Book Guarantee</h3>
            <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
              Nothing can be held or reserved from this screen. Inspect the 9 baby, heat, and insurance checks next, or open the Approval Queue when ready.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('approvals')}
          className="font-label inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold"
          style={{
            backgroundColor: 'var(--wf-card)',
            borderColor: 'var(--wf-outline)',
            color: 'var(--wf-teal)'
          }}
        >
          <span>Preview Approval Queue</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
