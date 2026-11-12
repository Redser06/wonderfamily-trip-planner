# WonderFamily · Calm Family Trip Planner

A calm, decision-first family theme-park vacation planner built for parents planning a first trip with a baby and toddler across mobile (one-handed bursts) and desktop (comprehensive side-by-side comparison).

## Architecture & Screens

1. **Trip Setup** (`src/views/TripSetupView.tsx`): Travellers & DOB validation (flags inline errors when a child reaches age 3 on travel dates), September 2027 window & week flexibility, destination selector (`Orlando` vs `Paris`; `Tokyo Bay` skipped by default due to >8h flight limit), thermal limit (`28°C`), €9,000 budget ceiling, Avios balance, and stay type.
2. **Side-by-Side Compare** (`src/views/CompareView.tsx`): Net-after-Avios pricing, travel duration, climate/humidity, gate-to-crib transit time, infant care hubs, and AI Steward synthesis without initiating bookings.
3. **Safety & Rule Checks** (`src/views/ChecksView.tsx`): 9 deterministic rules across `Baby & Toddler (3)`, `Thermal & Nap (3)`, and `Insurance & Budget (3)` with explicit `Rule: Pass` / `Rule: Review` / `Rule: Fail` chips and `Suggested` mitigations.
4. **Change & Re-run** (`src/views/ChangeRerunView.tsx`): Interactive 1-tap mitigations (19:30 Overnight Sleeper Flight, 12:30–15:30 AC Pavilion Break), week shifts, gate-to-crib window, cash ceiling stepper, and Avios slider with live before/after simulation.
5. **Approval Queue** (`src/views/ApprovalQueueView.tsx`): Transparent €0-due-today courtesy holds, 14-day free cancellation terms, dual-parent (`Sarah` & `Mark`) sign-off, and spatially separated decline controls.
6. **Day-by-Day Plan** (`src/views/DayPlanView.tsx`): 6-day itinerary featuring protected `13:00–15:30 MANDATORY CRIB NAP & THERMAL BUFFER`, developmental pacing profiles, Fatigue & Heat Radar, Baby Care Hubs, afternoon pool swap, and `.ics` calendar export.
7. **Calm Voice Steward** (`src/components/VoiceSheet.tsx`, `src/engine/voiceClient.ts`, `src/engine/tripVoiceAssistant.ts`): Persistent sheet accessible from any screen, reusing the `irish-voice-pwa` `gemini-3.8-live` 16kHz/24kHz PCM bidirectional audio pipeline with visible transcript and offline deterministic typed fallback.

## Local Development & Verification

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Design Principles

- **Calm light-first palette + Dark mode**: Teal `#2f6f73` primary brand, amber `#e8a33d` warnings & pending approvals, soft violet `#6c63a8` AI suggestion chips, error red `#ba1a1a` rule failures only.
- **Accessible typography & touch targets**: `Plus Jakarta Sans`, `Atkinson Hyperlegible Next`, and `Inter` with `tabular-nums`, `>= 48px` interactive targets, `prefers-reduced-motion` support, and status indicators always carrying both an icon and a word.
- **Brand-neutral copy**: Zero third-party theme-park brand names, logos, characters, or castle motifs.
