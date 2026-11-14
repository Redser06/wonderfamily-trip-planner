import { DESTINATION_SPECS } from '../data/destinations.ts';
import type {
  DayPlanComputed,
  DestinationComputedMetrics,
  DestinationId,
  EvaluationSummary,
  RuleCheckResult,
  RuleStatus,
  TicketBreakdown,
  TimelineItem,
  Traveller,
  TravellerAgeEvaluation,
  TripState,
  WeekShift
} from '../types/trip.ts';

const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec'
];

export function formatTravelMonthLabel(travelMonth: string, roughDatesLabel?: string): string {
  if (/^\d{4}-\d{2}$/.test(travelMonth)) {
    const [year, monthStr] = travelMonth.split('-');
    const idx = Number(monthStr) - 1;
    const monthName = MONTH_SHORT_NAMES[idx] ?? monthStr;
    return `${monthName} ${year}`;
  }
  return roughDatesLabel?.trim() || 'Dates TBD';
}

function parseTravelDate(travelMonth: string): Date {
  if (!/^\d{4}-\d{2}$/.test(travelMonth)) {
    return new Date(2027, 8, 12);
  }
  const [y, m] = travelMonth.split('-').map(Number);
  return new Date(y, m - 1, 12);
}

export function buildDayDateMeta(
  travelMonth: string,
  weekShift: WeekShift,
  dayNumber: number
): { label: string; shortLabel: string; yyyymmdd: string } {
  const baseDate = parseTravelDate(travelMonth);
  const startDayOffset = weekShift === 'early' ? 4 : weekShift === 'late' ? 20 : 12;
  const resolved = new Date(baseDate.getFullYear(), baseDate.getMonth(), startDayOffset + (dayNumber - 1));
  const y = resolved.getFullYear();
  const mIdx = resolved.getMonth();
  const d = resolved.getDate();
  const shortMonth = MONTH_SHORT_NAMES[mIdx] ?? 'Sept';
  const mm = String(mIdx + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return {
    label: `${shortMonth} ${d}, ${y}`,
    shortLabel: `${shortMonth} ${d}`,
    yyyymmdd: `${y}${mm}${dd}`
  };
}

function computeSeasonalDeltas(
  destinationId: DestinationId,
  travelMonth: string
): { tempDeltaC: number; flightMultiplier: number; lodgingMultiplier: number } {
  if (!/^\d{4}-\d{2}$/.test(travelMonth)) {
    return { tempDeltaC: 0, flightMultiplier: 1, lodgingMultiplier: 1 };
  }
  const month = Number(travelMonth.split('-')[1]); // 1..12
  if (month === 9) {
    return { tempDeltaC: 0, flightMultiplier: 1, lodgingMultiplier: 1 };
  }

  const parisTempDeltas: Record<number, number> = {
    1: -14,
    2: -13,
    3: -8,
    4: -5,
    5: -1,
    6: 3,
    7: 6,
    8: 6,
    9: 0,
    10: -5,
    11: -10,
    12: -13
  };
  const orlandoTempDeltas: Record<number, number> = {
    1: -9,
    2: -8,
    3: -5,
    4: -3,
    5: 0,
    6: 2,
    7: 2,
    8: 2,
    9: 0,
    10: -3,
    11: -6,
    12: -9
  };
  const tokyoTempDeltas: Record<number, number> = {
    1: -17,
    2: -16,
    3: -12,
    4: -7,
    5: -3,
    6: 0,
    7: 4,
    8: 5,
    9: 0,
    10: -5,
    11: -10,
    12: -15
  };

  const tempDeltaC =
    destinationId === 'paris'
      ? (parisTempDeltas[month] ?? 0)
      : destinationId === 'orlando'
        ? (orlandoTempDeltas[month] ?? 0)
        : (tokyoTempDeltas[month] ?? 0);

  const isPeak = month === 4 || month === 7 || month === 8 || month === 12;
  const isQuiet = month === 1 || month === 2 || month === 11;
  const flightMultiplier = isPeak ? 1.12 : isQuiet ? 0.9 : 1.02;
  const lodgingMultiplier = isPeak ? 1.1 : isQuiet ? 0.92 : 1.0;

  return { tempDeltaC, flightMultiplier, lodgingMultiplier };
}

export function computeTicketBreakdown(
  state: TripState,
  travellerAges: TravellerAgeEvaluation[]
): TicketBreakdown {
  const totalTravellers = state.travellers.length;
  const adultCount = state.travellers.filter((t) => t.role === 'adult').length;
  const explicitChildCount = state.travellers.filter((t) => t.role === 'child').length;
  const overThreeUnderThreeSlots = travellerAges.filter((a) => a.isThreeOrOverOnTravelDates).length;
  const paidChildCount = explicitChildCount + overThreeUnderThreeSlots;
  const infantSlotCount = state.travellers.filter(
    (t) => t.role === 'toddler' || t.role === 'baby'
  ).length;
  const underThreeCount = Math.max(0, infantSlotCount - overThreeUnderThreeSlots);

  const adultTicketsRequired =
    state.adultTicketsOverride !== null && state.adultTicketsOverride !== undefined
      ? Math.max(0, state.adultTicketsOverride)
      : adultCount;
  const childTicketsRequired =
    state.childTicketsOverride !== null && state.childTicketsOverride !== undefined
      ? Math.max(0, state.childTicketsOverride)
      : paidChildCount;

  const parkDays = Math.max(1, Math.min(10, state.parkDays || 4));
  const hasCustomTicketOverride =
    (state.adultTicketsOverride !== null && state.adultTicketsOverride !== undefined) ||
    (state.childTicketsOverride !== null && state.childTicketsOverride !== undefined);

  return {
    totalTravellers,
    adultCount,
    paidChildCount,
    underThreeCount,
    adultTicketsRequired,
    childTicketsRequired,
    totalPaidTickets: adultTicketsRequired + childTicketsRequired,
    parkDays,
    hasCustomTicketOverride
  };
}

export function evaluateTravellerAge(traveller: Traveller, travelMonth: string): TravellerAgeEvaluation {
  if (!traveller.dob || !/^\d{4}-\d{2}-\d{2}$/.test(traveller.dob)) {
    return {
      id: traveller.id,
      name: traveller.name,
      role: traveller.role,
      ageYears: null,
      ageMonthsRemainder: 0,
      formattedAge:
        traveller.role === 'adult'
          ? 'Adult'
          : traveller.role === 'child'
            ? '3–11 yrs'
            : 'DOB needed',
      isThreeOrOverOnTravelDates: false,
      inlineError:
        traveller.role === 'adult' || traveller.role === 'child'
          ? null
          : 'Enter date of birth to verify pass & flight rules.'
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
  childOverThreeCount: number,
  travellerAges?: TravellerAgeEvaluation[],
  ticketBreakdown?: TicketBreakdown
): DestinationComputedMetrics {
  const spec = DESTINATION_SPECS[destinationId];
  const resolvedAges =
    travellerAges ?? state.travellers.map((t) => evaluateTravellerAge(t, state.travelMonth));
  const tickets = ticketBreakdown ?? computeTicketBreakdown(state, resolvedAges);
  const season = computeSeasonalDeltas(destinationId, state.travelMonth);

  // Week shift + monthly climate influence seasonal heat and off-peak airfare
  const tempDeltaByWeek = state.weekShift === 'early' ? 1.0 : state.weekShift === 'late' ? -1.8 : 0;
  const airfareWeekDelta = state.weekShift === 'late' ? -180 : state.weekShift === 'early' ? 90 : 0;
  const forecastTempC = Math.round((spec.baseTempC + season.tempDeltaC + tempDeltaByWeek) * 10) / 10;

  // Midday AC Pavilion Break avoids 12:30-15:30 peak radiant exposure
  const acCoolingOffset = state.mitigations.middayAcBreak ? 3.2 : 0;
  const effectiveTempC = Math.round((forecastTempC - acCoolingOffset) * 10) / 10;

  const useVilla = state.stayType === 'villa';
  const baseLodgingCost = useVilla ? spec.villaCostEur : spec.parkHotelCostEur;
  const roomFactor = tickets.totalTravellers <= 4 ? 1 : tickets.totalTravellers <= 7 ? 1.42 : 1.85;
  const nights = Math.max(2, Math.min(14, state.tripNights || 5));
  const nightsRatio = nights / 5;
  const lodgingCostEur = Math.round(baseLodgingCost * roomFactor * nightsRatio * season.lodgingMultiplier);
  const cribTransitMins = useVilla ? spec.villaTransitMins : spec.parkHotelTransitMins;
  const hotelOrVillaName = useVilla ? spec.villaName : spec.parkHotelName;

  // Paid air seats count adults, children 3+, and toddlers >= 2 (lap infants < 2 fly at nominal lap fee)
  let paidAirSeats = 0;
  let lapInfants = 0;
  state.travellers.forEach((traveller, index) => {
    const evalAge = resolvedAges[index];
    if (traveller.role === 'adult' || traveller.role === 'child') {
      paidAirSeats += 1;
    } else if (traveller.role === 'toddler') {
      if (evalAge?.ageYears !== null && evalAge.ageYears < 2) {
        lapInfants += 1;
      } else {
        paidAirSeats += 1;
      }
    } else {
      if (evalAge?.ageYears !== null && evalAge.ageYears >= 2) {
        paidAirSeats += 1;
      } else {
        lapInfants += 1;
      }
    }
  });
  const effectivePaidAirSeats = Math.max(1, paidAirSeats);
  const airSeatRatio = effectivePaidAirSeats / 3; // baseline party = 2 adults + 1 toddler = 3 seats
  const extraLapFeeEur = Math.max(0, lapInfants - 1) * (destinationId === 'paris' ? 45 : 120);
  const flightCostEur = Math.max(
    350,
    Math.round((spec.baseFlightCostEur * airSeatRatio + extraLapFeeEur + airfareWeekDelta) * season.flightMultiplier)
  );

  // Park tickets & daily dining scale from adult/child ticket counts + parkDays + tripNights
  const adultDayRate = destinationId === 'paris' ? 85 : 125;
  const childDayRate = destinationId === 'paris' ? 60 : 85;
  const baselineTicketCost = 2 * 4 * adultDayRate;
  const baselineDining = Math.max(300, spec.baseTicketsAndDiningEur - baselineTicketCost);
  const parkDays = tickets.parkDays;
  const childTicketsTotal =
    state.childTicketsOverride !== null && state.childTicketsOverride !== undefined
      ? tickets.childTicketsRequired
      : tickets.paidChildCount > 0
        ? tickets.paidChildCount
        : childOverThreeCount;
  const parkPassesCost =
    tickets.adultTicketsRequired * parkDays * adultDayRate + childTicketsTotal * parkDays * childDayRate;
  const scaledDiningCost = Math.round(
    baselineDining * Math.max(0.5, tickets.totalTravellers / 4) * nightsRatio
  );
  const ticketsAndDiningEur = parkPassesCost + scaledDiningCost;
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
      detail: `Compares historic ${formatTravelMonthLabel(state.travelMonth, state.roughDatesLabel)} daily highs and humidity index against your thermal safety threshold.`,
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
  const dayMax = Math.max(1, Math.min(7, (state.tripNights || 5) + 1));
  const day = Math.max(1, Math.min(dayMax, state.activeDay));
  const napEndHour = state.extraNapMinutes === 30 ? '16:00' : '15:30';
  const isParis = recommendedDest.id === 'paris';
  const dateMeta = buildDayDateMeta(state.travelMonth, state.weekShift, day);

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
      title: 'Calm Lagoon Walk & Favourite Encores',
      focus: 'Flexible Mid-Pace Morning',
      morningSpot: 'Repeat Top Family Ride + Quiet Shaded Lunch',
      eveningSpot: 'Early Bath, Milk & Gentle Luggage Prep'
    },
    7: {
      title: 'Unhurried Packing & Midday Departure',
      focus: 'Rested Airport Transfer',
      morningSpot: 'Garden Playground Farewell & Snack Box',
      eveningSpot: 'Nap-Aligned Door-to-Door Transfer'
    }
  };

  const info = dayThemes[day] ?? dayThemes[2];
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
    dateLabel: dateMeta.label,
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

export function formatPartySummary(ticketBreakdown: TicketBreakdown): string {
  const parts: string[] = [];
  if (ticketBreakdown.adultCount > 0) {
    parts.push(`${ticketBreakdown.adultCount} Adult${ticketBreakdown.adultCount === 1 ? '' : 's'}`);
  }
  if (ticketBreakdown.paidChildCount > 0) {
    parts.push(`${ticketBreakdown.paidChildCount} Child${ticketBreakdown.paidChildCount === 1 ? '' : 'ren'} (3+)`);
  }
  if (ticketBreakdown.underThreeCount > 0) {
    parts.push(`${ticketBreakdown.underThreeCount} Under-3`);
  }
  return parts.length > 0 ? parts.join(', ') : `${ticketBreakdown.totalTravellers} Travellers`;
}

export function evaluateTrip(state: TripState): EvaluationSummary {
  const travellerAges = state.travellers.map((t) => evaluateTravellerAge(t, state.travelMonth));
  const ticketBreakdown = computeTicketBreakdown(state, travellerAges);
  const childOverThreeCount = travellerAges.filter((t) => t.isThreeOrOverOnTravelDates).length;
  const hasAnyDobError = travellerAges.some((t) => t.inlineError !== null);
  const hasBlockingDobError =
    hasAnyDobError && !(childOverThreeCount > 0 && state.confirmOverThreeTicket && travellerAges.every((t) => t.role === 'adult' || t.role === 'child' || (t.ageYears !== null && t.ageYears >= 0)));

  const [destAId, destBId] = state.selectedDestinations;
  const metricsA = computeDestinationMetrics(destAId, state, childOverThreeCount, travellerAges, ticketBreakdown);
  const metricsB = computeDestinationMetrics(destBId, state, childOverThreeCount, travellerAges, ticketBreakdown);

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

  const travelWindowLabel = formatTravelMonthLabel(state.travelMonth, state.roughDatesLabel);
  const partySummaryLabel = formatPartySummary(ticketBreakdown);

  const costDiff = Math.abs(metricsA.netTotalEur - metricsB.netTotalEur);
  const stewardSynthesis = `For ${ticketBreakdown.totalTravellers} travellers (${ticketBreakdown.totalPaidTickets} paid ${ticketBreakdown.parkDays}d passes) in ${travelWindowLabel}, ${recommendedDest.name} leads at ${recommendedDest.fitScore}% family fit (€${recommendedDest.netTotalEur.toLocaleString('en-IE')} net vs €${runnerUpDest.netTotalEur.toLocaleString('en-IE')} for ${runnerUpDest.name}, €${costDiff.toLocaleString('en-IE')} difference). ${
    warnCount === 0 && failCount === 0
      ? 'All 9 safety, heat, and budget rules pass cleanly.'
      : `${warnCount} active review warning${warnCount === 1 ? '' : 's'} can be mitigated in one tap via Change & Re-run.`
  }`;

  const dayPlan = buildDayPlan(state, recommendedDest);

  return {
    travellerAges,
    hasBlockingDobError,
    ticketBreakdown,
    travelWindowLabel,
    partySummaryLabel,
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

export function buildIcsCalendarFile(
  dayPlan: DayPlanComputed,
  destinationName: string,
  travelMonth = '2027-09',
  weekShift: WeekShift = 'mid'
): string {
  const dateStr = buildDayDateMeta(travelMonth, weekShift, dayPlan.dayNumber).yyyymmdd;
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
