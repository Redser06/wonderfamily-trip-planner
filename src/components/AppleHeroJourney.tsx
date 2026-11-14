import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Baby, BedDouble, CheckCircle2, Plane, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import type { EvaluationSummary } from '../types/trip.ts';

interface AppleHeroJourneyProps {
  summary: EvaluationSummary;
  onJumpToPlanner: () => void;
  onOpenVoice: () => void;
}

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp01(t);
}

export function AppleHeroJourney({
  summary,
  onJumpToPlanner,
  onOpenVoice
}: AppleHeroJourneyProps) {
  const trackRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setPrefersReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);
    return () => mq.removeEventListener('change', syncMotion);
  }, []);

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const syncDesktop = () => setIsDesktop(desktopMq.matches);
    syncDesktop();
    desktopMq.addEventListener('change', syncDesktop);
    return () => desktopMq.removeEventListener('change', syncDesktop);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId = 0;
    const updateScrollProgress = () => {
      rafId = 0;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableDistance = Math.max(1, el.offsetHeight - window.innerHeight);
      const nextProgress = clamp01(-rect.top / scrollableDistance);
      setProgress((prev) => (Math.abs(prev - nextProgress) > 0.0015 ? nextProgress : prev));
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateScrollProgress);
      }
    };

    updateScrollProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  // Derived phase values (Apple-style smooth multi-beat hero transformation)
  const p = prefersReducedMotion ? 0 : progress;
  const stage2T = clamp01((p - 0.16) / 0.26); // Arrival -> Split Resort Comparison
  const stage3T = clamp01((p - 0.50) / 0.26); // Comparison -> Sanctuary Pill Portal
  const settleT = clamp01((p - 0.80) / 0.20); // Sanctuary -> Settle into Planner

  // Morph geometric frame safely inside container bounds (never translate negative left off-screen)
  const desktopWidthPct = lerp(100, 60, stage2T) * (1 - stage3T) + 76 * stage3T;
  const desktopMarginLeftPct = lerp(0, 12, stage3T);
  const heroScale = lerp(1, 0.96, stage2T) - settleT * 0.03;
  const heroBorderRadiusPx = Math.round(lerp(28, 40, stage2T) + stage3T * 16);
  const secondarySplitOpacity = stage2T * (1 - stage3T);
  const secondarySlideY = lerp(40, 0, stage2T);

  // Opacity crossfades across the 3 hero photographs
  const arrivalOpacity = 1 - stage2T * 0.92;
  const lagoonOpacity = clamp01(stage2T * 1.1) * (1 - stage3T);
  const sanctuaryOpacity = stage3T;

  const activeChapter = p < 0.26 ? 0 : p < 0.60 ? 1 : 2;

  const scrollToChapter = (targetProgress: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.offsetTop + targetProgress * Math.max(1, el.offsetHeight - window.innerHeight);
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const paris =
    summary.primaryMetrics.id === 'paris' ? summary.primaryMetrics : summary.secondaryMetrics;
  const orlando =
    summary.primaryMetrics.id === 'orlando' ? summary.primaryMetrics : summary.secondaryMetrics;

  return (
    <section
      ref={trackRef}
      aria-label="WonderFamily visual overview"
      className={prefersReducedMotion ? 'relative pb-10' : 'relative h-[265vh] sm:h-[310vh]'}
    >
      <div
        className={
          prefersReducedMotion
            ? 'mx-auto max-w-7xl px-4 pt-6 sm:px-6'
            : 'sticky top-[4.25rem] flex h-[calc(100dvh-12.5rem)] min-h-[420px] flex-col justify-center overflow-hidden px-3 py-2.5 sm:px-6 lg:h-[calc(100dvh-5.25rem)] lg:min-h-[540px] lg:py-3'
        }
      >
        <div className="relative mx-auto flex h-full max-h-[760px] w-full max-w-7xl items-center">
          {/* Primary Shaping Hero Viewport Canvas */}
          <div
            className="relative h-full overflow-hidden shadow-2xl"
            style={{
              width: isDesktop ? `${desktopWidthPct}%` : '100%',
              marginLeft: isDesktop ? `${desktopMarginLeftPct}%` : '0%',
              borderRadius: `${heroBorderRadiusPx}px`,
              transform: `scale(${heroScale})`,
              transformOrigin: 'center center',
              willChange: 'transform, width, margin-left, border-radius',
              backgroundColor: '#102426'
            }}
          >
            {/* Layer 1: European Lakeside Promenade + Stroller */}
            <img
              src="/images/hero-paris-boardwalk.jpg"
              alt="Sunlit European lakeside promenade with modern double stroller parked along shaded stone boardwalk"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: arrivalOpacity,
                transform: `scale(${lerp(1.02, 1.1, stage2T)})`,
                willChange: 'opacity, transform'
              }}
            />

            {/* Layer 2: Sunlit Subtropical Lagoon Pedestrian Sky-Bridge */}
            <img
              src="/images/hero-orlando-lagoon.jpg"
              alt="Curving pedestrian footbridge over calm emerald lagoon waters toward shaded resort cabanas"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: lagoonOpacity,
                transform: `scale(${lerp(1.08, 1.0, stage2T)})`,
                willChange: 'opacity, transform'
              }}
            />

            {/* Layer 3: Serene Shaded Family Nap Sanctuary Suite */}
            <img
              src="/images/hero-nap-sanctuary.jpg"
              alt="Quiet sage-teal family suite with natural oak crib, linen blackout curtains, and sunlit balcony"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: sanctuaryOpacity,
                transform: `scale(${lerp(1.08, 1.0, stage3T)})`,
                willChange: 'opacity, transform'
              }}
            />

            {/* Editorial Readability Gradient Overlay */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(11, 24, 25, 0.22) 0%, rgba(11, 24, 25, 0.16) 40%, rgba(11, 24, 25, 0.78) 100%), linear-gradient(90deg, rgba(11, 24, 25, 0.68) 0%, rgba(11, 24, 25, 0.15) 62%, rgba(11, 24, 25, 0.08) 100%)'
              }}
            />

            {/* Top Floating HUD Pills Inside Frame */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-label inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/55 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#aeeef2]" aria-hidden="true" />
                  <span>Calm Family Journey · {summary.travelWindowLabel}</span>
                </span>
                <span className="font-label tabular-nums hidden rounded-full border border-white/20 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:inline-flex">
                  {summary.ticketBreakdown.totalTravellers} Travellers · {summary.ticketBreakdown.totalPaidTickets} Tickets ({summary.ticketBreakdown.parkDays}d) · {summary.passCount}/9 Rules
                </span>
              </div>

              <button
                type="button"
                onClick={onJumpToPlanner}
                className="font-label inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/60 px-4 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-slate-950/80"
              >
                <span>Skip to live planner</span>
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Chapter Narrative Copy Positioned Cleanly Inside Bottom Half */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-10">
              {/* Chapter 1 Copy */}
              <div
                className="max-w-2xl transition-opacity duration-200"
                style={{
                  opacity: clamp01(1 - stage2T * 1.8),
                  pointerEvents: activeChapter === 0 ? 'auto' : 'none',
                  display: stage2T > 0.75 ? 'none' : 'block'
                }}
              >
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Theme-park trips, planned with calm.
                </h1>
                <p className="mt-2.5 max-w-xl text-sm text-white/90 sm:mt-3 sm:text-lg">
                  Compare Orlando and Paris side by side against infant naps, 28°C heat safety, and family budgets — before anything is held.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onJumpToPlanner}
                    className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#0d575a] shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    <span>Start planning below</span>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {!prefersReducedMotion && (
                    <button
                      type="button"
                      onClick={() => scrollToChapter(0.38)}
                      className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white/18 px-5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/28"
                    >
                      <span>Scroll through the story</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chapter 2 Copy (Side-by-Side Trade-Offs) */}
              <div
                className="max-w-xl transition-opacity duration-200"
                style={{
                  opacity: stage2T * (1 - stage3T * 1.6),
                  pointerEvents: activeChapter === 1 ? 'auto' : 'none',
                  display: stage2T < 0.08 || stage3T > 0.75 ? 'none' : 'block'
                }}
              >
                <span className="font-label inline-flex items-center gap-1.5 rounded-full bg-[#feb64e]/90 px-3 py-1 text-xs font-bold text-[#2a1800]">
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>02 · Honest Side-by-Side Comparison</span>
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  1h 20m breeze vs. 9h lagoon bubble.
                </h2>
                <p className="mt-2.5 text-sm text-white/90 sm:text-base">
                  Every flight fatigue risk, humidity peak, and Avios point saving is weighed side by side in plain view.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <div className="rounded-2xl bg-white/16 px-4 py-2.5 text-white backdrop-blur-md">
                    <span className="font-label block text-[11px] uppercase opacity-80">Paris Fairytale Hub</span>
                    <span className="tabular-nums text-base font-bold">
                      €{paris.netTotalEur.toLocaleString('en-IE')} net · {paris.forecastTempC}°C
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white/16 px-4 py-2.5 text-white backdrop-blur-md">
                    <span className="font-label block text-[11px] uppercase opacity-80">Orlando Resort Hub</span>
                    <span className="tabular-nums text-base font-bold">
                      €{orlando.netTotalEur.toLocaleString('en-IE')} net · Fit {orlando.fitScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Chapter 3 Copy (Nap Sanctuary & Consensus) */}
              <div
                className="max-w-2xl transition-opacity duration-200"
                style={{
                  opacity: clamp01(stage3T * 1.35),
                  pointerEvents: activeChapter === 2 ? 'auto' : 'none',
                  display: stage3T < 0.08 ? 'none' : 'block'
                }}
              >
                <span className="font-label inline-flex items-center gap-1.5 rounded-full bg-[#e5deff] px-3 py-1 text-xs font-bold text-[#1a0d52]">
                  <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>03 · Protected Midday Sanctuary &amp; €0 Holds</span>
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  13:00–15:30 blackout crib naps locked first.
                </h2>
                <p className="mt-2.5 max-w-xl text-sm text-white/90 sm:text-base">
                  No hidden upsells, no dark countdowns. Both Sarah and Mark review clear cancellation terms before any zero-deposit hold starts.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onJumpToPlanner}
                    className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#2f6f73] px-6 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    <span>Configure your trip now</span>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenVoice}
                    className="font-label inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white/18 px-5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/28"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Ask Voice Steward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Floating Picture-in-Picture Comparison Twin Frame (Reveals in Right 37% Column during Scene 2) */}
          {!prefersReducedMotion && secondarySplitOpacity > 0.03 && (
            <div
              className="pointer-events-none absolute top-10 right-2 hidden w-[37%] max-w-[420px] overflow-hidden rounded-3xl border border-white/25 bg-[#0f2426] shadow-2xl lg:block"
              style={{
                opacity: secondarySplitOpacity,
                transform: `translate3d(0, ${secondarySlideY}px, 0) scale(${lerp(0.92, 1, stage2T)})`,
                willChange: 'transform, opacity'
              }}
            >
              <div className="relative h-56 w-full">
                <img
                  src="/images/hero-paris-boardwalk.jpg"
                  alt="Paris boardwalk promenade beside still lake"
                  className="h-full w-full object-cover"
                />
                <span className="font-label absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#0d575a]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Top Match · Fit {paris.fitScore}%</span>
                </span>
              </div>
              <div className="space-y-2 p-4 text-white">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Paris vs. Orlando</span>
                  <span className="tabular-nums text-[#aeeef2]">€{paris.netTotalEur.toLocaleString('en-IE')}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/80">
                  <span className="inline-flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5 text-[#aeeef2]" aria-hidden="true" />
                    <span>{paris.flightHours}h direct</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Baby className="h-3.5 w-3.5 text-[#aeeef2]" aria-hidden="true" />
                    <span>{paris.cribTransitMins}m crib walk</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#aeeef2]" aria-hidden="true" />
                    <span>EHIC + 9 Rules</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Right Vertical Scroll Chapter Progress Indicator (Desktop) */}
          {!prefersReducedMotion && (
            <div
              className="absolute right-3 bottom-6 z-20 hidden flex-col items-end gap-2 sm:right-6 sm:bottom-8 md:flex"
              aria-label="Story chapter navigation"
            >
              {[
                { idx: 0, label: '01 Arrival', target: 0.0 },
                { idx: 1, label: '02 Compare', target: 0.38 },
                { idx: 2, label: '03 Sanctuary', target: 0.72 }
              ].map((ch) => {
                const isActive = activeChapter === ch.idx;
                return (
                  <button
                    key={ch.label}
                    type="button"
                    onClick={() => scrollToChapter(ch.target)}
                    className="font-label inline-flex min-h-[36px] items-center gap-2 rounded-full px-3 text-xs font-semibold backdrop-blur-md transition-all"
                    style={{
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 30, 31, 0.45)',
                      color: isActive ? '#0d575a' : '#ffffff'
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isActive ? '#2f6f73' : 'rgba(255,255,255,0.55)' }}
                    />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
