import { CalendarDays, CheckCircle2, Lock, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { RuleChip } from '../components/Chips.tsx';
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
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-amber-soft)', color: 'var(--wf-amber-ink)' }}
          >
            Step 5 of 6 · Transparent Approval Queue
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Review before holding</h1>
          <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
            Nothing has been reserved yet. Both Sarah and Mark must explicitly sign off before any zero-deposit hold starts.
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate('plan')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Open 6-Day Calm Plan</span>
          </button>
        </div>
      </section>

      {/* Zero Dark Patterns Guarantee Banner */}
      <section className="wf-card-tinted flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--wf-teal)' }} aria-hidden="true" />
          <div>
            <h2 className="text-base font-extrabold">Zero Dark Patterns Guarantee · €0 Due Today</h2>
            <p className="text-sm" style={{ color: 'var(--wf-muted)' }}>
              No countdown timers, no auto-renewing cards, and 100% penalty-free cancellation up to 14 days prior.
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

      {/* Hold Option Cards */}
      <div className="space-y-5">
        {holdOptions.map((item) => {
          const destMetrics = metricsById[item.destinationId];
          const bothApproved = item.sarahApproved && item.markApproved && !item.declined;

          return (
            <article
              key={item.optionId}
              className="wf-card p-5 sm:p-6"
              style={{
                borderColor: bothApproved
                  ? 'var(--wf-pass)'
                  : item.declined
                    ? 'var(--wf-outline)'
                    : 'var(--wf-amber-accent)',
                borderWidth: bothApproved || !item.declined ? '2px' : '1px',
                opacity: item.declined ? 0.72 : 1
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold">{item.title}</h2>
                    {bothApproved ? (
                      <RuleChip status="pass" label="Rule: Hold Approved (€0 Paid)" />
                    ) : item.declined ? (
                      <RuleChip status="fail" label="Rule: Declined" />
                    ) : (
                      <RuleChip status="warn" label="Rule: Awaiting Both Parents" />
                    )}
                  </div>
                  <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
                    {item.summaryLine}
                  </p>
                </div>

                <div className="text-right">
                  <span className="tabular-nums block text-2xl font-extrabold">
                    €{(destMetrics?.netTotalEur ?? (item.optionId === 'paris' ? 4780 : 7310)).toLocaleString('en-IE')}
                  </span>
                  <span className="tabular-nums font-label text-xs font-bold" style={{ color: 'var(--wf-pass)' }}>
                    €{item.depositDueTodayEur} due today · {item.holdExpiresLabel}
                  </span>
                </div>
              </div>

              {/* Explicit Cancellation & Line Terms */}
              <div
                className="mt-4 rounded-xl border p-4 text-sm"
                style={{ backgroundColor: 'var(--wf-card-low)', borderColor: 'var(--wf-outline)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">Cancellation &amp; Deposit Terms</span>
                  <span className="font-label text-xs font-semibold" style={{ color: 'var(--wf-teal)' }}>
                    Manual opt-in required
                  </span>
                </div>
                <p className="mt-1" style={{ color: 'var(--wf-muted)' }}>
                  {item.cancellationTerms}
                </p>
              </div>

              {/* Dual Consensus Checkboxes / Buttons */}
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={item.declined}
                  onClick={() => toggleParentSignOff(item.optionId, 'sarah')}
                  aria-pressed={item.sarahApproved}
                  className="font-label flex min-h-[54px] items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: item.sarahApproved ? 'var(--wf-pass-soft)' : 'var(--wf-card)',
                    borderColor: item.sarahApproved ? 'var(--wf-pass)' : 'var(--wf-outline)',
                    color: item.sarahApproved ? 'var(--wf-pass)' : 'var(--wf-ink)'
                  }}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" aria-hidden="true" />
                    <span>Sarah · Parent 1 Sign-off</span>
                  </span>
                  <span>{item.sarahApproved ? 'Approved' : 'Tap to approve'}</span>
                </button>

                <button
                  type="button"
                  disabled={item.declined}
                  onClick={() => toggleParentSignOff(item.optionId, 'mark')}
                  aria-pressed={item.markApproved}
                  className="font-label flex min-h-[54px] items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: item.markApproved ? 'var(--wf-pass-soft)' : 'var(--wf-card)',
                    borderColor: item.markApproved ? 'var(--wf-pass)' : 'var(--wf-outline)',
                    color: item.markApproved ? 'var(--wf-pass)' : 'var(--wf-ink)'
                  }}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" aria-hidden="true" />
                    <span>Mark · Parent 2 Sign-off</span>
                  </span>
                  <span>{item.markApproved ? 'Approved' : 'Tap to approve'}</span>
                </button>
              </div>

              {/* Deliberate wide spatial separation between Approve/Sign-off above and Decline/Remove below (>= 48px vertical & right-anchored) */}
              <div
                className="mt-12 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--wf-outline)' }}
              >
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--wf-muted)' }}>
                  {bothApproved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--wf-pass)' }} aria-hidden="true" />
                      <span className="font-semibold" style={{ color: 'var(--wf-pass)' }}>
                        48h Courtesy Hold Active (€0 charged). Safe to build your Day Plan.
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Both signatures needed before locking a hold.</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleDecline(item.optionId)}
                  className="font-label inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold"
                  style={{
                    backgroundColor: item.declined ? 'var(--wf-card-low)' : 'var(--wf-card)',
                    borderColor: item.declined ? 'var(--wf-teal)' : 'var(--wf-error)',
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
    </div>
  );
}
