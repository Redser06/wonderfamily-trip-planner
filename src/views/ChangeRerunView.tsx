import { RefreshCw, RotateCcw, Sparkles, SlidersHorizontal } from 'lucide-react';
import { evaluateTrip } from '../engine/tripEngine.ts';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { EvaluationSummary, StrollerMode, TripState, WeekShift } from '../types/trip.ts';

interface ChangeRerunViewProps {
  committedSummary: EvaluationSummary;
  draft: TripState;
  onChangeDraft: (updater: (prev: TripState) => TripState) => void;
  onApplyAndReturn: () => void;
  onDiscardAndReturn: () => void;
}

export function ChangeRerunView({
  committedSummary,
  draft,
  onChangeDraft,
  onApplyAndReturn,
  onDiscardAndReturn
}: ChangeRerunViewProps) {
  const projectedSummary = evaluateTrip(draft);

  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Step 4 of 6 · Change &amp; Re-run Rules
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Adjust rules &amp; mitigations</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Test overnight departures, cooler September weeks, or Avios sliders before updating your comparison.
          </p>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={onDiscardAndReturn}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-muted)'
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Discard changes</span>
          </button>

          <button
            type="button"
            onClick={onApplyAndReturn}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Re-run checks &amp; keep changes</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Controls Workbench (7 columns desktop) */}
        <div className="space-y-5 lg:col-span-7">
          {/* 1-Click AI Mitigations */}
          <section className="wf-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" style={{ color: 'var(--wf-violet)' }} aria-hidden="true" />
                <h2 className="text-lg font-extrabold">One-Tap Warning Mitigations</h2>
              </div>
              <SuggestedChip text="AI Mitigations" />
            </div>

            <div className="mt-4 space-y-3">
              {/* Overnight Flight Toggle */}
              <div
                className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                style={{
                  backgroundColor: draft.mitigations.overnightFlight ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                  borderColor: draft.mitigations.overnightFlight ? 'var(--wf-teal)' : 'var(--wf-outline)'
                }}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Outbound Overnight Sleeper Flight (19:30)</span>
                    <SuggestedChip />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
                    Aligns long-haul flights with toddler &amp; baby overnight sleep cycle, clearing Rule 01 transit review.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.mitigations.overnightFlight}
                  onClick={() =>
                    onChangeDraft((prev) => ({
                      ...prev,
                      mitigations: { ...prev.mitigations, overnightFlight: !prev.mitigations.overnightFlight }
                    }))
                  }
                  className="font-label min-h-[48px] min-w-[110px] shrink-0 rounded-xl px-4 text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: draft.mitigations.overnightFlight ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                    color: draft.mitigations.overnightFlight ? '#ffffff' : 'var(--wf-ink)',
                    border: '1px solid var(--wf-outline)'
                  }}
                >
                  {draft.mitigations.overnightFlight ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {/* Mandatory Midday AC Break Toggle */}
              <div
                className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                style={{
                  backgroundColor: draft.mitigations.middayAcBreak ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                  borderColor: draft.mitigations.middayAcBreak ? 'var(--wf-teal)' : 'var(--wf-outline)'
                }}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">Mandatory 12:30–15:30 AC Pavilion &amp; Crib Break</span>
                    <SuggestedChip />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
                    Pulls children indoors before afternoon thermal peaks, lowering heat index exposure and clearing Rule 02.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.mitigations.middayAcBreak}
                  onClick={() =>
                    onChangeDraft((prev) => ({
                      ...prev,
                      mitigations: { ...prev.mitigations, middayAcBreak: !prev.mitigations.middayAcBreak }
                    }))
                  }
                  className="font-label min-h-[48px] min-w-[110px] shrink-0 rounded-xl px-4 text-sm font-bold transition-colors"
                  style={{
                    backgroundColor: draft.mitigations.middayAcBreak ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                    color: draft.mitigations.middayAcBreak ? '#ffffff' : 'var(--wf-ink)',
                    border: '1px solid var(--wf-outline)'
                  }}
                >
                  {draft.mitigations.middayAcBreak ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>
          </section>

          {/* Dates, Transit, Stroller, Budget & Avios Tuners */}
          <section className="wf-card space-y-5 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <h2 className="text-lg font-extrabold">Dates, Crib Distance &amp; Spend Controls</h2>
            </div>

            {/* Week Shift */}
            <div>
              <span className="font-label block text-sm font-bold">Travel week flexibility</span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Travel week shift">
                {(
                  [
                    { id: 'early', label: 'Early Sept (+1.0°C)' },
                    { id: 'mid', label: 'Mid Sept (Baseline)' },
                    { id: 'late', label: 'Late Sept (-1.8°C · -€180)' }
                  ] as Array<{ id: WeekShift; label: string }>
                ).map((w) => {
                  const active = draft.weekShift === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChangeDraft((prev) => ({ ...prev, weekShift: w.id }))}
                      className="font-label min-h-[48px] rounded-xl border px-3 text-xs font-bold sm:text-sm"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
                        borderColor: active ? 'var(--wf-teal-container)' : 'var(--wf-outline)',
                        color: active ? '#ffffff' : 'var(--wf-ink)'
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gate-to-Crib Transit Cap */}
            <div>
              <div className="flex items-center justify-between">
                <span className="font-label text-sm font-bold">Max gate-to-crib nap transit</span>
                <span className="tabular-nums font-label text-sm font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                  {draft.maxCribTransitMins} mins
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[15, 20, 30].map((mins) => {
                  const active = draft.maxCribTransitMins === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => onChangeDraft((prev) => ({ ...prev, maxCribTransitMins: mins }))}
                      className="font-label tabular-nums min-h-[48px] rounded-xl border px-3 text-sm font-bold"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                        borderColor: active ? 'var(--wf-teal)' : 'var(--wf-outline)',
                        color: active ? 'var(--wf-teal)' : 'var(--wf-ink)'
                      }}
                    >
                      {mins}m {mins === 15 ? '(Strict)' : mins === 20 ? '(Balanced)' : '(Villa OK)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stroller Logistics */}
            <div>
              <span className="font-label block text-sm font-bold">Stroller logistics</span>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: 'gate_check', label: 'Gate-check compact fold' },
                    { id: 'checked_hold', label: 'Checked in hold bag' },
                    { id: 'park_rental', label: 'Park rental at gate' }
                  ] as Array<{ id: StrollerMode; label: string }>
                ).map((mode) => {
                  const active = draft.strollerMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onChangeDraft((prev) => ({ ...prev, strollerMode: mode.id }))}
                      className="font-label min-h-[48px] rounded-xl border px-3 text-xs font-bold sm:text-sm"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                        borderColor: active ? 'var(--wf-teal)' : 'var(--wf-outline)',
                        color: active ? 'var(--wf-teal)' : 'var(--wf-ink)'
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Ceiling Stepper & Avios Slider */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--wf-card-low)' }}>
                <span className="font-label block text-sm font-bold">Budget ceiling</span>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    aria-label="Decrease budget by 500 euros"
                    onClick={() =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        budgetCeilingEur: Math.max(2000, prev.budgetCeilingEur - 500)
                      }))
                    }
                    className="font-label min-h-[48px] min-w-[48px] rounded-xl border text-lg font-bold"
                    style={{ backgroundColor: 'var(--wf-card)', borderColor: 'var(--wf-outline)' }}
                  >
                    −
                  </button>
                  <span className="tabular-nums text-lg font-extrabold">
                    €{draft.budgetCeilingEur.toLocaleString('en-IE')}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase budget by 500 euros"
                    onClick={() =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        budgetCeilingEur: prev.budgetCeilingEur + 500
                      }))
                    }
                    className="font-label min-h-[48px] min-w-[48px] rounded-xl border text-lg font-bold"
                    style={{ backgroundColor: 'var(--wf-card)', borderColor: 'var(--wf-outline)' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--wf-card-low)' }}>
                <div className="flex items-center justify-between">
                  <label htmlFor="draft-avios-slider" className="font-label text-sm font-bold">
                    Avios applied
                  </label>
                  <span className="tabular-nums font-label text-sm font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                    {draft.aviosBalance.toLocaleString('en-IE')} pts
                  </span>
                </div>
                <input
                  id="draft-avios-slider"
                  type="range"
                  min={0}
                  max={240000}
                  step={10000}
                  value={draft.aviosBalance}
                  onChange={(e) =>
                    onChangeDraft((prev) => ({ ...prev, aviosBalance: Number(e.target.value) }))
                  }
                  className="mt-4 h-3 w-full cursor-pointer accent-[#2f6f73]"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Live Impact Simulator (5 columns desktop) */}
        <aside className="lg:col-span-5">
          <div className="wf-card p-5 sm:sticky sm:top-24 sm:p-6">
            <span className="font-label text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--wf-teal)' }}>
              Projected Engine Impact
            </span>
            <h2 className="mt-1 text-xl font-extrabold">Before vs. After Simulation</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3.5" style={{ backgroundColor: 'var(--wf-card-low)', borderColor: 'var(--wf-outline)' }}>
                <span className="font-label text-xs font-bold" style={{ color: 'var(--wf-muted)' }}>
                  Current Saved
                </span>
                <p className="tabular-nums mt-1 text-lg font-extrabold">
                  {committedSummary.passCount} Pass · {committedSummary.warnCount} Warn
                </p>
                <span className="tabular-nums font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                  {committedSummary.failCount} Fail
                </span>
              </div>

              <div
                className="rounded-xl border p-3.5"
                style={{
                  backgroundColor:
                    projectedSummary.warnCount === 0 && projectedSummary.failCount === 0
                      ? 'var(--wf-pass-soft)'
                      : 'var(--wf-amber-soft)',
                  borderColor: 'var(--wf-teal)'
                }}
              >
                <span className="font-label text-xs font-bold" style={{ color: 'var(--wf-ink)' }}>
                  Projected Result
                </span>
                <p className="tabular-nums mt-1 text-lg font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                  {projectedSummary.passCount} Pass · {projectedSummary.warnCount} Warn
                </p>
                <span className="tabular-nums font-label text-xs font-bold" style={{ color: 'var(--wf-ink)' }}>
                  {projectedSummary.failCount} Fail
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--wf-outline)' }}>
              {[projectedSummary.primaryMetrics, projectedSummary.secondaryMetrics].map((dest) => (
                <div
                  key={dest.id}
                  className="flex items-center justify-between rounded-xl border p-3"
                  style={{ borderColor: 'var(--wf-outline)' }}
                >
                  <div>
                    <span className="font-bold">{dest.name}</span>
                    <span className="font-label block text-xs" style={{ color: 'var(--wf-muted)' }}>
                      {dest.effectiveTempC}°C effective · {dest.cribTransitMins}m crib
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums block font-extrabold">
                      €{dest.netTotalEur.toLocaleString('en-IE')}
                    </span>
                    <span className="tabular-nums font-label text-xs font-bold" style={{ color: 'var(--wf-teal)' }}>
                      Fit {dest.fitScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <RuleChip
                status={
                  projectedSummary.failCount > 0
                    ? 'fail'
                    : projectedSummary.warnCount > 0
                      ? 'warn'
                      : 'pass'
                }
                label={
                  projectedSummary.warnCount === 0 && projectedSummary.failCount === 0
                    ? 'Rule: All 9 checks clear!'
                    : `Rule: ${projectedSummary.warnCount} warn / ${projectedSummary.failCount} fail`
                }
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 lg:hidden">
              <button
                type="button"
                onClick={onDiscardAndReturn}
                className="font-label min-h-[48px] w-full rounded-xl border px-4 text-sm font-bold"
                style={{
                  backgroundColor: 'var(--wf-card)',
                  borderColor: 'var(--wf-outline)',
                  color: 'var(--wf-muted)'
                }}
              >
                Discard adjustments
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
