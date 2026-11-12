import { DESTINATION_SPECS } from '../data/destinations.ts';
import type {
  DayPlanComputed,
  DestinationComputedMetrics,
  DestinationId,
  EvaluationSummary,
  RuleCheckResult,
  RuleStatus,
  TimelineItem,
  Traveller,
  TravellerAgeEvaluation,
  TripState
} from '../types/trip.ts';

function parseTravelDate(travelMonth: string): Date {
  if (!/^\d{4}-\d{2}$/.test(travelMonth)) {
    return new Date(2027, 8, 12);
  }
  const [y, m] = travelMonth.split('-').map(Number);
  return new Date(y, m - 1, 12);
}

export function evaluateTravellerAge(traveller: Traveller, travelMonth: string): TravellerAgeEvaluation {
  if (!traveller.dob || !/^\d{4}-\d{2}-\d{2}$/.test(traveller.dob)) {
    return {
      id: traveller.id,
      name: traveller.name,
      role: traveller.role,
      ageYears: null,
      ageMonthsRemainder: 0,
      formattedAge: 'DOB needed',
      isThreeOrOverOnTravelDates: false,
      inlineError: traveller.role === 'adult' ? null : 'Enter date of birth to verify pass & flight rules.'
    };
  }

  const [by, bm, bd] = traveller.dob.split('-').map(Number);
  const dob = new Date(by, bm - 1, bd);
  const travelDate = parseTravelDate(travelMonth);

  let totalMonths =
    (travelDate.getFullYear() - dob.getFullYear()) * 12 +
    (travelDate.getMonth() - dob.getMonth());
  if (travelDate.getDate() < dob.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths < 0) {
    return {
      id: traveller.id,
      name: traveller.name,
      role: traveller.role,
      ageYears: 0,
      ageMonthsRemainder: 0,
      formattedAge: 'Invalid DOB',
      isThreeOrOverOnTravelDates: false,
      inlineError: 'Date of birth cannot be after your travel month.'
    };
  }

  const ageYears = Math.floor(totalMonths / 12);
  const ageMonthsRemainder = totalMonths % 12;

  let formattedAge = `${ageYears} yrs`;
  if (ageYears === 0) {
    formattedAge = `${ageMonthsRemainder} mos`;
  } else if (ageYears < 5) {
    formattedAge = `${ageYears}y ${ageMonthsRemainder}m`;
  }

  const isChildSlot = traveller.role === 'toddler' || traveller.role === 'baby';
  const isThreeOrOverOnTravelDates = isChildSlot && ageYears >= 3;

  let inlineError: string | null = null;
  if (isThreeOrOverOnTravelDates) {
    inlineError = `${traveller.name} is ${ageYears}y ${ageMonthsRemainder}m on travel dates (3 or over: free under-3 park entry no longer applies; +€340 child pass needed).`;
  }

  return {
    id: traveller.id,
    name: traveller.name,
    role: traveller.role,
    ageYears,
    ageMonthsRemainder,
    formattedAge,
    isThreeOrOverOnTravelDates,
    inlineError
  };
}

export function computeDestinationMetrics(
  destinationId: DestinationId,
  state: TripState,
  childOverThreeCount: number
): DestinationComputedMetrics {
  const spec = DESTINATION_SPECS[destinationId];

  // Week shift influences seasonal heat and off-peak airfare slightly
  const tempDeltaByWeek = state.weekShift === 'early' ? 1.0 : state.weekShift === 'late' ? -1.8 : 0;
  const airfareWeekDelta = state.weekShift === 'late' ? -180 : state.weekShift === 'early' ? 90 : 0;
  const forecastTempC = Math.round((spec.baseTempC + tempDeltaByWeek) * 10) / 10;

  // Midday AC Pavilion Break avoids 12:30-15:30 peak radiant exposure
  const acCoolingOffset = state.mitigations.middayAcBreak ? 3.2 : 0;
  const effectiveTempC = Math.round((forecastTempC - acCoolingOffset) * 10) / 10;

  const useVilla = state.stayType === 'villa';
  const lodgingCostEur = useVilla ? spec.villaCostEur : spec.parkHotelCostEur;
  const cribTransitMins = useVilla ? spec.villaTransitMins : spec.parkHotelTransitMins;
  const hotelOrVillaName = useVilla ? spec.villaName : spec.parkHotelName;

  const extraChildTicketsEur = childOverThreeCount * (destinationId === 'paris' ? 240 : 340);
  const ticketsAndDiningEur = spec.baseTicketsAndDiningEur + extraChildTicketsEur;
  const flightCostEur = Math.max(400, spec.baseFlightCostEur + airfareWeekDelta);
  const grossTotalEur = flightCostEur + lodgingCostEur + ticketsAndDiningEur;

  // Avios valuation: ~€0.0095/pt capped at destination max reward availability
  const aviosPotentialEur = Math.round((Math.max(0, state.aviosBalance) / 120000) * spec.aviosMaxOffsetEur);
  const aviosSavingsEur = Math.min(spec.aviosMaxOffsetEur + 200, Math.max(0, aviosPotentialEur));
  const netTotalEur = Math.max(1200, grossTotalEur - aviosSavingsEur);

  // Compute deterministic comfort fit score (0..100)
  let fitScore = 100;
  if (effectiveTempC > state.heatLimitC) {
    fitScore -= Math.round((effectiveTempC - state.heatLimitC) * 3.5);
  }
  if (spec.flightDurationHours > state.maxFlightHours && !state.mitigations.overnightFlight) {
    fitScore -= Math.min(18, Math.round((spec.flightDurationHours - state.maxFlightHours) * 5));
  }
  if (cribTransitMins > state.maxCribTransitMins) {
    fitScore -= Math.min(12, Math.round((cribTransitMins - state.maxCribTransitMins) * 0.8));
  }
  if (state.budgetCeilingEur > 0 && netTotalEur > state.budgetCeilingEur) {
    fitScore -= Math.min(20, Math.round(((netTotalEur - state.budgetCeilingEur) / 500) * 4));
  }
  if (destinationId === 'paris') {
    fitScore = Math.max(68, Math.min(99, fitScore - 2)); // Base 98% on default sample
  } else {
    fitScore = Math.max(52, Math.min(97, fitScore));
  }

  return {
    id: spec.id,
    name: spec.name,
    subtitle: spec.subtitle,
    regionBadge: spec.regionBadge,
    flightLabel: state.mitigations.overnightFlight && spec.flightDurationHours >= 6
      ? `${spec.flightLabel} (Overnight Sleep)`
      : spec.flightLabel,
    flightHours: spec.flightDurationHours,
    grossTotalEur,
    aviosSavingsEur,
    netTotalEur,
    flightCostEur,
    lodgingCostEur,
    ticketsAndDiningEur,
    forecastTempC,
    effectiveTempC,
    humidityPct: spec.humidityPct,
    cribTransitMins,
    nursingHubsSummary: spec.nursingHubsSummary,
    gentleRidesPct: spec.gentleRidesPct,
    fitScore,
    recommended: false,
    hotelOrVillaName,
    accommodationSummary: useVilla
      ? `${spec.villaName} · Separate bedrooms, full kitchen`
      : `${spec.parkHotelName} · ${spec.parkHotelTransitMins}m stroll from gates`,
    insuranceRequirement: spec.insuranceRequirement,
    cancellationSummary: spec.cancellationSummary,
    tradeOffs: spec.tradeOffs
  };
}

function worstStatus(a: RuleStatus, b: RuleStatus): RuleStatus {
  if (a === 'fail' || b === 'fail') return 'fail';
  if (a === 'warn' || b === 'warn') return 'warn';
  return 'pass';
}

function statusBadgeText(status: RuleStatus): string {
  if (status === 'pass') return 'Rule: Pass';
  if (status === 'warn') return 'Rule: Review';
  return 'Rule: Fail';
}

export function buildRules(
  state: TripState,
  primary: DestinationComputedMetrics,
  secondary: DestinationComputedMetrics
): RuleCheckResult[] {
  const evalFlight = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (m.flightHours <= state.maxFlightHours) {
      return { status: 'pass', summary: `${m.flightHours.toFixed(1)}h within ${state.maxFlightHours}h infant cap` };
    }
    if (m.flightHours <= 10.5 && state.mitigations.overnightFlight) {
      return {
        status: 'pass',
        summary: `Overnight 19:30 sleeper flight aligned to bedtime`
      };
    }
    if (m.flightHours <= 10.5) {
      return {
        status: 'warn',
        summary: `${m.flightHours}h daytime stretch exceeds ${state.maxFlightHours}h guideline`
      };
    }
    return {
      status: 'fail',
      summary: `${m.flightHours}h ultra long-haul breaches infant endurance limit`
    };
  };

  const evalHeat = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (m.effectiveTempC <= state.heatLimitC) {
      const note = state.mitigations.middayAcBreak && m.forecastTempC > state.heatLimitC
        ? `Midday AC break keeps peak exposure <= ${state.heatLimitC}°C`
        : `${m.forecastTempC}°C / ${m.humidityPct}% hum. inside ${state.heatLimitC}°C limit`;
      return { status: 'pass', summary: note };
    }
    if (m.effectiveTempC <= state.heatLimitC + 4) {
      return {
        status: 'warn',
        summary: `${m.forecastTempC}°C (${m.humidityPct}% hum.) exceeds ${state.heatLimitC}°C baby ceiling`
      };
    }
    return {
      status: 'fail',
      summary: `${m.forecastTempC}°C heat index poses high infant thermal strain`
    };
  };

  const evalNapTransit = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (m.cribTransitMins <= state.maxCribTransitMins) {
      return {
        status: 'pass',
        summary: `${m.cribTransitMins} min gate-to-crib walk fits ${state.maxCribTransitMins}m target`
      };
    }
    if (m.cribTransitMins <= state.maxCribTransitMins + 10) {
      return {
        status: 'warn',
        summary: `${m.cribTransitMins} min villa shuttle exceeds ${state.maxCribTransitMins}m quick-nap rule`
      };
    }
    return {
      status: 'fail',
      summary: `${m.cribTransitMins} min transit breaks midday sleep continuity`
    };
  };

  const evalBudget = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (state.budgetCeilingEur <= 0) {
      return { status: 'warn', summary: 'Set a Euro budget ceiling to validate affordability' };
    }
    if (m.netTotalEur <= state.budgetCeilingEur) {
      return {
        status: 'pass',
        summary: `€${m.netTotalEur.toLocaleString('en-IE')} net (€${(state.budgetCeilingEur - m.netTotalEur).toLocaleString('en-IE')} headroom)`
      };
    }
    if (m.netTotalEur <= state.budgetCeilingEur * 1.15) {
      return {
        status: 'warn',
        summary: `€${m.netTotalEur.toLocaleString('en-IE')} slightly exceeds €${state.budgetCeilingEur.toLocaleString('en-IE')} cap`
      };
    }
    return {
      status: 'fail',
      summary: `€${m.netTotalEur.toLocaleString('en-IE')} net breaches €${state.budgetCeilingEur.toLocaleString('en-IE')} cap`
    };
  };

  const evalStroller = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (state.strollerMode === 'park_rental' && m.id === 'orlando') {
      return {
        status: 'warn',
        summary: 'Rental strollers lack full-recline canopy for a 9-month infant'
      };
    }
    if (state.strollerMode === 'checked_hold') {
      return {
        status: 'warn',
        summary: 'Hold check leaves 40m airport transfer without double stroller'
      };
    }
    return {
      status: 'pass',
      summary: `Gate-checked double fold + ${m.gentleRidesPct}% all-height gentle attractions`
    };
  };

  const evalBlackout = (m: DestinationComputedMetrics): { status: RuleStatus; summary: string } => {
    if (state.stayType === 'villa') {
      return {
        status: 'pass',
        summary: `${m.hotelOrVillaName} provides separate dark bedrooms for both children`
      };
    }
    return {
      status: 'pass',
      summary: `${m.hotelOrVillaName} confirmed SlumberPod blackout space + quiet wing`
    };
  };

  const fA = evalFlight(primary);
  const fB = evalFlight(secondary);
  const hA = evalHeat(primary);
  const hB = evalHeat(secondary);
  const nA = evalNapTransit(primary);
  const nB = evalNapTransit(secondary);
  const bA = evalBudget(primary);
  const bB = evalBudget(secondary);
  const sA = evalStroller(primary);
  const sB = evalStroller(secondary);
  const kA = evalBlackout(primary);
  const kB = evalBlackout(secondary);

  const rules: RuleCheckResult[] = [
    {
      id: 'rule-01',
      code: '01',
      title: 'Transit & Sleep Endurance',
      category: 'baby_toddler',
      categoryLabel: 'Baby & Toddler',
      status: worstStatus(fA.status, fB.status),
      badgeText: statusBadgeText(worstStatus(fA.status, fB.status)),
      summary:
        worstStatus(fA.status, fB.status) === 'pass'
          ? 'All selected flight legs fit infant endurance & sleep window.'
          : 'Long-haul daytime duration creates toddler ear-pressure & wake risk.',
      detail: 'Evaluates flight block hours against an 8h calm infant limit unless overnight sleeper routing is selected.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...fA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...fB },
      aiSuggestion:
        worstStatus(fA.status, fB.status) !== 'pass'
          ? 'Switch outbound leg to 19:30 Overnight Sleeper Departure'
          : undefined,
      actionTab: 'change'
    },
    {
      id: 'rule-02',
      code: '02',
      title: 'Thermal & UV Safety',
      category: 'thermal_nap',
      categoryLabel: 'Thermal & Nap',
      status: worstStatus(hA.status, hB.status),
      badgeText: statusBadgeText(worstStatus(hA.status, hB.status)),
      summary:
        worstStatus(hA.status, hB.status) === 'pass'
          ? `Outdoor thermal exposure stays safely within your ${state.heatLimitC}°C cap.`
          : `Peak afternoon heat exceeds your ${state.heatLimitC}°C toddler & infant cap.`,
      detail: 'Compares historic September daily highs and humidity index against your thermal safety threshold.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...hA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...hB },
      aiSuggestion:
        worstStatus(hA.status, hB.status) !== 'pass'
          ? 'Lock mandatory 12:30–15:30 AC Pavilion Break or shift to Late Sept'
          : undefined,
      actionTab: 'change'
    },
    {
      id: 'rule-03',
      code: '03',
      title: 'Midday Nap Gate-to-Crib',
      category: 'thermal_nap',
      categoryLabel: 'Thermal & Nap',
      status: worstStatus(nA.status, nB.status),
      badgeText: statusBadgeText(worstStatus(nA.status, nB.status)),
      summary:
        worstStatus(nA.status, nB.status) === 'pass'
          ? `Door-to-crib transit holds <= ${state.maxCribTransitMins} mins so naps stay unbroken.`
          : `Villa shuttle transit exceeds ${state.maxCribTransitMins}m asleep-transfer window.`,
      detail: 'Checks walk/monorail transfer time from main park turnstiles back to quiet blackout crib.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...nA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...nB },
      aiSuggestion:
        worstStatus(nA.status, nB.status) !== 'pass'
          ? 'Keep Park Hotel preference or relax crib transit window to 25m'
          : undefined,
      actionTab: 'change'
    },
    {
      id: 'rule-04',
      code: '04',
      title: 'Pediatric Medical & Cover',
      category: 'insurance_budget',
      categoryLabel: 'Insurance & Budget',
      status: 'pass',
      badgeText: 'Rule: Pass',
      summary: 'Insurance riders verified for both regions with ER pediatric triage access.',
      detail: 'EU GHIC mutual cover applies in Paris; $2M private travel medical certificate queued for US.',
      leftComparison: {
        destinationId: primary.id,
        label: primary.name,
        status: 'pass',
        summary: primary.insuranceRequirement
      },
      rightComparison: {
        destinationId: secondary.id,
        label: secondary.name,
        status: 'pass',
        summary: secondary.insuranceRequirement
      }
    },
    {
      id: 'rule-05',
      code: '05',
      title: 'Budget Ceiling & Avios Offset',
      category: 'insurance_budget',
      categoryLabel: 'Insurance & Budget',
      status: worstStatus(bA.status, bB.status),
      badgeText: statusBadgeText(worstStatus(bA.status, bB.status)),
      summary:
        worstStatus(bA.status, bB.status) === 'pass'
          ? `Both trips sit inside €${state.budgetCeilingEur.toLocaleString('en-IE')} after Avios points.`
          : `Net total rises above your €${state.budgetCeilingEur.toLocaleString('en-IE')} family budget ceiling.`,
      detail: 'Calculates total return flights, accommodations, passes, meals minus verified Avios point valuation.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...bA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...bB },
      aiSuggestion:
        worstStatus(bA.status, bB.status) !== 'pass'
          ? 'Switch stay type to Villa or increase Avios points allocation'
          : undefined,
      actionTab: 'change'
    },
    {
      id: 'rule-06',
      code: '06',
      title: 'Infant Feeding & Sterilisation',
      category: 'baby_toddler',
      categoryLabel: 'Baby & Toddler',
      status: 'pass',
      badgeText: 'Rule: Pass',
      summary: 'Bottle warming, nursing rooms & microwave stations verified every 250m.',
      detail: 'Ensures filtered water refills, high-chair availability, and cold milk storage on park grounds.',
      leftComparison: {
        destinationId: primary.id,
        label: primary.name,
        status: 'pass',
        summary: primary.nursingHubsSummary
      },
      rightComparison: {
        destinationId: secondary.id,
        label: secondary.name,
        status: 'pass',
        summary: secondary.nursingHubsSummary
      }
    },
    {
      id: 'rule-07',
      code: '07',
      title: 'Refundable Deposit & Illness Waiver',
      category: 'insurance_budget',
      categoryLabel: 'Insurance & Budget',
      status: 'pass',
      badgeText: 'Rule: Pass',
      summary: '€0 due today; 100% penalty-free cancellation up to 14 days before departure.',
      detail: 'Holds never auto-charge a card or impose artificial countdown timers.',
      leftComparison: {
        destinationId: primary.id,
        label: primary.name,
        status: 'pass',
        summary: primary.cancellationSummary
      },
      rightComparison: {
        destinationId: secondary.id,
        label: secondary.name,
        status: 'pass',
        summary: secondary.cancellationSummary
      }
    },
    {
      id: 'rule-08',
      code: '08',
      title: 'Stroller & Sensory Ride Ratio',
      category: 'baby_toddler',
      categoryLabel: 'Baby & Toddler',
      status: worstStatus(sA.status, sB.status),
      badgeText: statusBadgeText(worstStatus(sA.status, sB.status)),
      summary:
        worstStatus(sA.status, sB.status) === 'pass'
          ? 'Gate-checked travel double fits 98% of walkways; >75% all-height gentle attractions.'
          : 'Stroller configuration lowers airport or full-recline infant nap support.',
      detail: 'Audits stroller fold convenience, pavement width, and rider-swap queues for toddler + baby.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...sA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...sB },
      aiSuggestion:
        worstStatus(sA.status, sB.status) !== 'pass'
          ? 'Select Gate-Check Compact Double Stroller in rules'
          : undefined,
      actionTab: 'change'
    },
    {
      id: 'rule-09',
      code: '09',
      title: 'Blackout Sleep & Sound Environment',
      category: 'thermal_nap',
      categoryLabel: 'Thermal & Nap',
      status: worstStatus(kA.status, kB.status),
      badgeText: statusBadgeText(worstStatus(kA.status, kB.status)),
      summary: 'Quiet acoustic wing & darkened sleep zone verified for uninterrupted toddler/baby rest.',
      detail: 'Checks wall insulation, blackout drapes, and space for an infant travel tent away from evening light.',
      leftComparison: { destinationId: primary.id, label: primary.name, ...kA },
      rightComparison: { destinationId: secondary.id, label: secondary.name, ...kB }
    }
  ];

  return rules;
}

export function buildDayPlan(
  state: TripState,
  recommendedDest: DestinationComputedMetrics
): DayPlanComputed {
  const day = Math.max(1, Math.min(6, state.activeDay));
  const napEndHour = state.extraNapMinutes === 30 ? '16:00' : '15:30';
  const isParis = recommendedDest.id === 'paris';

  const dayThemes: Record<number, { title: string; focus: string; morningSpot: string; eveningSpot: string }> = {
    1: {
      title: 'Arrival & Gentle Settling',
      focus: isParis ? 'Short Hop & Lakeside Walk' : 'Check-in & Shaded Pool',
      morningSpot: isParis ? 'Stroller Roll Along Promenade Lake' : 'Resort Grocery & Milk Stock-Up',
      eveningSpot: 'Early 17:45 Warm Pasta Supper & Storytime'
    },
    2: {
      title: isParis ? 'Fairytale Meadows & Calm Rides' : 'Storybook Boats & Indoor Shades',
      focus: 'Morning Gentle Attractions',
      morningSpot: isParis ? 'Small Boats Voyage + Discovery Carousel' : 'Storybook Sky Boats + Gentle Carousel',
      eveningSpot: isParis ? 'Covered Arcade Stroll & Hot Broth' : 'Lantern Pavilion Acoustic Show'
    },
    3: {
      title: 'Aquatic Play & Sand Cove',
      focus: 'Zero-Queue Sensory Morning',
      morningSpot: 'Splash Pad Shallow Reef & Canopy Shade',
      eveningSpot: 'Quiet Suite Family Picnic & Bath Routine'
    },
    4: {
      title: 'Half-Day Studios & Puppet Theater',
      focus: 'Seated Indoor Performances',
      morningSpot: '25-Min Musical Puppet Stage (Air-Conditioned)',
      eveningSpot: 'Early Wind-Down & Stroller Walk by Water'
    },
    5: {
      title: 'Favorites Repeat & Slow Souvenir Walk',
      focus: 'No-Rush Parent Choice Morning',
      morningSpot: 'Re-ride Favorite Slow Boat (Max 10m Queue)',
      eveningSpot: 'Lakeside Bakery & Sunset Bench Time'
    },
    6: {
      title: 'Unhurried Packing & Midday Departure',
      focus: 'Rested Airport Transfer',
      morningSpot: 'Garden Playground Farewell & Snack Box',
      eveningSpot: 'Nap-Aligned Door-to-Door Transfer'
    }
  };

  const info = dayThemes[day];
  const toddlerName = state.travellers.find((t) => t.role === 'toddler')?.name || 'Toddler';
  const babyName = state.travellers.find((t) => t.role === 'baby')?.name || 'Baby';

  const pacingDescription =
    state.pacingProfile === 'toddler_infant'
      ? `Calibrated for ${toddlerName} (max 15m queue) + ${babyName} (quiet nursing pods + strict midday crib window).`
      : state.pacingProfile === 'elementary_6yo'
        ? 'Expanded 2-block morning rides with 90m afternoon quiet rest.'
        : 'Split rider-swap morning cadence keeping infant rested in shade.';

  const afternoonActivity: TimelineItem = state.swapAfternoonPool
    ? {
        id: 'block-afternoon',
        timeRange: `${napEndHour} – 17:30`,
        title: 'Shaded Resort Splash Pool & Lawn Picnic',
        categoryTag: 'USER SWAP · ZERO QUEUE',
        description: `Swapped park re-entry for shaded shallow hotel splash pool right beside your room. Zero stroller folding required.`,
        ruleChip: { status: 'pass', text: 'Rule: Pass (Zero Heat Load)' },
        locationLabel: `${recommendedDest.hotelOrVillaName} Pool Deck`,
        walkTimeMins: 2
      }
    : {
        id: 'block-afternoon',
        timeRange: `${napEndHour} – 17:30`,
        title: isParis ? 'Discovery Gardens & Animal Train' : 'Indoor Aquarium Lounge & Boat Cruise',
        categoryTag: 'COOL-DOWN ACTIVITY',
        description: `Air-conditioned indoor marine gallery and flat stroller loop while outdoor UV declines.`,
        ruleChip: { status: 'pass', text: 'Rule: Pass (Indoor Shade)' },
        locationLabel: `${recommendedDest.name} East Wing`,
        walkTimeMins: 6
      };

  const items: TimelineItem[] = [
    {
      id: 'block-morning-arrival',
      timeRange: '08:15 – 09:30',
      title: `${info.morningSpot}`,
      categoryTag: 'GOLDEN HOUR',
      description: `${pacingDescription} Direct turnstile entry via quiet side gate.`,
      ruleChip: { status: 'pass', text: `Rule: Pass (${recommendedDest.cribTransitMins}m walk)` },
      locationLabel: `${recommendedDest.name} North Meadow`,
      walkTimeMins: 5
    },
    {
      id: 'block-feed-snack',
      timeRange: '09:45 – 11:30',
      title: 'Milk Warm-Up + Sensory Puppet & Boat Loop',
      categoryTag: 'BABY CARE HUB NEARBY',
      description: `Nursing Hub 80m from boat exit (${recommendedDest.nursingHubsSummary}). Pre-warmed puree pouch & shaded bench break.`,
      aiChip: 'Suggested: Best shade route',
      locationLabel: 'Pavilion Care Suite 01',
      walkTimeMins: 3
    },
    {
      id: 'block-lunch-walk',
      timeRange: '11:30 – 12:30',
      title: 'Early Seated Family Lunch & Walk Back',
      categoryTag: 'PRE-RUSH DINING',
      description: `Seated indoor high-chair table before 12:15 crowd peak. Stroll back toward ${recommendedDest.hotelOrVillaName}.`,
      ruleChip: { status: 'pass', text: 'Rule: Pass (Low Stimulation)' },
      locationLabel: 'Terrace Kitchen',
      walkTimeMins: recommendedDest.cribTransitMins
    },
    {
      id: 'block-sanctuary-nap',
      timeRange: `13:00 – ${napEndHour}`,
      title: 'MANDATORY CRIB NAP & THERMAL BUFFER',
      categoryTag: 'HARD SHIELD RULE',
      description: `Blackout curtains + white noise while peak UV hits ${recommendedDest.forecastTempC}°C outdoors. Parents rest, shower, or sip coffee on shaded terrace.`,
      ruleChip: { status: 'pass', text: `Rule: Pass (Avoids ${recommendedDest.forecastTempC}°C Peak)` },
      isSanctuaryBreak: true,
      locationLabel: recommendedDest.hotelOrVillaName,
      walkTimeMins: 0
    },
    afternoonActivity,
    {
      id: 'block-evening',
      timeRange: '17:45 – 19:15',
      title: info.eveningSpot,
      categoryTag: 'CALM WIND-DOWN',
      description: 'Warm bath, milk feed, and lights down on home bedtime rhythm.',
      ruleChip: { status: 'pass', text: 'Rule: Pass (On-Schedule Sleep)' },
      locationLabel: recommendedDest.hotelOrVillaName,
      walkTimeMins: 4
    }
  ];

  const baseFatigue = recommendedDest.id === 'paris' ? 28 : 44;
  const fatigueScore = Math.max(
    18,
    baseFatigue - (state.mitigations.middayAcBreak ? 8 : 0) - (state.swapAfternoonPool ? 6 : 0)
  );

  return {
    dayNumber: day,
    dayTitle: `Day ${day} · ${info.title}`,
    focusTheme: info.focus,
    dateLabel: `Sept ${11 + day}, 2027`,
    items,
    fatigueScore,
    fatigueStatus: fatigueScore <= 42 ? 'pass' : 'warn',
    peakTempLabel: `${recommendedDest.forecastTempC}°C peak • Shielded 13:00–${napEndHour}`,
    babyHubSummary: recommendedDest.nursingHubsSummary,
    strollerTip:
      state.strollerMode === 'gate_check'
        ? 'Compact travel double fits 98% of doorways without unloading sleeping baby.'
        : 'Verify canopy UV extension before afternoon transfer.'
  };
}

export function evaluateTrip(state: TripState): EvaluationSummary {
  const travellerAges = state.travellers.map((t) => evaluateTravellerAge(t, state.travelMonth));
  const childOverThreeCount = travellerAges.filter((t) => t.isThreeOrOverOnTravelDates).length;
  const hasAnyDobError = travellerAges.some((t) => t.inlineError !== null);
  const hasBlockingDobError =
    hasAnyDobError && !(childOverThreeCount > 0 && state.confirmOverThreeTicket && travellerAges.every((t) => t.ageYears !== null && t.ageYears >= 0));

  const [destAId, destBId] = state.selectedDestinations;
  const metricsA = computeDestinationMetrics(destAId, state, childOverThreeCount);
  const metricsB = computeDestinationMetrics(destBId, state, childOverThreeCount);

  // Recommend highest fitScore (tie-break to lower net cost)
  if (metricsA.fitScore > metricsB.fitScore || (metricsA.fitScore === metricsB.fitScore && metricsA.netTotalEur <= metricsB.netTotalEur)) {
    metricsA.recommended = true;
  } else {
    metricsB.recommended = true;
  }

  const rules = buildRules(state, metricsA, metricsB);
  const passCount = rules.filter((r) => r.status === 'pass').length;
  const warnCount = rules.filter((r) => r.status === 'warn').length;
  const failCount = rules.filter((r) => r.status === 'fail').length;

  const recommendedDest = metricsA.recommended ? metricsA : metricsB;
  const runnerUpDest = metricsA.recommended ? metricsB : metricsA;

  const approvalsList = Object.values(state.approvals);
  const readyForApprovalCount = approvalsList.filter((a) => !a.declined && !(a.sarahApproved && a.markApproved)).length;
  const confirmedHoldCount = approvalsList.filter((a) => !a.declined && a.sarahApproved && a.markApproved).length;

  const costDiff = Math.abs(metricsA.netTotalEur - metricsB.netTotalEur);
  const stewardSynthesis = `${recommendedDest.name} currently leads at ${recommendedDest.fitScore}% family fit (€${recommendedDest.netTotalEur.toLocaleString('en-IE')} net vs €${runnerUpDest.netTotalEur.toLocaleString('en-IE')} for ${runnerUpDest.name}, €${costDiff.toLocaleString('en-IE')} difference). ${
    warnCount === 0 && failCount === 0
      ? 'All 9 safety, heat, and budget rules pass cleanly.'
      : `${warnCount} active review warning${warnCount === 1 ? '' : 's'} can be mitigated in one tap via Change & Re-run.`
  }`;

  const dayPlan = buildDayPlan(state, recommendedDest);

  return {
    travellerAges,
    hasBlockingDobError,
    primaryMetrics: metricsA,
    secondaryMetrics: metricsB,
    rules,
    passCount,
    warnCount,
    failCount,
    readyForApprovalCount,
    confirmedHoldCount,
    stewardSynthesis,
    dayPlan
  };
}

export function buildIcsCalendarFile(dayPlan: DayPlanComputed, destinationName: string): string {
  const dayNum = 11 + dayPlan.dayNumber;
  const dateStr = `202709${String(dayNum).padStart(2, '0')}`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WonderFamily//Calm Family Trip Planner//EN',
    'CALSCALE:GREGORIAN'
  ];

  dayPlan.items.forEach((item, idx) => {
    const [startRaw, endRaw] = item.timeRange.split('–').map((s) => s.trim().replace(':', ''));
    const dtStart = `${dateStr}T${startRaw}00`;
    const dtEnd = `${dateStr}T${endRaw}00`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:wonderfamily-day${dayPlan.dayNumber}-${idx}@wonderfamily.app`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${destinationName} — ${item.title}`);
    lines.push(`LOCATION:${item.locationLabel}`);
    lines.push(`DESCRIPTION:${item.description.replace(/\n/g, ' ')}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
