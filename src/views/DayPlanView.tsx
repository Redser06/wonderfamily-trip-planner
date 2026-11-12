import { Activity, Baby, Clock, Download, MapPin, Moon, Waves } from 'lucide-react';
import { buildIcsCalendarFile } from '../engine/tripEngine.ts';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { EvaluationSummary, PacingProfileId, TripState } from '../types/trip.ts';

interface DayPlanViewProps {
  state: TripState;
  summary: EvaluationSummary;
  onChangeState: (updater: (prev: TripState) => TripState) => void;
}

export function DayPlanView({ state, summary, onChangeState }: DayPlanViewProps) {
  const recommendedDest = summary.primaryMetrics.recommended
    ? summary.primaryMetrics
    : summary.secondaryMetrics;
  const { dayPlan } = summary;

  const downloadIcs = () => {
    const icsText = buildIcsCalendarFile(dayPlan, recommendedDest.name);
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wonderfamily-day-${dayPlan.dayNumber}-${recommendedDest.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Step 6 of 6 · Day-by-Day Blueprint ({recommendedDest.name})
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{dayPlan.dayTitle}</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            {dayPlan.dateLabel} · {dayPlan.focusTheme} · Nap-protected calm cadence.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadIcs}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-teal)'
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export .ICS Calendar</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({ ...prev, swapAfternoonPool: !prev.swapAfternoonPool }))
            }
            className="font-label hidden min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white lg:inline-flex"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            <Waves className="h-4 w-4" aria-hidden="true" />
            <span>
              {state.swapAfternoonPool
                ? 'Restore Indoor Park Gallery'
                : 'Swap Afternoon Activity with Hotel Pool'}
            </span>
          </button>
        </div>
      </section>

      {/* Developmental Pacing Switcher + 6-Day Tabs */}
      <section className="wf-card space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-label text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
              Developmental Pacing Profile
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { id: 'toddler_infant', label: 'Toddler (2–3yo) + Baby (9mo)' },
                  { id: 'elementary_6yo', label: 'Elementary (6yo) Pace' },
                  { id: 'multi_age', label: 'Multi-Age Rider Swap' }
                ] as Array<{ id: PacingProfileId; label: string }>
              ).map((profile) => {
                const active = state.pacingProfile === profile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onChangeState((prev) => ({ ...prev, pacingProfile: profile.id }))}
                    className="font-label min-h-[48px] rounded-xl border px-3.5 text-xs font-bold sm:text-sm"
                    style={{
                      backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
                      borderColor: active ? 'var(--wf-teal-container)' : 'var(--wf-outline)',
                      color: active ? '#ffffff' : 'var(--wf-ink)'
                    }}
                  >
                    {profile.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({
                ...prev,
                extraNapMinutes: prev.extraNapMinutes === 30 ? 0 : 30
              }))
            }
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl border px-3.5 text-xs font-bold"
            style={{
              backgroundColor: state.extraNapMinutes === 30 ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
              borderColor: state.extraNapMinutes === 30 ? 'var(--wf-teal)' : 'var(--wf-outline)',
              color: 'var(--wf-teal)'
            }}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{state.extraNapMinutes === 30 ? 'Nap Extended (+30m)' : 'Extend Nap +30 mins'}</span>
          </button>
        </div>

        {/* 6-Day Selector */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="tablist" aria-label="Select itinerary day">
          {[1, 2, 3, 4, 5, 6].map((day) => {
            const active = state.activeDay === day;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeState((prev) => ({ ...prev, activeDay: day }))}
                className="font-label tabular-nums min-h-[48px] rounded-xl border px-2 text-sm font-bold"
                style={{
                  backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                  borderColor: active ? 'var(--wf-teal)' : 'var(--wf-outline)',
                  color: active ? 'var(--wf-teal)' : 'var(--wf-ink)'
                }}
              >
                Day {day}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Timeline + Support Radar Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Timeline Blocks (8 columns) */}
        <div className="space-y-3.5 lg:col-span-8">
          {dayPlan.items.map((item) => (
            <article
              key={item.id}
              className="wf-card p-5 transition-colors"
              style={{
                backgroundColor: item.isSanctuaryBreak ? 'var(--wf-teal-soft)' : 'var(--wf-card)',
                borderColor: item.isSanctuaryBreak ? 'var(--wf-teal)' : 'var(--wf-outline)',
                borderWidth: item.isSanctuaryBreak ? '2px' : '1px'
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="tabular-nums font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold"
                    style={{
                      backgroundColor: item.isSanctuaryBreak ? 'var(--wf-teal-container)' : 'var(--wf-card-high)',
                      color: item.isSanctuaryBreak ? '#ffffff' : 'var(--wf-ink)'
                    }}
                  >
                    {item.isSanctuaryBreak && <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{item.timeRange}</span>
                  </span>
                  <span className="font-label text-xs font-extrabold tracking-wider uppercase" style={{ color: 'var(--wf-muted)' }}>
                    {item.categoryTag}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.aiChip && <SuggestedChip text={item.aiChip} />}
                  {item.ruleChip && <RuleChip status={item.ruleChip.status} label={item.ruleChip.text} />}
                </div>
              </div>

              <h2 className="mt-2.5 text-lg font-extrabold">{item.title}</h2>
              <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
                {item.description}
              </p>

              <div className="font-label mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.locationLabel}</span>
                </span>
                {typeof item.walkTimeMins === 'number' && (
                  <span className="tabular-nums inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{item.walkTimeMins === 0 ? 'Zero transfer (In Suite)' : `${item.walkTimeMins} min flat stroller walk`}</span>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Support Rail (4 columns) */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="wf-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                <h2 className="text-base font-extrabold">Fatigue &amp; Heat Radar</h2>
              </div>
              <RuleChip status={dayPlan.fatigueStatus} label={dayPlan.fatigueStatus === 'pass' ? 'Rule: Calm Load' : 'Rule: Elevated'} />
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Daily stimulation index</span>
                <span className="tabular-nums">{dayPlan.fatigueScore}/100</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--wf-card-high)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${dayPlan.fatigueScore}%`,
                    backgroundColor: 'var(--wf-teal-container)'
                  }}
                />
              </div>
              <p className="font-label mt-2 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                {dayPlan.peakTempLabel}
              </p>
            </div>
          </div>

          <div className="wf-card p-5">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <h2 className="text-base font-extrabold">Baby Care &amp; Support Hubs</h2>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--wf-muted)' }}>
              {dayPlan.babyHubSummary}. Bottle warmers, quiet dimmed nursing gliders, and complimentary changing supplies on route.
            </p>
          </div>

          <div className="wf-card p-5">
            <h2 className="text-base font-extrabold">Stroller &amp; Gear Logistics</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--wf-muted)' }}>
              {dayPlan.strollerTip}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
