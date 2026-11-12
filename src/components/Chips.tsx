import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import type { RuleStatus } from '../types/trip.ts';

interface RuleChipProps {
  status: RuleStatus;
  label?: string;
}

export function RuleChip({ status, label }: RuleChipProps) {
  if (status === 'pass') {
    return (
      <span
        className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
        style={{ backgroundColor: 'var(--wf-pass-soft)', color: 'var(--wf-pass)' }}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label ?? 'Rule: Pass'}</span>
      </span>
    );
  }

  if (status === 'warn') {
    return (
      <span
        className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
        style={{ backgroundColor: 'var(--wf-amber-soft)', color: 'var(--wf-amber-ink)' }}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label ?? 'Rule: Review'}</span>
      </span>
    );
  }

  return (
    <span
      className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
      style={{ backgroundColor: 'var(--wf-error-soft)', color: 'var(--wf-error)' }}
    >
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label ?? 'Rule: Fail'}</span>
    </span>
  );
}

interface SuggestedChipProps {
  text?: string;
}

export function SuggestedChip({ text = 'Suggested' }: SuggestedChipProps) {
  return (
    <span
      className="font-label inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
      style={{ backgroundColor: 'var(--wf-violet-soft)', color: 'var(--wf-violet-ink)' }}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
