import type { CSSProperties } from 'react';
import {
  AlertCircle,
  Baby,
  Building2,
  Calendar,
  Check,
  Home,
  Plane,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Thermometer,
  Users,
  Wallet
} from 'lucide-react';
import { createEmptyTripState, createInitialTripState, DESTINATION_SPECS } from '../data/destinations.ts';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { DestinationId, EvaluationSummary, StayType, TripState } from '../types/trip.ts';

interface TripSetupViewProps {
  state: TripState;
  summary: EvaluationSummary;
  onChangeState: (updater: (prev: TripState) => TripState) => void;
  onStartCompare: () => void;
  isComparing: boolean;
}

export function TripSetupView({
  state,
  summary,
  onChangeState,
  onStartCompare,
  isComparing
}: TripSetupViewProps) {
  const allDobsBlank = state.travellers.every((t) => !t.dob);
  const isEmptyMode = allDobsBlank && !state.travelMonth && state.budgetCeilingEur === 0;
  const canSubmit = !isEmptyMode && !summary.hasBlockingDobError && Boolean(state.travelMonth);

  const toggleDestination = (destId: DestinationId) => {
    onChangeState((prev) => {
      const [first, second] = prev.selectedDestinations;
      if (first === destId || second === destId) {
        return prev;
      }
      return {
        ...prev,
        selectedDestinations: [first, destId]
      };
    });
  };

  const applySampleOverThreeTest = () => {
    onChangeState((prev) => ({
      ...createInitialTripState(),
      confirmOverThreeTicket: false,
      travellers: prev.travellers.map((t) =>
        t.id === 'child-1' ? { ...t, dob: '2024-05-14' } : t
      )
    }));
  };

  const flexPct = Math.round((state.flexibleWeeks / 4) * 100);
  const heatPct = Math.round(((state.heatLimitC - 20) / 16) * 100);
  const flightPct = Math.round(((state.maxFlightHours - 2) / 12) * 100);

  return (
    <div className="space-y-7 pb-36 lg:pb-12">
      {/* Editorial Hero Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <SuggestedChip text="Suggested Setup Rhythm" />
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Plan your calm family journey
          </h1>
          <p className="mt-1.5 text-base sm:text-lg" style={{ color: 'var(--wf-muted)' }}>
            Input your family rhythm, warmth limit, and points balance. WonderFamily checks every rule before anything is held.
          </p>
        </div>

        {/* Clean Borderless Segmented Presets */}
        <div
          className="inline-flex flex-wrap gap-1.5 rounded-2xl p-1.5"
          style={{ backgroundColor: 'var(--wf-card-mid)' }}
          role="group"
          aria-label="Form state presets"
        >
          <button
            type="button"
            onClick={() => onChangeState(() => createInitialTripState())}
            className="font-label min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--wf-card)',
              color: 'var(--wf-teal)',
              boxShadow: '0 1px 2px rgba(17, 30, 31, 0.05)'
            }}
          >
            Sample Family
          </button>
          <button
            type="button"
            onClick={() => onChangeState(() => createEmptyTripState())}
            className="font-label min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--wf-muted)' }}
          >
            Clear (Empty)
          </button>
          <button
            type="button"
            onClick={applySampleOverThreeTest}
            className="font-label min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: 'var(--wf-amber-soft)',
              color: 'var(--wf-amber-ink)'
            }}
          >
            Test 3yo DOB Error
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* Main Stacked Cards (8 columns desktop) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Family Travelling Party */}
          <section className="wf-card p-6 sm:p-7" aria-labelledby="setup-travellers-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
                >
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="setup-travellers-heading" className="text-lg font-bold">
                    Family Travelling Party
                  </h2>
                  <p className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                    Calibrated for ages, bassinet guidelines, and midday nap needs
                  </p>
                </div>
              </div>
              <RuleChip
                status={summary.hasBlockingDobError ? 'fail' : 'pass'}
                label={summary.hasBlockingDobError ? 'Rule: Check DOB' : 'Rule: Pass'}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {state.travellers.map((traveller, index) => {
                const ageEval = summary.travellerAges[index];
                const hasError = Boolean(ageEval?.inlineError);
                const inputId = `traveller-dob-${traveller.id}`;

                return (
                  <div
                    key={traveller.id}
                    className="rounded-2xl p-4 transition-colors"
                    style={{
                      backgroundColor: hasError ? 'var(--wf-error-soft)' : 'var(--wf-card-low)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-label text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                          {traveller.roleLabel}
                        </span>
                        <div className="text-base font-bold">{traveller.name}</div>
                      </div>
                      <span
                        className="tabular-nums font-label rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: ageEval?.isThreeOrOverOnTravelDates
                            ? 'var(--wf-error)'
                            : 'var(--wf-card)',
                          color: ageEval?.isThreeOrOverOnTravelDates ? '#ffffff' : 'var(--wf-teal)'
                        }}
                      >
                        {ageEval?.formattedAge ?? 'DOB'}
                      </span>
                    </div>

                    <label
                      htmlFor={inputId}
                      className="font-label mt-3 block text-xs font-semibold"
                      style={{ color: 'var(--wf-muted)' }}
                    >
                      Date of birth
                    </label>
                    <input
                      id={inputId}
                      type="date"
                      value={traveller.dob}
                      onChange={(e) => {
                        const newDob = e.target.value;
                        onChangeState((prev) => ({
                          ...prev,
                          confirmOverThreeTicket: false,
                          travellers: prev.travellers.map((item) =>
                            item.id === traveller.id ? { ...item, dob: newDob } : item
                          )
                        }));
                      }}
                      className="wf-input-pill tabular-nums mt-1 min-h-[48px] w-full px-3.5 text-base font-medium"
                      style={{
                        borderColor: hasError ? 'var(--wf-error)' : undefined
                      }}
                    />

                    {hasError && ageEval?.inlineError && (
                      <div className="mt-2.5 space-y-2" role="alert">
                        <p className="flex items-start gap-1.5 text-sm font-semibold" style={{ color: 'var(--wf-error)' }}>
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{ageEval.inlineError}</span>
                        </p>
                        {ageEval.isThreeOrOverOnTravelDates && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeState((prev) => ({
                                ...prev,
                                confirmOverThreeTicket: !prev.confirmOverThreeTicket
                              }))
                            }
                            className="font-label inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold"
                            style={{
                              backgroundColor: state.confirmOverThreeTicket
                                ? 'var(--wf-teal-container)'
                                : 'var(--wf-card)',
                              color: state.confirmOverThreeTicket ? '#ffffff' : 'var(--wf-ink)'
                            }}
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span>
                              {state.confirmOverThreeTicket
                                ? '3+ Child Ticket Confirmed (+€340 included)'
                                : 'Confirm 3+ child park ticket (+€340)'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Card 2: Destinations & Travel Window */}
          <section className="wf-card p-6 sm:p-7" aria-labelledby="setup-window-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
                >
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="setup-window-heading" className="text-lg font-bold">
                    Travel Window &amp; Candidate Hubs
                  </h2>
                  <p className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                    Compare two family hubs side by side while skipping ultra-long-haul options
                  </p>
                </div>
              </div>
              <SuggestedChip text="2 active compared" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="wf-tile p-4">
                <label htmlFor="travel-month-input" className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                  Target month
                </label>
                <input
                  id="travel-month-input"
                  type="month"
                  value={state.travelMonth}
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      travelMonth: e.target.value
                    }))
                  }
                  className="wf-input-pill tabular-nums mt-1.5 min-h-[48px] w-full px-3.5 text-base font-semibold"
                />
              </div>

              <div className="wf-tile p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="flex-weeks-slider" className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                    Flexible window
                  </label>
                  <span className="tabular-nums font-label text-sm font-bold" style={{ color: 'var(--wf-teal)' }}>
                    ± {state.flexibleWeeks} week{state.flexibleWeeks === 1 ? '' : 's'}
                  </span>
                </div>
                <input
                  id="flex-weeks-slider"
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={state.flexibleWeeks}
                  style={{ '--slider-pct': `${flexPct}%` } as CSSProperties}
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      flexibleWeeks: Number(e.target.value)
                    }))
                  }
                  className="wf-range mt-5"
                />
                <div className="font-label mt-2 flex justify-between text-[11px]" style={{ color: 'var(--wf-muted)' }}>
                  <span>Exact week</span>
                  <span>±2 wks</span>
                  <span>±4 wks</span>
                </div>
              </div>
            </div>

            {/* Destination Cards */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['orlando', 'paris', 'tokyo'] as DestinationId[]).map((id) => {
                const spec = DESTINATION_SPECS[id];
                const isSelected = state.selectedDestinations.includes(id);

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleDestination(id)}
                    aria-pressed={isSelected}
                    className="flex min-h-[116px] flex-col justify-between rounded-2xl p-4 text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                      boxShadow: isSelected ? 'inset 0 0 0 2px var(--wf-teal-container)' : 'none'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="block text-base font-bold">{spec.name}</span>
                        <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                          {spec.subtitle}
                        </span>
                      </div>
                      <span
                        className="font-label rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{
                          backgroundColor: isSelected ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                          color: isSelected ? '#ffffff' : 'var(--wf-muted)'
                        }}
                      >
                        {isSelected ? 'Selected' : 'Skipped'}
                      </span>
                    </div>

                    <p className="font-label mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: isSelected ? 'var(--wf-teal)' : 'var(--wf-amber-ink)' }}>
                      <Plane className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {isSelected
                          ? `${spec.flightLabel} · ${spec.baseTempC}°C`
                          : `${spec.flightDurationHours}h flight (> ${state.maxFlightHours}h limit)`}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card 3: Comfort, Flight & Heat Thresholds */}
          <section className="wf-card p-6 sm:p-7" aria-labelledby="setup-rules-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
                >
                  <Thermometer className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="setup-rules-heading" className="text-lg font-bold">
                    Comfort, Thermal &amp; Stay Limits
                  </h2>
                  <p className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                    Threshold guardrails evaluated automatically across both destinations
                  </p>
                </div>
              </div>
              <RuleChip status="pass" label="Rule: Live Eval" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="wf-tile p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="heat-limit-slider" className="font-label flex items-center gap-1.5 text-sm font-semibold">
                    <Sun className="h-4 w-4" style={{ color: 'var(--wf-amber)' }} aria-hidden="true" />
                    <span>Daily high heat limit</span>
                  </label>
                  <span className="tabular-nums font-label text-base font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                    {state.heatLimitC}°C
                  </span>
                </div>
                <input
                  id="heat-limit-slider"
                  type="range"
                  min={20}
                  max={36}
                  step={1}
                  value={state.heatLimitC}
                  style={{ '--slider-pct': `${heatPct}%` } as CSSProperties}
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      heatLimitC: Number(e.target.value)
                    }))
                  }
                  className="wf-range mt-4"
                />
                <div className="font-label mt-2 flex justify-between text-[11px]" style={{ color: 'var(--wf-muted)' }}>
                  <span>20°C Mild</span>
                  <span>28°C Infant safe</span>
                  <span>36°C Peak</span>
                </div>
              </div>

              <div className="wf-tile p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="max-flight-slider" className="font-label flex items-center gap-1.5 text-sm font-semibold">
                    <Baby className="h-4 w-4" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                    <span>Max direct flight hours</span>
                  </label>
                  <span className="tabular-nums font-label text-base font-extrabold" style={{ color: 'var(--wf-teal)' }}>
                    {state.maxFlightHours}h
                  </span>
                </div>
                <input
                  id="max-flight-slider"
                  type="range"
                  min={2}
                  max={14}
                  step={1}
                  value={state.maxFlightHours}
                  style={{ '--slider-pct': `${flightPct}%` } as CSSProperties}
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      maxFlightHours: Number(e.target.value)
                    }))
                  }
                  className="wf-range mt-4"
                />
                <div className="font-label mt-2 flex justify-between text-[11px]" style={{ color: 'var(--wf-muted)' }}>
                  <span>2h Hop</span>
                  <span>8h Fatigue limit</span>
                  <span>14h Ultra</span>
                </div>
              </div>
            </div>

            {/* Stay Type Chips */}
            <div className="mt-4">
              <span className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                Preferred accommodation stay type
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Stay type">
                {(
                  [
                    { id: 'villa', label: 'Villa', icon: Home },
                    { id: 'park_hotel', label: 'Park hotel', icon: Building2 },
                    { id: 'either', label: 'Either', icon: Sparkles }
                  ] as Array<{ id: StayType; label: string; icon: typeof Home }>
                ).map((option) => {
                  const active = state.stayType === option.id;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChangeState((prev) => ({ ...prev, stayType: option.id }))}
                      className="font-label inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
                        color: active ? '#ffffff' : 'var(--wf-ink)'
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Card 4: Financial Envelope & Loyalty Points */}
          <section className="wf-card p-6 sm:p-7" aria-labelledby="setup-budget-heading">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
              >
                <Wallet className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="setup-budget-heading" className="text-lg font-bold">
                  Financial Envelope &amp; Loyalty Points
                </h2>
                <p className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                  Net family budget cap after reward point flight deductions
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="wf-tile p-4">
                <label htmlFor="budget-ceiling-input" className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                  Total budget ceiling (€)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-bold" style={{ color: 'var(--wf-muted)' }}>
                    €
                  </span>
                  <input
                    id="budget-ceiling-input"
                    type="number"
                    min={0}
                    max={30000}
                    step={250}
                    value={state.budgetCeilingEur || ''}
                    placeholder="9000"
                    onChange={(e) =>
                      onChangeState((prev) => ({
                        ...prev,
                        budgetCeilingEur: Number(e.target.value) || 0
                      }))
                    }
                    className="wf-input-pill tabular-nums min-h-[48px] w-full py-2 pr-12 pl-8 text-lg font-bold"
                  />
                  <span className="font-label pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                    EUR
                  </span>
                </div>
              </div>

              <div className="wf-tile p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="avios-balance-input" className="font-label block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                    Avios balance to use
                  </label>
                  <span className="tabular-nums font-label text-xs font-semibold" style={{ color: 'var(--wf-pass)' }}>
                    Saves ~€{Math.max(summary.primaryMetrics.aviosSavingsEur, summary.secondaryMetrics.aviosSavingsEur).toLocaleString('en-IE')}
                  </span>
                </div>
                <div className="relative mt-1.5">
                  <input
                    id="avios-balance-input"
                    type="number"
                    min={0}
                    max={500000}
                    step={5000}
                    value={state.aviosBalance || ''}
                    placeholder="120000"
                    onChange={(e) =>
                      onChangeState((prev) => ({
                        ...prev,
                        aviosBalance: Number(e.target.value) || 0
                      }))
                    }
                    className="wf-input-pill tabular-nums min-h-[48px] w-full px-3.5 py-2 pr-12 text-lg font-bold"
                  />
                  <span className="font-label pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                    pts
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Desktop Steward Engine Sidebar (4 columns desktop) */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="wf-card p-6 sm:sticky sm:top-24">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--wf-teal-container)' }} />
                <h2 className="text-base font-bold">Steward Engine Readiness</h2>
              </div>
              <RuleChip
                status={
                  summary.hasBlockingDobError
                    ? 'fail'
                    : summary.warnCount > 0
                      ? 'warn'
                      : 'pass'
                }
                label={
                  summary.hasBlockingDobError
                    ? 'Rule: Fix DOB'
                    : `${summary.passCount}/9 Pass`
                }
              />
            </div>

            <div className="mt-4 space-y-2">
              <div className="wf-tile flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span style={{ color: 'var(--wf-muted)' }}>Flight fatigue cap</span>
                <span className="tabular-nums font-bold">{state.maxFlightHours}h Cap</span>
              </div>
              <div className="wf-tile flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span style={{ color: 'var(--wf-muted)' }}>Thermal ceiling</span>
                <span className="tabular-nums font-bold">{state.heatLimitC}°C Max</span>
              </div>
              <div className="wf-tile flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span style={{ color: 'var(--wf-muted)' }}>Party ages in Sept 2027</span>
                <span className="tabular-nums font-bold">
                  {summary.travellerAges
                    .filter((t) => t.role !== 'adult')
                    .map((t) => t.formattedAge)
                    .join(' · ')}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--wf-outline)' }}>
              <span className="font-label text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                Candidate Estimates
              </span>
              <div className="mt-2.5 space-y-2.5">
                {[summary.primaryMetrics, summary.secondaryMetrics].map((m) => (
                  <div key={m.id} className="wf-tile flex items-center justify-between p-3">
                    <div>
                      <span className="block font-bold">{m.name}</span>
                      <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                        {m.forecastTempC}°C · {m.flightHours}h flight
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="tabular-nums block font-extrabold">
                        €{m.netTotalEur.toLocaleString('en-IE')}
                      </span>
                      <span className="tabular-nums font-label text-xs font-semibold" style={{ color: 'var(--wf-teal)' }}>
                        Fit {m.fitScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl p-3 text-xs" style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}>
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <span>Zero-deposit architecture: comparing destinations never holds or charges any card.</span>
            </div>

            <button
              type="button"
              disabled={!canSubmit || isComparing}
              onClick={onStartCompare}
              className="font-label mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 lg:inline-flex"
              style={{
                backgroundColor: 'var(--wf-teal-container)',
                boxShadow: '0 4px 14px rgba(47, 111, 115, 0.24)'
              }}
            >
              {isComparing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Comparing destinations &amp; rules…</span>
                </>
              ) : (
                <span>Compare trips</span>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
