import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialTripState, createEmptyTripState, DESTINATION_SPECS } from '../../data/destinations.ts';
import { evaluateTrip, evaluateTravellerAge, buildIcsCalendarFile } from '../tripEngine.ts';
import { answerTripVoiceQuery } from '../tripVoiceAssistant.ts';
import {
  buildRealtimeAudioPacket,
  buildSilentToolResponsePacket,
  downsampleTo16kHz,
  parsePcm16Chunk,
  shouldGateMicDuringPlayback
} from '../voiceClient.ts';

test('default trip state evaluates to 7 Passed, 2 Warnings, 0 Fails cleanly', () => {
  const state = createInitialTripState();
  const result = evaluateTrip(state);

  assert.equal(result.rules.length, 9);
  assert.equal(result.passCount, 7);
  assert.equal(result.warnCount, 2);
  assert.equal(result.failCount, 0);
  assert.equal(result.hasBlockingDobError, false);

  const orlando = result.primaryMetrics.id === 'orlando' ? result.primaryMetrics : result.secondaryMetrics;
  const paris = result.primaryMetrics.id === 'paris' ? result.primaryMetrics : result.secondaryMetrics;

  assert.equal(orlando.aviosSavingsEur, 1140);
  assert.equal(paris.recommended, true);
  assert.ok(paris.netTotalEur < orlando.netTotalEur);
});

test('inline DOB validation triggers error when toddler or baby is 3 or older on travel dates', () => {
  const state = createInitialTripState();
  // Set Leo DOB to May 14, 2024 -> 3 yrs 3 mos in Sept 2027
  state.travellers = state.travellers.map((t) =>
    t.id === 'child-1' ? { ...t, dob: '2024-05-14' } : t
  );

  const ageCheck = evaluateTravellerAge(state.travellers[2], state.travelMonth);
  assert.equal(ageCheck.isThreeOrOverOnTravelDates, true);
  assert.ok(ageCheck.inlineError && ageCheck.inlineError.includes('3 or over'));

  const result = evaluateTrip(state);
  assert.equal(result.hasBlockingDobError, true);

  // Confirming child 3+ ticket acknowledges budget impact and clears blocking gate
  state.confirmOverThreeTicket = true;
  const confirmedResult = evaluateTrip(state);
  assert.equal(confirmedResult.hasBlockingDobError, false);
  const baseResult = evaluateTrip(createInitialTripState());
  assert.ok(confirmedResult.primaryMetrics.ticketsAndDiningEur > baseResult.primaryMetrics.ticketsAndDiningEur);
});

test('empty trip state produces inline DOB prompts and zero budget warn', () => {
  const empty = createEmptyTripState();
  const result = evaluateTrip(empty);
  assert.equal(result.hasBlockingDobError, true);
  const budgetRule = result.rules.find((r) => r.id === 'rule-05');
  assert.equal(budgetRule?.status, 'warn');
});

test('enabling suggested mitigations clears both warnings to 9 Pass, 0 Warnings', () => {
  const state = createInitialTripState();
  state.mitigations.overnightFlight = true;
  state.mitigations.middayAcBreak = true;

  const result = evaluateTrip(state);
  assert.equal(result.passCount, 9);
  assert.equal(result.warnCount, 0);
  assert.equal(result.failCount, 0);
});

test('lowering budget ceiling sharply triggers budget Fail rule', () => {
  const state = createInitialTripState();
  state.budgetCeilingEur = 4000;

  const result = evaluateTrip(state);
  const budgetRule = result.rules.find((r) => r.id === 'rule-05');
  assert.equal(budgetRule?.status, 'fail');
  assert.ok(result.failCount >= 1);
});

test('dual parent consensus requires both Sarah and Mark without accidental auto-approve', () => {
  const state = createInitialTripState();
  state.approvals.paris.sarahApproved = true;
  const partial = evaluateTrip(state);
  assert.equal(partial.confirmedHoldCount, 0);

  state.approvals.paris.markApproved = true;
  const dual = evaluateTrip(state);
  assert.equal(dual.confirmedHoldCount, 1);
});

test('ICS export generates valid VCALENDAR with protected nap window', () => {
  const state = createInitialTripState();
  const summary = evaluateTrip(state);
  const ics = buildIcsCalendarFile(summary.dayPlan, 'Paris');
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('MANDATORY CRIB NAP & THERMAL BUFFER'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('voice assistant returns trip-grounded answers and actionable suggestions', () => {
  const state = createInitialTripState();
  const summary = evaluateTrip(state);
  const heatReply = answerTripVoiceQuery('Why does Orlando warn on heat?', state, summary);
  assert.ok(heatReply.reply.includes('31°C'));
  assert.equal(heatReply.suggestedAction?.action, 'shift_late_sept');

  const fixReply = answerTripVoiceQuery('Can we fix all warnings?', state, summary);
  assert.equal(fixReply.suggestedAction?.action, 'apply_all_fixes');
});

test('Gemini 3.8 Live PCM audio helpers handle resampling, odd byte boundaries, and packet schema', () => {
  const input48k = new Float32Array(480);
  input48k.fill(0.5);
  const downsampled = downsampleTo16kHz(input48k, 48000);
  assert.equal(downsampled.length, 160);

  // Odd-byte PCM chunk boundary test (3 bytes followed by 1 byte -> 2 16-bit samples)
  const chunk1 = new Uint8Array([0x00, 0x40, 0xff]);
  const res1 = parsePcm16Chunk(chunk1, null);
  assert.equal(res1.float32.length, 1);
  assert.equal(res1.leftover?.length, 1);

  const chunk2 = new Uint8Array([0x7f]);
  const res2 = parsePcm16Chunk(chunk2, res1.leftover);
  assert.equal(res2.float32.length, 1);
  assert.equal(res2.leftover, null);
  assert.ok(res2.float32[0] > 0.99);

  const audioPacket = buildRealtimeAudioPacket('AAAA');
  assert.equal(audioPacket.realtimeInput.audio.mimeType, 'audio/pcm;rate=16000');

  const toolResp = buildSilentToolResponsePacket('call-1', 'updateRule', { ok: true });
  assert.equal(toolResp.toolResponse.functionResponses[0].response.scheduling, 'SILENT');

  assert.equal(shouldGateMicDuringPlayback(true, 0.01), true);
  assert.equal(shouldGateMicDuringPlayback(true, 0.12), false);
});

test('compliance guard: zero third-party theme-park brand leaks and zero banned legacy Gemini 2.x strings', () => {
  const rootDir = path.resolve(import.meta.dirname, '..', '..');
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') {
        out.push(...walk(full));
      } else if (entry.isFile() && /\.(ts|tsx|html|json)$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  };

  const files = walk(rootDir);
  const combinedText = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  assert.equal(/\b(disney|disneyland|walt disney|mickey|mouse ear|cinderella)\b/i.test(combinedText), false);
  assert.equal(/gemini-2\./i.test(combinedText), false);
  assert.ok(DESTINATION_SPECS.tokyo.flightDurationHours > 8);
});
