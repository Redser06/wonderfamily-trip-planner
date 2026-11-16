import { Activity, Baby, BedDouble, Clock, Download, MapPin, Moon, Sun, Utensils, Waves } from 'lucide-react';
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
    <div className="space-y-7 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SuggestedChip text="Circadian Sync Engine Active" />
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">
            Day-by-Day Plan: {recommendedDest.name}
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            {dayPlan.dayTitle} · {dayPlan.dateLabel} · {dayPlan.focusTheme}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={downloadIcs}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--wf-card)',
              color: 'var(--wf-teal)',
              boxShadow: 'var(--wf-shadow)'
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export Calendar (.ics)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeState((prev) => ({ ...prev, swapAfternoonPool: !prev.swapAfternoonPool }))
            }
            className="font-label hidden min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white lg:inline-flex"
            style={{
              backgroundColor: 'var(--wf-teal-container)',
              boxShadow: '0 4px 12px rgba(47, 111, 115, 0.22)'
            }}
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

      {/* Developmental Pacing Switcher + 6-Day Selector */}
      <section className="wf-card space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-label text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
              Family Pacing Persona &amp; Developmental Stage
            </span>
            <div className="mt-2.5 flex flex-wrap gap-2">
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
                    className="font-label min-h-[48px] rounded-xl px-4 text-xs font-semibold transition-all sm:text-sm"
                    style={{
                      backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                      color: active ? 'var(--wf-teal)' : 'var(--wf-ink)',
                      boxShadow: active ? 'inset 0 0 0 1.5px var(--wf-teal-container)' : 'none'
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
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: state.extraNapMinutes === 30 ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
              color: state.extraNapMinutes === 30 ? '#ffffff' : 'var(--wf-teal)'
            }}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{state.extraNapMinutes === 30 ? 'Nap Extended (+30m)' : 'Adjust Nap Window (+30 mins)'}</span>
          </button>
        </div>

        {/* 6-Day Selector Strip */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6" role="tablist" aria-label="Select itinerary day">
          {[1, 2, 3, 4, 5, 6].map((day) => {
            const active = state.activeDay === day;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeState((prev) => ({ ...prev, activeDay: day }))}
                className="font-label tabular-nums min-h-[52px] rounded-xl px-3 py-2 text-left transition-all"
                style={{
                  backgroundColor: active ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                  color: active ? 'var(--wf-teal)' : 'var(--wf-ink)',
                  boxShadow: active ? 'inset 0 0 0 1.5px var(--wf-teal-container)' : 'none'
                }}
              >
                <span className="block text-[11px] font-semibold uppercase" style={{ color: 'var(--wf-muted)' }}>
                  Sept {11 + day}
                </span>
                <span className="block text-sm font-bold">Day {day}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Timeline + Support Radar Grid */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Timeline Blocks (8 columns) */}
        <div className="space-y-4 lg:col-span-8">
          {dayPlan.items.map((item, idx) => {
            const Icon = item.isSanctuaryBreak
              ? BedDouble
              : idx === 0
                ? Sun
                : idx === 1
                  ? Baby
                  : idx === 5
                    ? Utensils
                    : Clock;

            return (
              <article
                key={item.id}
                className={`${item.isSanctuaryBreak ? 'wf-sanctuary' : 'wf-card'} p-5 sm:p-6`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: item.isSanctuaryBreak ? 'var(--wf-violet)' : 'var(--wf-card-low)',
                      color: item.isSanctuaryBreak ? '#ffffff' : 'var(--wf-teal)'
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums font-label text-sm font-bold" style={{ color: 'var(--wf-teal)' }}>
                          {item.timeRange}
                        </span>
                        {item.aiChip && <SuggestedChip text={item.aiChip} />}
                        {item.ruleChip && <RuleChip status={item.ruleChip.status} label={item.ruleChip.text} />}
                      </div>

                      <span
                        className="font-label inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}
                      >
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        <span>{item.locationLabel}</span>
                      </span>
                    </div>

                    <h2 className="mt-1.5 text-lg font-bold">{item.title}</h2>
                    <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
                      {item.description}
                    </p>

                    {item.isSanctuaryBreak ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['White Noise: 50dB', 'AC Preset: 20.5°C', 'Adult Recharge Zone'].map((badge) => (
                          <span
                            key={badge}
                            className="font-label inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: 'var(--wf-card)', color: 'var(--wf-ink)' }}
                          >
                            <Moon className="h-3 w-3" style={{ color: 'var(--wf-violet)' }} aria-hidden="true" />
                            <span>{badge}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      typeof item.walkTimeMins === 'number' && (
                        <p className="font-label tabular-nums mt-2.5 text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
                          {item.walkTimeMins === 0 ? 'Zero transfer (In Suite)' : `${item.walkTimeMins} min flat stroller walk`}
                        </p>
                      )
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Support Rail (4 columns) */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="wf-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                <h2 className="text-base font-bold">Fatigue &amp; Heat Radar</h2>
              </div>
              <RuleChip status={dayPlan.fatigueStatus} label={dayPlan.fatigueStatus === 'pass' ? 'Calm Load' : 'Elevated'} />
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm font-semibold">
                <span style={{ color: 'var(--wf-muted)' }}>Toddler Sensory Load</span>
                <span className="tabular-nums font-bold">{dayPlan.fatigueScore}/100</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--wf-card-high)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${dayPlan.fatigueScore}%`,
                    backgroundColor: 'var(--wf-teal-container)'
                  }}
                />
              </div>
              <p className="font-label mt-3 text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
                {dayPlan.peakTempLabel}
              </p>
            </div>
          </div>

          <div className="wf-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <h2 className="text-base font-bold">Baby Care &amp; Support Hubs</h2>
            </div>
            <div className="wf-tile mt-3 p-3.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
              {dayPlan.babyHubSummary}. Bottle warmers, dimmed nursing gliders, and fresh water refills on route.
            </div>
          </div>

          <div className="wf-card p-5 sm:p-6">
            <h2 className="text-base font-bold">Stroller &amp; Equipment Logistics</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--wf-muted)' }}>
              {dayPlan.strollerTip}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
