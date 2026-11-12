import { AlertCircle, Baby, Calendar, Check, Plane, RefreshCw, Sparkles, Sun, Thermometer, Users, Wallet } from 'lucide-react';
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
        return prev; // Keep two destinations active for side-by-side comparison
      }
      // Replace second slot if adding Tokyo Bay
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

  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header & Preset State Pills */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Step 1 of 6 · Trip Setup
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Plan your trip</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Tell us who is travelling, your warmth limit, and points balance. Everything updates side-by-side without holding a card.
          </p>
        </div>

        {/* Helpful Preset State Triggers to inspect Empty / Sample / Child >= 3 Error states */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Form state presets">
          <button
            type="button"
            onClick={() => onChangeState(() => createInitialTripState())}
            className="font-label min-h-[48px] rounded-xl border px-3.5 text-xs font-bold"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-teal)'
            }}
          >
            Sample Family
          </button>
          <button
            type="button"
            onClick={() => onChangeState(() => createEmptyTripState())}
            className="font-label min-h-[48px] rounded-xl border px-3.5 text-xs font-bold"
            style={{
              backgroundColor: 'var(--wf-card)',
              borderColor: 'var(--wf-outline)',
              color: 'var(--wf-muted)'
            }}
          >
            Clear (Empty)
          </button>
          <button
            type="button"
            onClick={applySampleOverThreeTest}
            className="font-label min-h-[48px] rounded-xl border px-3.5 text-xs font-bold"
            style={{
              backgroundColor: 'var(--wf-amber-soft)',
              borderColor: 'var(--wf-amber)',
              color: 'var(--wf-amber-ink)'
            }}
          >
            Test 3yo DOB Error
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Stacked Cards (8 columns desktop) */}
        <div className="space-y-5 lg:col-span-8">
          {/* Card 1: Travellers & DOB Validation */}
          <section className="wf-card p-5 sm:p-6" aria-labelledby="setup-travellers-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                <h2 id="setup-travellers-heading" className="text-lg font-bold">
                  1. Travellers &amp; Dates of Birth
                </h2>
              </div>
              <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                2 Adults · 1 Toddler · 1 Baby
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {state.travellers.map((traveller, index) => {
                const ageEval = summary.travellerAges[index];
                const hasError = Boolean(ageEval?.inlineError);
                const inputId = `traveller-dob-${traveller.id}`;

                return (
                  <div
                    key={traveller.id}
                    className="rounded-xl border p-4 transition-colors"
                    style={{
                      backgroundColor: hasError ? 'var(--wf-error-soft)' : 'var(--wf-card-low)',
                      borderColor: hasError ? 'var(--wf-error)' : 'var(--wf-outline)'
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">{traveller.name}</span>
                        <span className="font-label ml-2 text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
                          {traveller.roleLabel}
                        </span>
                      </div>
                      <span
                        className="tabular-nums font-label rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: ageEval?.isThreeOrOverOnTravelDates
                            ? 'var(--wf-error)'
                            : 'var(--wf-card)',
                          color: ageEval?.isThreeOrOverOnTravelDates ? '#ffffff' : 'var(--wf-ink)'
                        }}
                      >
                        {ageEval?.formattedAge ?? 'DOB'}
                      </span>
                    </div>

                    <label htmlFor={inputId} className="font-label mt-3 block text-xs font-semibold" style={{ color: 'var(--wf-muted)' }}>
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
                      className="tabular-nums mt-1 min-h-[48px] w-full rounded-xl border px-3 text-base"
                      style={{
                        backgroundColor: 'var(--wf-card)',
                        borderColor: hasError ? 'var(--wf-error)' : 'var(--wf-outline)',
                        color: 'var(--wf-ink)'
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
                            className="font-label inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold"
                            style={{
                              backgroundColor: state.confirmOverThreeTicket ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                              color: state.confirmOverThreeTicket ? '#ffffff' : 'var(--wf-ink)',
                              borderColor: 'var(--wf-outline)'
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

          {/* Card 2: Travel Window & Flexibility */}
          <section className="wf-card p-5 sm:p-6" aria-labelledby="setup-window-heading">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <h2 id="setup-window-heading" className="text-lg font-bold">
                2. Travel Date Window
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="travel-month-input" className="font-label block text-sm font-semibold">
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
                  className="tabular-nums mt-1.5 min-h-[48px] w-full rounded-xl border px-3.5 text-base"
                  style={{
                    backgroundColor: 'var(--wf-card-low)',
                    borderColor: 'var(--wf-outline)',
                    color: 'var(--wf-ink)'
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="flex-weeks-slider" className="font-label text-sm font-semibold">
                    Flexible by weeks
                  </label>
                  <span className="tabular-nums font-label text-sm font-extrabold" style={{ color: 'var(--wf-teal)' }}>
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
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      flexibleWeeks: Number(e.target.value)
                    }))
                  }
                  className="mt-4 h-3 w-full cursor-pointer accent-[#2f6f73]"
                />
                <div className="font-label mt-1 flex justify-between text-xs" style={{ color: 'var(--wf-muted)' }}>
                  <span>Exact week</span>
                  <span>±2 wks</span>
                  <span>±4 wks</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Destinations to Compare */}
          <section className="wf-card p-5 sm:p-6" aria-labelledby="setup-destinations-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Plane className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                <h2 id="setup-destinations-heading" className="text-lg font-bold">
                  3. Destinations to Compare
                </h2>
              </div>
              <SuggestedChip text="2 active compared side by side" />
            </div>

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
                    className="flex min-h-[112px] flex-col justify-between rounded-2xl border p-4 text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--wf-teal-soft)' : 'var(--wf-card-low)',
                      borderColor: isSelected ? 'var(--wf-teal)' : 'var(--wf-outline)',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="block text-base font-extrabold">{spec.name}</span>
                        <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                          {spec.subtitle}
                        </span>
                      </div>
                      <span
                        className="font-label rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: isSelected ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                          color: isSelected ? '#ffffff' : 'var(--wf-muted)'
                        }}
                      >
                        {isSelected ? 'Selected' : 'Skipped'}
                      </span>
                    </div>

                    <p className="font-label mt-3 text-xs font-semibold" style={{ color: isSelected ? 'var(--wf-teal)' : 'var(--wf-amber-ink)' }}>
                      {isSelected
                        ? `${spec.flightLabel} · ${spec.baseTempC}°C avg`
                        : `Skipped: ${spec.flightDurationHours}h flight exceeds ${state.maxFlightHours}h infant limit (tap to compare)`}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card 4: Comfort, Heat, Budget, Points & Stay Type */}
          <section className="wf-card p-5 sm:p-6" aria-labelledby="setup-rules-heading">
            <div className="flex items-center gap-2.5">
              <Thermometer className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
              <h2 id="setup-rules-heading" className="text-lg font-bold">
                4. Heat Limit, Budget, Points &amp; Stay Type
              </h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Heat Limit */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--wf-card-low)' }}>
                <div className="flex items-center justify-between">
                  <label htmlFor="heat-limit-slider" className="font-label flex items-center gap-1.5 text-sm font-bold">
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
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      heatLimitC: Number(e.target.value)
                    }))
                  }
                  className="mt-3 h-3 w-full cursor-pointer accent-[#2f6f73]"
                />
                <p className="font-label mt-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
                  Triggers warning review above {state.heatLimitC}°C for baby hydration &amp; pram canopy safety.
                </p>
              </div>

              {/* Max Flight Duration */}
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--wf-card-low)' }}>
                <div className="flex items-center justify-between">
                  <label htmlFor="max-flight-slider" className="font-label flex items-center gap-1.5 text-sm font-bold">
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
                  onChange={(e) =>
                    onChangeState((prev) => ({
                      ...prev,
                      maxFlightHours: Number(e.target.value)
                    }))
                  }
                  className="mt-3 h-3 w-full cursor-pointer accent-[#2f6f73]"
                />
                <p className="font-label mt-1.5 text-xs" style={{ color: 'var(--wf-muted)' }}>
                  Daytime flights over {state.maxFlightHours}h flag infant restlessness unless overnight sleeper is enabled.
                </p>
              </div>

              {/* Budget Ceiling */}
              <div>
                <label htmlFor="budget-ceiling-input" className="font-label flex items-center gap-1.5 text-sm font-bold">
                  <Wallet className="h-4 w-4" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
                  <span>Total budget ceiling (€)</span>
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
                    className="tabular-nums min-h-[48px] w-full rounded-xl border py-2 pr-4 pl-8 text-base font-bold"
                    style={{
                      backgroundColor: 'var(--wf-card-low)',
                      borderColor: 'var(--wf-outline)',
                      color: 'var(--wf-ink)'
                    }}
                  />
                </div>
              </div>

              {/* Avios Points */}
              <div>
                <label htmlFor="avios-balance-input" className="font-label flex items-center gap-1.5 text-sm font-bold">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--wf-violet)' }} aria-hidden="true" />
                  <span>Avios points to apply</span>
                </label>
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
                  className="tabular-nums mt-1.5 min-h-[48px] w-full rounded-xl border px-3.5 py-2 text-base font-bold"
                  style={{
                    backgroundColor: 'var(--wf-card-low)',
                    borderColor: 'var(--wf-outline)',
                    color: 'var(--wf-ink)'
                  }}
                />
              </div>
            </div>

            {/* Stay Type Chips */}
            <div className="mt-5">
              <span className="font-label block text-sm font-bold">Accommodation stay type</span>
              <div className="mt-2 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Stay type">
                {(
                  [
                    { id: 'villa', label: 'Villa' },
                    { id: 'park_hotel', label: 'Park hotel' },
                    { id: 'either', label: 'Either' }
                  ] as Array<{ id: StayType; label: string }>
                ).map((option) => {
                  const active = state.stayType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChangeState((prev) => ({ ...prev, stayType: option.id }))}
                      className="font-label min-h-[48px] rounded-xl border px-3 text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card-low)',
                        borderColor: active ? 'var(--wf-teal-container)' : 'var(--wf-outline)',
                        color: active ? '#ffffff' : 'var(--wf-ink)'
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Desktop Readiness Sidebar (4 columns desktop) */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="wf-card p-5 sm:sticky sm:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Live Pre-Flight Check</h2>
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

            <p className="mt-2.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
              {isEmptyMode
                ? 'Fill in traveller birthdates, month, and budget above to unlock your calm side-by-side comparison.'
                : summary.hasBlockingDobError
                  ? 'Please review the highlighted inline date-of-birth notice before comparing.'
                  : `${summary.primaryMetrics.name} (€${summary.primaryMetrics.netTotalEur.toLocaleString('en-IE')}) and ${summary.secondaryMetrics.name} (€${summary.secondaryMetrics.netTotalEur.toLocaleString('en-IE')}) are ready to compare.`}
            </p>

            <dl className="mt-4 space-y-2.5 border-t pt-4 text-sm" style={{ borderColor: 'var(--wf-outline)' }}>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--wf-muted)' }}>Party ages in Sept 2027</dt>
                <dd className="tabular-nums font-bold">
                  {summary.travellerAges
                    .filter((t) => t.role !== 'adult')
                    .map((t) => `${t.name} (${t.formattedAge})`)
                    .join(' · ')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--wf-muted)' }}>Avios estimated offset</dt>
                <dd className="tabular-nums font-bold" style={{ color: 'var(--wf-teal)' }}>
                  Up to €{Math.max(summary.primaryMetrics.aviosSavingsEur, summary.secondaryMetrics.aviosSavingsEur).toLocaleString('en-IE')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--wf-muted)' }}>Zero-deposit guarantee</dt>
                <dd className="font-bold">Nothing held here</dd>
              </div>
            </dl>

            {/* Primary CTA on Desktop */}
            <button
              type="button"
              disabled={!canSubmit || isComparing}
              onClick={onStartCompare}
              className="font-label mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45 lg:inline-flex"
              style={{ backgroundColor: 'var(--wf-teal-container)' }}
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
