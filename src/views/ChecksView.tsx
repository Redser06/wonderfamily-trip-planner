import { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, SlidersHorizontal, Wrench } from 'lucide-react';
import { RuleChip, SuggestedChip } from '../components/Chips.tsx';
import type { AppTab, EvaluationSummary, RuleCategory } from '../types/trip.ts';

interface ChecksViewProps {
  summary: EvaluationSummary;
  onNavigate: (tab: AppTab) => void;
}

type FilterKey = 'all' | RuleCategory;

export function ChecksView({ summary, onNavigate }: ChecksViewProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>('rule-01');

  const countsByCategory = {
    baby_toddler: summary.rules.filter((r) => r.category === 'baby_toddler').length,
    thermal_nap: summary.rules.filter((r) => r.category === 'thermal_nap').length,
    insurance_budget: summary.rules.filter((r) => r.category === 'insurance_budget').length
  };

  const visibleRules =
    filter === 'all' ? summary.rules : summary.rules.filter((r) => r.category === filter);

  const hasIssues = summary.warnCount + summary.failCount > 0;

  return (
    <div className="space-y-6 pb-36 lg:pb-12">
      {/* Header + Summary Scorecard */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: 'var(--wf-teal-soft)', color: 'var(--wf-teal)' }}
          >
            Step 3 of 6 · Safety &amp; Rule Validation
          </span>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Checks</h1>
          <p className="tabular-nums mt-1 text-base font-semibold" style={{ color: 'var(--wf-muted)' }}>
            {summary.passCount} Passed · {summary.warnCount} Warning{summary.warnCount === 1 ? '' : 's'} · {summary.failCount} Critical Fail{summary.failCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => onNavigate(hasIssues ? 'change' : 'approvals')}
            className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--wf-teal-container)' }}
          >
            {hasIssues ? (
              <>
                <Wrench className="h-4 w-4" aria-hidden="true" />
                <span>Fix warnings in Change &amp; Re-run</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>All passed · Review Approval Queue</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter checks by category">
        {[
          { id: 'all' as FilterKey, label: `All Checks (${summary.rules.length})` },
          { id: 'baby_toddler' as FilterKey, label: `Baby & Toddler (${countsByCategory.baby_toddler})` },
          { id: 'thermal_nap' as FilterKey, label: `Thermal & Nap (${countsByCategory.thermal_nap})` },
          { id: 'insurance_budget' as FilterKey, label: `Insurance & Budget (${countsByCategory.insurance_budget})` }
        ].map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.id)}
              className="font-label tabular-nums min-h-[48px] rounded-full border px-4 text-sm font-bold transition-colors"
              style={{
                backgroundColor: active ? 'var(--wf-teal-container)' : 'var(--wf-card)',
                borderColor: active ? 'var(--wf-teal-container)' : 'var(--wf-outline)',
                color: active ? '#ffffff' : 'var(--wf-ink)'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Rules List & Side-by-Side Comparison Matrix */}
      <div className="space-y-3.5">
        {visibleRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;

          return (
            <article key={rule.id} className="wf-card overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="tabular-nums font-label rounded-lg px-2 py-0.5 text-xs font-extrabold"
                        style={{ backgroundColor: 'var(--wf-card-high)', color: 'var(--wf-muted)' }}
                      >
                        {rule.code}
                      </span>
                      <span className="font-label text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--wf-muted)' }}>
                        {rule.categoryLabel}
                      </span>
                      <RuleChip status={rule.status} label={rule.badgeText} />
                      {rule.aiSuggestion && <SuggestedChip text="Suggested fix available" />}
                    </div>

                    <h2 className="mt-2 text-lg font-extrabold">{rule.title}</h2>
                    <p className="mt-1 text-base" style={{ color: 'var(--wf-muted)' }}>
                      {rule.summary}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                    className="font-label inline-flex min-h-[48px] items-center gap-1 rounded-xl border px-3 text-xs font-bold"
                    style={{
                      backgroundColor: 'var(--wf-card-low)',
                      borderColor: 'var(--wf-outline)',
                      color: 'var(--wf-ink)'
                    }}
                  >
                    <span>{isExpanded ? 'Hide reason' : 'Why'}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Destination-by-Destination Comparison Row */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[rule.leftComparison, rule.rightComparison].map((side) => (
                    <div
                      key={side.destinationId}
                      className="rounded-xl border p-3.5"
                      style={{
                        backgroundColor: 'var(--wf-card-low)',
                        borderColor: side.status === 'pass' ? 'var(--wf-outline)' : 'var(--wf-amber)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{side.label}</span>
                        <RuleChip status={side.status} />
                      </div>
                      <p className="mt-1.5 text-sm" style={{ color: 'var(--wf-muted)' }}>
                        {side.summary}
                      </p>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-3 rounded-xl p-3.5 text-sm" style={{ backgroundColor: 'var(--wf-card-mid)' }}>
                    <p style={{ color: 'var(--wf-ink)' }}>{rule.detail}</p>
                    {rule.aiSuggestion && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SuggestedChip text="Suggested" />
                          <span className="font-semibold">{rule.aiSuggestion}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('change')}
                          className="font-label inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white"
                          style={{ backgroundColor: 'var(--wf-teal-container)' }}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Adjust in Re-run</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
