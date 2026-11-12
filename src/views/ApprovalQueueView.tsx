import { Building2, CalendarDays, CheckCircle2, HeartHandshake, Lock, Plane, ShieldCheck, Ticket, UserCheck, Users, XCircle } from 'lucide-react';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { AppTab, DestinationComputedMetrics, EvaluationSummary, HoldApprovalState, TripState } from '../types/trip.ts';

interface ApprovalQueueViewProps {
  state: TripState;
  summary: EvaluationSummary;
  onChangeState: (updater: (prev: TripState) => TripState) => void;
  onNavigate: (tab: AppTab) => void;
}

export function ApprovalQueueView({
  state,
  summary,
  onChangeState,
  onNavigate
}: ApprovalQueueViewProps) {
  const toggleParentSignOff = (optionId: 'paris' | 'orlando', parent: 'sarah' | 'mark') => {
    onChangeState((prev) => {
      const target = prev.approvals[optionId];
      return {
        ...prev,
        approvals: {
          ...prev.approvals,
          [optionId]: {
            ...target,
            declined: false,
            sarahApproved: parent === 'sarah' ? !target.sarahApproved : target.sarahApproved,
            markApproved: parent === 'mark' ? !target.markApproved : target.markApproved
          }
        }
      };
    });
  };

  const toggleDecline = (optionId: 'paris' | 'orlando') => {
    onChangeState((prev) => {
      const target = prev.approvals[optionId];
      const nextDeclined = !target.declined;
      return {
        ...prev,
        approvals: {
          ...prev.approvals,
          [optionId]: {
            ...target,
            declined: nextDeclined,
            sarahApproved: nextDeclined ? false : target.sarahApproved,
            markApproved: nextDeclined ? false : target.markApproved
          }
        }
      };
    });
  };

  const metricsById: Record<string, DestinationComputedMetrics> = {
    [summary.primaryMetrics.id]: summary.primaryMetrics,
    [summary.secondaryMetrics.id]: summary.secondaryMetrics
  };

  const holdOptions: HoldApprovalState[] = [state.approvals.paris, state.approvals.orlando];

  return (
    <div className="space-y-7 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--wf-amber-soft)', color: 'var(--wf-amber-ink)' }}
          >
            Transparent Price Holds
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">
            Approval Queue &amp; Holds
          </h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Lock quotes for 48 hours with zero upfront payment. Both Sarah and Mark must approve independently.
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('plan')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{
              backgroundColor: 'var(--wf-teal-container)',
              boxShadow: '0 4px 12px rgba(47, 111, 115, 0.22)'
            }}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Open 6-Day Calm Plan</span>
          </button>
        </div>
      </section>

      {/* Zero Dark Patterns Guarantee Banner */}
      <section className="wf-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold">Zero Dark Patterns Guarantee · €0 Due Today</h2>
            <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
              100% free cancellation until 14 days prior. No artificial urgency counters, no card auto-charges.
            </p>
          </div>
        </div>
        <RuleChip
          status={summary.confirmedHoldCount > 0 ? 'pass' : 'warn'}
          label={
            summary.confirmedHoldCount > 0
              ? `Rule: ${summary.confirmedHoldCount} Dual Hold Approved`
              : `Rule: ${summary.readyForApprovalCount} Pending Consensus`
          }
        />
      </section>

      {/* Side-by-Side Option Hold Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {holdOptions.map((item) => {
          const destMetrics = metricsById[item.destinationId];
          const bothApproved = item.sarahApproved && item.markApproved && !item.declined;
          const isParis = item.optionId === 'paris';

          return (
            <article
              key={item.optionId}
              className="wf-card flex flex-col justify-between p-6"
              style={{
                boxShadow: bothApproved
                  ? '0 8px 28px -6px rgba(15, 104, 78, 0.16), inset 0 0 0 1.5px var(--wf-pass)'
                  : isParis && !item.declined
                    ? '0 8px 28px -6px rgba(47, 111, 115, 0.12), inset 0 0 0 1.5px var(--wf-teal-container)'
                    : undefined,
                opacity: item.declined ? 0.65 : 1
              }}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-label rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: 'var(--wf-card-low)', color: 'var(--wf-muted)' }}
                    >
                      {isParis ? 'Option A' : 'Option B'}
                    </span>
                    {isParis && <SuggestedChip text="Lowest Fatigue Choice" />}
                  </div>
                  {bothApproved ? (
                    <RuleChip status="pass" label="Rule: Hold Approved (€0 Paid)" />
                  ) : item.declined ? (
                    <RuleChip status="fail" label="Rule: Declined" />
                  ) : (
                    <RuleChip status="warn" label="Rule: Awaiting Consensus" />
                  )}
                </div>

                <h2 className="mt-2.5 text-xl font-bold">{item.title}</h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
                  {item.summaryLine}
                </p>

                {/* Seafoam Soft Hero Price Band */}
                <div
                  className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
                  style={{ backgroundColor: 'var(--wf-card-low)' }}
                >
                  <div>
                    <span className="tabular-nums text-3xl font-extrabold tracking-tight">
                      €{(destMetrics?.netTotalEur ?? (isParis ? 4780 : 7310)).toLocaleString('en-IE')}
                    </span>
                    <span className="ml-1.5 text-xs font-medium" style={{ color: 'var(--wf-muted)' }}>
                      net transparent total
                    </span>
                    <span className="font-label block text-xs" style={{ color: 'var(--wf-muted)' }}>
                      {item.cancellationTerms}
                    </span>
                  </div>

                  <span
                    className="tabular-nums font-label shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold"
                    style={{ backgroundColor: 'var(--wf-card)', color: 'var(--wf-teal)' }}
                  >
                    €{item.depositDueTodayEur} Deposit Due Today
                  </span>
                </div>

                {/* Held Reservation Units List */}
                <div className="mt-4 space-y-2">
                  <span className="font-label block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                    Held Reservation Units · {item.holdExpiresLabel}
                  </span>

                  <div className="wf-tile flex items-center justify-between gap-3 p-3.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'var(--wf-card)', color: 'var(--wf-teal)' }}
                      >
                        <Plane className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="font-semibold">
                        {isParis ? 'Short-Haul Rail / Direct Flight (4 pax)' : 'Direct Transatlantic + Bassinet Row'}
                      </span>
                    </div>
                    <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                      48h Hold
                    </span>
                  </div>

                  <div className="wf-tile flex items-center justify-between gap-3 p-3.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'var(--wf-card)', color: 'var(--wf-teal)' }}
                      >
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="font-semibold">
                        {destMetrics?.hotelOrVillaName ?? (isParis ? 'Lakeside Promenade Hotel' : 'Lagoon Monorail Suite')}
                      </span>
                    </div>
                    <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                      Zero deposit
                    </span>
                  </div>

                  <div className="wf-tile flex items-center justify-between gap-3 p-3.5 text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'var(--wf-card)', color: 'var(--wf-teal)' }}
                      >
                        <Ticket className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="font-semibold">Multi-Day Calm Family Park Pass</span>
                    </div>
                    <span className="font-label text-xs" style={{ color: 'var(--wf-muted)' }}>
                      Free refund
                    </span>
                  </div>
                </div>

                {/* Split Parent Consensus */}
                <div className="mt-5">
                  <span className="font-label block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                    Parent Consensus (Both Required)
                  </span>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={item.declined}
                      onClick={() => toggleParentSignOff(item.optionId, 'sarah')}
                      aria-pressed={item.sarahApproved}
                      className="font-label flex min-h-[52px] items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: item.sarahApproved ? 'var(--wf-pass-soft)' : 'var(--wf-card-low)',
                        color: item.sarahApproved ? 'var(--wf-pass)' : 'var(--wf-ink)',
                        boxShadow: item.sarahApproved ? 'inset 0 0 0 1.5px var(--wf-pass)' : 'none'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Sarah · Parent 1 Sign-off</span>
                      </span>
                      <span>{item.sarahApproved ? 'Approved' : 'Tap'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={item.declined}
                      onClick={() => toggleParentSignOff(item.optionId, 'mark')}
                      aria-pressed={item.markApproved}
                      className="font-label flex min-h-[52px] items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: item.markApproved ? 'var(--wf-pass-soft)' : 'var(--wf-card-low)',
                        color: item.markApproved ? 'var(--wf-pass)' : 'var(--wf-ink)',
                        boxShadow: item.markApproved ? 'inset 0 0 0 1.5px var(--wf-pass)' : 'none'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>Mark · Parent 2 Sign-off</span>
                      </span>
                      <span>{item.markApproved ? 'Approved' : 'Tap'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Generous vertical gap separating Approve controls above from Decline below */}
              <div
                className="mt-12 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--wf-outline)' }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: bothApproved ? 'var(--wf-pass)' : 'var(--wf-muted)' }}>
                  {bothApproved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>48h Courtesy Hold Active (€0 charged)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Awaiting independent dual approval</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleDecline(item.optionId)}
                  className="font-label inline-flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: item.declined ? 'var(--wf-teal-soft)' : 'transparent',
                    color: item.declined ? 'var(--wf-teal)' : 'var(--wf-error)'
                  }}
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  <span>{item.declined ? 'Restore option' : 'Decline & skip option'}</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom 3-Column Family Protection Guardrails */}
      <section className="wf-card p-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
          <h2 className="text-lg font-bold">Family Travel Protection &amp; Cancellation Guardrails</h2>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="wf-tile p-4">
            <Lock className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
            <h3 className="mt-2.5 text-sm font-bold">48-Hour Zero Penalty Hold</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--wf-muted)' }}>
              Seats and room blocks stay reserved cleanly while parents confer, expiring automatically with €0 owed.
            </p>
          </div>

          <div className="wf-tile p-4">
            <HeartHandshake className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
            <h3 className="mt-2.5 text-sm font-bold">Infant Illness Waiver</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--wf-muted)' }}>
              Verified 14-day fee-free shift policy for sudden ear infections, fevers, or pediatrician travel advisories.
            </p>
          </div>

          <div className="wf-tile p-4">
            <Users className="h-5 w-5" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
            <h3 className="mt-2.5 text-sm font-bold">Shared Parent Consensus</h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--wf-muted)' }}>
              Both guardians approve each quote explicitly so neither partner shoulders financial surprises alone.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
