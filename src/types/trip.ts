export type AppTab = 'setup' | 'compare' | 'checks' | 'change' | 'approvals' | 'plan';

export type DestinationId = 'orlando' | 'paris' | 'tokyo';

export type StayType = 'villa' | 'park_hotel' | 'either';

export type WeekShift = 'early' | 'mid' | 'late';

export type DepartureWindow = 'morning_nap' | 'afternoon' | 'evening';

export type StrollerMode = 'gate_check' | 'checked_hold' | 'park_rental';

export type RuleStatus = 'pass' | 'warn' | 'fail';

export type RuleCategory = 'baby_toddler' | 'thermal_nap' | 'insurance_budget';

export type PacingProfileId = 'toddler_infant' | 'elementary_6yo' | 'multi_age';

export interface Traveller {
  id: string;
  name: string;
  role: 'adult' | 'toddler' | 'baby';
  roleLabel: string;
  dob: string; // YYYY-MM-DD or '' in empty mode
}

export interface MitigationToggles {
  overnightFlight: boolean;
  middayAcBreak: boolean;
}

export interface HoldApprovalState {
  optionId: 'paris' | 'orlando';
  title: string;
  destinationId: DestinationId;
  summaryLine: string;
  holdExpiresLabel: string;
  depositDueTodayEur: number;
  cancellationTerms: string;
  sarahApproved: boolean;
  markApproved: boolean;
  declined: boolean;
  declineReason?: string;
}

export interface TripState {
  travellers: Traveller[];
  travelMonth: string; // YYYY-MM, e.g. '2027-09'
  flexibleWeeks: number; // 0..4
  selectedDestinations: [DestinationId, DestinationId];
  maxFlightHours: number; // default 8
  departureWindow: DepartureWindow;
  heatLimitC: number; // default 28
  budgetCeilingEur: number; // default 9000
  aviosBalance: number; // default 120000
  stayType: StayType;
  weekShift: WeekShift;
  maxCribTransitMins: number; // default 15
  strollerMode: StrollerMode;
  mitigations: MitigationToggles;
  pacingProfile: PacingProfileId;
  activeDay: number; // 1..6
  swapAfternoonPool: boolean;
  extraNapMinutes: number; // 0 | 30
  confirmOverThreeTicket: boolean;
  approvals: Record<'paris' | 'orlando', HoldApprovalState>;
}

export interface TravellerAgeEvaluation {
  id: string;
  name: string;
  role: Traveller['role'];
  ageYears: number | null;
  ageMonthsRemainder: number;
  formattedAge: string;
  isThreeOrOverOnTravelDates: boolean;
  inlineError: string | null;
}

export interface DestinationComputedMetrics {
  id: DestinationId;
  name: string;
  subtitle: string;
  regionBadge: string;
  flightLabel: string;
  flightHours: number;
  grossTotalEur: number;
  aviosSavingsEur: number;
  netTotalEur: number;
  flightCostEur: number;
  lodgingCostEur: number;
  ticketsAndDiningEur: number;
  forecastTempC: number;
  effectiveTempC: number;
  humidityPct: number;
  cribTransitMins: number;
  nursingHubsSummary: string;
  gentleRidesPct: number;
  fitScore: number;
  recommended: boolean;
  hotelOrVillaName: string;
  accommodationSummary: string;
  insuranceRequirement: string;
  cancellationSummary: string;
  tradeOffs: string[];
}

export interface RuleCheckResult {
  id: string;
  code: string;
  title: string;
  category: RuleCategory;
  categoryLabel: string;
  status: RuleStatus;
  badgeText: string;
  summary: string;
  detail: string;
  leftComparison: {
    destinationId: DestinationId;
    label: string;
    status: RuleStatus;
    summary: string;
  };
  rightComparison: {
    destinationId: DestinationId;
    label: string;
    status: RuleStatus;
    summary: string;
  };
  aiSuggestion?: string;
  actionTab?: AppTab;
}

export interface TimelineItem {
  id: string;
  timeRange: string;
  title: string;
  categoryTag: string;
  description: string;
  ruleChip?: { status: RuleStatus; text: string };
  aiChip?: string;
  isSanctuaryBreak?: boolean;
  walkTimeMins?: number;
  locationLabel: string;
}

export interface DayPlanComputed {
  dayNumber: number;
  dayTitle: string;
  focusTheme: string;
  dateLabel: string;
  items: TimelineItem[];
  fatigueScore: number;
  fatigueStatus: RuleStatus;
  peakTempLabel: string;
  babyHubSummary: string;
  strollerTip: string;
}

export interface EvaluationSummary {
  travellerAges: TravellerAgeEvaluation[];
  hasBlockingDobError: boolean;
  primaryMetrics: DestinationComputedMetrics;
  secondaryMetrics: DestinationComputedMetrics;
  rules: RuleCheckResult[];
  passCount: number;
  warnCount: number;
  failCount: number;
  readyForApprovalCount: number;
  confirmedHoldCount: number;
  stewardSynthesis: string;
  dayPlan: DayPlanComputed;
}
