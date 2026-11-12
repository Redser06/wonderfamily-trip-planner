import type { EvaluationSummary, TripState } from '../types/trip.ts';

export type VoiceActionType =
  | 'apply_all_fixes'
  | 'shift_late_sept'
  | 'swap_pool_afternoon'
  | 'navigate_approvals'
  | 'navigate_checks'
  | 'navigate_plan';

export interface VoiceReplyResult {
  reply: string;
  ruleChip?: { status: 'pass' | 'warn' | 'fail'; text: string };
  aiChip?: string;
  suggestedAction?: {
    label: string;
    action: VoiceActionType;
  };
}

export function buildTripVoiceSystemInstruction(
  state: TripState,
  summary: EvaluationSummary
): string {
  const { primaryMetrics: a, secondaryMetrics: b } = summary;
  return [
    'You are the WonderFamily Calm Trip Steward helping parents with a baby and a toddler.',
    'Keep answers calm, grounded, concise (2-4 short sentences), and easy to scan one-handed.',
    'Never book, pay, or claim a hold is confirmed without explicit parent sign-off in Approval Queue.',
    'Do not use third-party theme park brand names, characters, or castles.',
    `Current comparison: ${a.name} (€${a.netTotalEur} net, ${a.forecastTempC}°C, ${a.flightHours}h flight, fit ${a.fitScore}%) vs ${b.name} (€${b.netTotalEur} net, ${b.forecastTempC}°C, ${b.flightHours}h flight, fit ${b.fitScore}%).`,
    `Active rules score: ${summary.passCount} Passed, ${summary.warnCount} Warnings, ${summary.failCount} Fails.`,
    `Constraints: heat limit ${state.heatLimitC}°C, budget ceiling €${state.budgetCeilingEur}, Avios ${state.aviosBalance.toLocaleString('en-IE')}, stay ${state.stayType}.`,
    `Morning-Evening schedule is protecting mandatory crib nap 13:00-${state.extraNapMinutes === 30 ? '16:00' : '15:30'}.`
  ].join(' ');
}

export function answerTripVoiceQuery(
  rawQuery: string,
  state: TripState,
  summary: EvaluationSummary
): VoiceReplyResult {
  const q = rawQuery.toLowerCase().trim();
  const paris =
    summary.primaryMetrics.id === 'paris' ? summary.primaryMetrics : summary.secondaryMetrics;
  const orlando =
    summary.primaryMetrics.id === 'orlando' ? summary.primaryMetrics : summary.secondaryMetrics;

  if (!q) {
    return {
      reply: 'Ask about flight fit, midday naps, Avios savings, warnings, or afternoon pool swaps.'
    };
  }

  if (q.includes('fix') || q.includes('clear') || q.includes('resolve') || q.includes('mitigat')) {
    if (summary.warnCount === 0 && summary.failCount === 0) {
      return {
        reply: `All ${summary.passCount} rules already pass under your current configuration. You can review zero-deposit holds whenever ready.`,
        ruleChip: { status: 'pass', text: `Rule: ${summary.passCount} Pass` },
        suggestedAction: { label: 'Open Approval Queue', action: 'navigate_approvals' }
      };
    }
    return {
      reply: `Turning on the 19:30 Overnight Flight and the Mandatory 12:30–15:30 Air-Conditioned Pavilion Break resolves the ${summary.warnCount} active warning(s) without changing your €9,000 cap.`,
      aiChip: 'Suggested Fix Pair',
      ruleChip: { status: 'warn', text: `Rule: ${summary.warnCount} Review` },
      suggestedAction: { label: 'Apply both fixes & re-run', action: 'apply_all_fixes' }
    };
  }

  if (q.includes('heat') || q.includes('temp') || q.includes('hot') || q.includes('weather')) {
    return {
      reply: `Orlando averages ${orlando.forecastTempC}°C (${orlando.humidityPct}% humidity), whereas your infant heat limit is ${state.heatLimitC}°C. Shifting to Late September drops forecast peaks by 1.8°C and adding the midday indoor break clears the thermal warning. Paris stays calm at ${paris.forecastTempC}°C.`,
      ruleChip: {
        status: orlando.effectiveTempC <= state.heatLimitC ? 'pass' : 'warn',
        text: orlando.effectiveTempC <= state.heatLimitC ? 'Rule: Pass' : 'Rule: Review'
      },
      aiChip: 'Suggested: Late Sept (-1.8°C)',
      suggestedAction: { label: 'Shift to Late Sept', action: 'shift_late_sept' }
    };
  }

  if (q.includes('avios') || q.includes('point') || q.includes('budget') || q.includes('cost') || q.includes('price')) {
    return {
      reply: `With ${state.aviosBalance.toLocaleString('en-IE')} Avios applied, Paris nets €${paris.netTotalEur.toLocaleString('en-IE')} (saving €${paris.aviosSavingsEur}) and Orlando nets €${orlando.netTotalEur.toLocaleString('en-IE')} (saving €${orlando.aviosSavingsEur}). Both stay within your €${state.budgetCeilingEur.toLocaleString('en-IE')} ceiling.`,
      ruleChip: { status: 'pass', text: 'Rule: Pass (Budget)' }
    };
  }

  if (q.includes('pool') || q.includes('nap') || q.includes('afternoon') || q.includes('schedule') || q.includes('plan')) {
    return {
      reply: `Your Day ${summary.dayPlan.dayNumber} plan locks a blackout crib sanctuary from 13:00 to ${state.extraNapMinutes === 30 ? '16:00' : '15:30'} (${state.maxCribTransitMins}m gate-to-crib budget). You can swap the afternoon park block with the shaded resort splash pool in one tap.`,
      aiChip: 'Suggested Calm Swap',
      suggestedAction: { label: 'Swap Afternoon for Hotel Pool', action: 'swap_pool_afternoon' }
    };
  }

  if (q.includes('hold') || q.includes('book') || q.includes('cancel') || q.includes('approv')) {
    return {
      reply: `Nothing is booked or charged automatically. Both holds in the Approval Queue require €0 deposit today and carry 100% free cancellation until 14 days before travel, requiring both Sarah and Mark to sign off.`,
      ruleChip: { status: 'pass', text: 'Rule: Pass (€0 Due Today)' },
      suggestedAction: { label: 'Review Approval Queue', action: 'navigate_approvals' }
    };
  }

  if (q.includes('tokyo') || q.includes('flight') || q.includes('sleep')) {
    return {
      reply: `Tokyo Bay (13.5h flight) is skipped by default because flights over ${state.maxFlightHours}h exceed the infant calm endurance threshold. Paris is 1h 20m door-to-door; Orlando is 9h unless shifted to the 19:30 overnight sleeper.`,
      ruleChip: { status: summary.warnCount > 0 ? 'warn' : 'pass', text: 'Rule: Flight Check' }
    };
  }

  return {
    reply: `${summary.stewardSynthesis} Currently ${summary.passCount} rules pass and ${summary.warnCount} need review. Ask me about heat limits, Avios savings, afternoon naps, or zero-deposit holds.`,
    ruleChip: {
      status: summary.warnCount === 0 ? 'pass' : 'warn',
      text: `${summary.passCount} Pass · ${summary.warnCount} Warn`
    },
    suggestedAction: { label: 'View Day Plan', action: 'navigate_plan' }
  };
}
