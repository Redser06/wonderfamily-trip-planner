import type { CSSProperties } from 'react';
import { ArrowRight, RefreshCw, RotateCcw, Sparkles, SlidersHorizontal } from 'lucide-react';
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

function PillSwitch({
  checked,
  label,
  onToggle
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="relative inline-flex h-12 min-w-[60px] shrink-0 items-center justify-center rounded-xl p-1"
    >
      <span
        className="flex h-8 w-14 items-center rounded-full p-1 transition-colors"
        style={{
          backgroundColor: checked ? 'var(--wf-teal-container)' : 'var(--wf-card-high)'
        }}
      >
        <span
          className="h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
          style={{
            transform: checked ? 'translateX(24px)' : 'translateX(0px)'
          }}
        />
      </span>
    </button>
  );
}

export function ChangeRerunView({
  committedSummary,
  draft,
  onChangeDraft,
  onApplyAndReturn,
  onDiscardAndReturn
}: ChangeRerunViewProps) {
  const projectedSummary = evaluateTrip(draft);
  const aviosPct = Math.round((draft.aviosBalance / 240000) * 100);

  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Tune Rules &amp; Mitigations
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">Change &amp; re-run</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Toggle smart mitigations or adjust thresholds to preview rule impact before committing.
          </p>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={onDiscardAndReturn}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--wf-card)',
              color: 'var(--wf-muted)',
              boxShadow: 'var(--wf-shadow)'
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Discard changes</span>
          </button>

          <button
            type="button"
            onClick={onApplyAndReturn}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{
              backgroundColor: 'var(--wf-teal-container)',
              boxShadow: '0 4px 12px rgba(47, 111, 115, 0.22)'
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Re-run checks &amp; keep changes</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Left Controls Workbench (7 columns desktop) */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1-Click AI Mitigations */}
          <section className="wf-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--wf-violet-soft)', color: 'var(--wf-violet-ink)' }}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-bold">Suggested Fixes</h2>
              </div>
              <SuggestedChip text="Suggested" />
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Overnight Flight Switch */}
              <div
                className="rounded-2xl p-4 transition-colors"
                style={{
                  backgroundColor: draft.mitigations.overnightFlight ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                      Orlando Flight · Rule 01
                    </span>
                    <h3 className="text-base font-bold">Outbound Overnight Sleeper Flight (19:30)</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--wf-muted)' }}>
                      Matches infant overnight circadian sleep instead of 9h daytime transit.
                    </p>
                  </div>
                  <PillSwitch
                    checked={draft.mitigations.overnightFlight}
                    label="Enable Outbound Overnight Sleeper Flight"
                    onToggle={() =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        mitigations: { ...prev.mitigations, overnightFlight: !prev.mitigations.overnightFlight }
                      }))
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5" style={{ borderColor: 'var(--wf-outline)' }}>
                  <span className="font-label text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
                    Rule impact:
                  </span>
                  <RuleChip status="warn" label="Rule: Review" />
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--wf-muted)' }} aria-hidden="true" />
                  <RuleChip
                    status={draft.mitigations.overnightFlight ? 'pass' : 'warn'}
                    label={draft.mitigations.overnightFlight ? 'Rule: Pass' : 'Pending toggle'}
                  />
                </div>
              </div>

              {/* Mandatory AC Break Switch */}
              <div
                className="rounded-2xl p-4 transition-colors"
                style={{
                  backgroundColor: draft.mitigations.middayAcBreak ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                      Thermal Guardrail · Rule 02
                    </span>
                    <h3 className="text-base font-bold">Mandatory 12:30–15:30 AC Pavilion Break</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--wf-muted)' }}>
                      Avoids peak afternoon heat index outdoors with automatic suite siesta blocks.
                    </p>
                  </div>
                  <PillSwitch
                    checked={draft.mitigations.middayAcBreak}
                    label="Enable Mandatory Midday AC Break"
                    onToggle={() =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        mitigations: { ...prev.mitigations, middayAcBreak: !prev.mitigations.middayAcBreak }
                      }))
                    }
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5" style={{ borderColor: 'var(--wf-outline)' }}>
                  <span className="font-label text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
                    Thermal rating:
                  </span>
                  <RuleChip status="warn" label="Rule: Review" />
                  <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--wf-muted)' }} aria-hidden="true" />
                  <RuleChip
                    status={draft.mitigations.middayAcBreak ? 'pass' : 'warn'}
                    label={draft.mitigations.middayAcBreak ? 'Rule: Pass' : 'Pending toggle'}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Trip Parameters */}
          <section className="wf-card space-y-5 p-6">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold">Trip Parameters</h2>
            </div>

            <div>
              <span className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                Travel week flexibility
              </span>
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
                      className="font-label min-h-[48px] rounded-xl px-3 text-xs font-semibold transition-all sm:text-sm"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
                        color: active ? '#ffffff' : 'var(--wf-ink)'
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                  Max gate-to-crib nap transit
                </span>
                <span className="tabular-nums font-label text-sm font-bold" style={{ color: 'var(--wf-teal)' }}>
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
                      className="font-label tabular-nums min-h-[48px] rounded-xl px-3 text-xs font-semibold sm:text-sm"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                        color: active ? 'var(--wf-teal)' : 'var(--wf-ink)',
                        boxShadow: active ? 'inset 0 0 0 1.5px var(--wf-teal-container)' : 'none'
                      }}
                    >
                      {mins}m {mins === 15 ? '(Strict)' : mins === 20 ? '(Balanced)' : '(Villa OK)'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                Stroller logistics
              </span>
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
                      className="font-label min-h-[48px] rounded-xl px-3 text-xs font-semibold sm:text-sm"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                        color: active ? 'var(--wf-teal)' : 'var(--wf-ink)',
                        boxShadow: active ? 'inset 0 0 0 1.5px var(--wf-teal-container)' : 'none'
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="wf-tile p-4">
                <span className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                  Max cash ceiling
                </span>
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
                    className="wf-input-pill font-label min-h-[48px] min-w-[48px] text-lg font-bold"
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
                    className="wf-input-pill font-label min-h-[48px] min-w-[48px] text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="wf-tile p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="draft-avios-slider" className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                    Avios applied
                  </label>
                  <span className="tabular-nums font-label text-sm font-bold" style={{ color: 'var(--wf-teal)' }}>
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
                  style={{ '--slider-pct': `${aviosPct}%` } as CSSProperties}
                  onChange={(e) =>
                    onChangeDraft((prev) => ({ ...prev, aviosBalance: Number(e.target.value) }))
                  }
                  className="wf-range mt-5"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Projected Impact Card (5 columns desktop) */}
        <aside className="lg:col-span-5">
          <div className="wf-card p-6 sm:sticky sm:top-24">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Projected Engine Impact</h2>
              <span className="font-label text-[11px] font-bold tracking-wider uppercase" style={{ color: 'var(--wf-teal)' }}>
                Live Preview
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="wf-tile p-4">
                <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                  Previous Check
                </span>
                <p className="tabular-nums mt-1 text-xl font-extrabold">
                  {committedSummary.passCount} Pass · {committedSummary.warnCount} Warn
                </p>
                <span className="tabular-nums font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                  {committedSummary.failCount} Fail
                </span>
              </div>

              <div
                className="rounded-2xl p-4 transition-colors"
                style={{
                  backgroundColor:
                    projectedSummary.warnCount === 0 && projectedSummary.failCount === 0
                      ? 'var(--wf-pass-soft)'
                      : 'var(--wf-amber-soft)'
                }}
              >
                <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-ink)' }}>
                  Projected After
                </span>
                <p className="tabular-nums mt-1 text-xl font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                  {projectedSummary.passCount} Pass · {projectedSummary.warnCount} Warn
                </p>
                <span className="tabular-nums font-label text-xs font-semibold" style={{ color: 'var(--wf-ink)' }}>
                  {projectedSummary.failCount} Fail
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 border-t pt-4" style={{ borderColor: 'var(--wf-outline)' }}>
              {[projectedSummary.primaryMetrics, projectedSummary.secondaryMetrics].map((dest) => (
                <div key={dest.id} className="wf-tile flex items-center justify-between p-3.5">
                  <div>
                    <span className="block font-bold">{dest.name}</span>
                    <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                      {dest.effectiveTempC}°C effective · {dest.cribTransitMins}m crib
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums block font-extrabold">
                      €{dest.netTotalEur.toLocaleString('en-IE')}
                    </span>
                    <span className="tabular-nums font-label text-xs font-semibold" style={{ color: 'var(--wf-teal)' }}>
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
                    ? 'All 9 rules satisfied'
                    : `Rule: ${projectedSummary.warnCount} warn / ${projectedSummary.failCount} fail`
                }
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5 lg:hidden">
              <button
                type="button"
                onClick={onDiscardAndReturn}
                className="font-label min-h-[48px] w-full rounded-xl px-4 text-sm font-semibold"
                style={{
                  backgroundColor: 'var(--wf-card-low)',
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
