import type { DestinationId, StayType, TripState } from '../types/trip.ts';

export interface DestinationBaseSpec {
  id: DestinationId;
  name: string;
  subtitle: string;
  regionBadge: string;
  flightDurationHours: number;
  flightLabel: string;
  baseTempC: number;
  humidityPct: number;
  baseFlightCostEur: number;
  parkHotelCostEur: number;
  villaCostEur: number;
  parkHotelName: string;
  villaName: string;
  parkHotelTransitMins: number;
  villaTransitMins: number;
  baseTicketsAndDiningEur: number;
  aviosMaxOffsetEur: number;
  nursingHubsSummary: string;
  gentleRidesPct: number;
  insuranceRequirement: string;
  cancellationSummary: string;
  tradeOffs: string[];
}

export const DESTINATION_SPECS: Record<DestinationId, DestinationBaseSpec> = {
  paris: {
    id: 'paris',
    name: 'Paris',
    subtitle: 'Fairytale Kingdom & Studios',
    regionBadge: 'Short-haul • Same-zone comfort',
    flightDurationHours: 1.35,
    flightLabel: '1h 20m direct / Rail',
    baseTempC: 22,
    humidityPct: 58,
    baseFlightCostEur: 880,
    parkHotelCostEur: 2420,
    villaCostEur: 2140,
    parkHotelName: 'Lakeside Promenade Hotel',
    villaName: 'Marne Valley Garden Cottage',
    parkHotelTransitMins: 12,
    villaTransitMins: 24,
    baseTicketsAndDiningEur: 1900,
    aviosMaxOffsetEur: 420,
    nursingHubsSummary: '2 Baby Care Centers + Feeding Pods (< 3m queue)',
    gentleRidesPct: 78,
    insuranceRequirement: 'EHIC/GHIC + Standard Family Medical Cover',
    cancellationSummary: '100% free cancellation until 14 days prior',
    tradeOffs: [
      'Shortest flight (1h 20m) — zero jet-lag disruption to 19:00 bedtime',
      'Mild 22°C early autumn climate keeps toddler hydration effortless',
      'Fewer covered water-play zones if an unseasonable drizzle hits'
    ]
  },
  orlando: {
    id: 'orlando',
    name: 'Orlando',
    subtitle: 'Resort Parks Hub',
    regionBadge: 'Long-haul • Warm subtropical climate',
    flightDurationHours: 9.0,
    flightLabel: '9h 00m direct transatlantic',
    baseTempC: 31,
    humidityPct: 78,
    baseFlightCostEur: 3120,
    parkHotelCostEur: 3480,
    villaCostEur: 2890,
    parkHotelName: 'Lagoon Monorail Family Suite',
    villaName: 'Kissimmee Shaded Pool Villa',
    parkHotelTransitMins: 10,
    villaTransitMins: 27,
    baseTicketsAndDiningEur: 2440,
    aviosMaxOffsetEur: 1140,
    nursingHubsSummary: '4 Dedicated Nursing Hubs + Private Cooling Suites',
    gentleRidesPct: 82,
    insuranceRequirement: 'Requires Comprehensive $2M Pediatric ER Cover (US)',
    cancellationSummary: 'Free cancellation until 14 days prior (airline hold €0 today)',
    tradeOffs: [
      'Higher Avios redemption leverage (saves up to €1,140 on reward seats)',
      '9h flight + 5h time-zone shift increases Day 1–2 infant fatigue',
      'Sept heat index (31°C / 78% hum.) requires structured midday indoor rest'
    ]
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Bay',
    subtitle: 'Harbor Fantasy Resort',
    regionBadge: 'Ultra long-haul • Exceeds 8h infant guideline',
    flightDurationHours: 13.5,
    flightLabel: '13h 30m long-haul direct',
    baseTempC: 27,
    humidityPct: 71,
    baseFlightCostEur: 4480,
    parkHotelCostEur: 2960,
    villaCostEur: 2540,
    parkHotelName: 'Harbor Monorail Terrace Hotel',
    villaName: 'Chiba Quiet Family Residence',
    parkHotelTransitMins: 9,
    villaTransitMins: 26,
    baseTicketsAndDiningEur: 1780,
    aviosMaxOffsetEur: 1320,
    nursingHubsSummary: '5 Quiet Baby Stations + Formula Water Dispensers',
    gentleRidesPct: 80,
    insuranceRequirement: 'Comprehensive International Pediatric Medical Cover',
    cancellationSummary: 'Free cancellation up to 21 days prior; Visa check required',
    tradeOffs: [
      'Spotless baby care facilities and punctual elevated rail loops',
      '13h 30m flight duration + 8h jet lag breaches 8h infant ceiling',
      'Higher airfare leaves tight margin inside a €9,000 cap'
    ]
  }
};

export function createInitialTripState(): TripState {
  return {
    travellers: [
      { id: 'adult-1', name: 'Sarah', role: 'adult', roleLabel: 'Adult 1', dob: '1991-06-15' },
      { id: 'adult-2', name: 'Mark', role: 'adult', roleLabel: 'Adult 2', dob: '1989-11-03' },
      // Default October 2024 puts Leo at 2y 10m in Sept 2027 (under-3 pass valid); entering May 2024 demonstrates the >=3 inline validation state.
      { id: 'child-1', name: 'Leo', role: 'toddler', roleLabel: 'Toddler', dob: '2024-10-14' },
      { id: 'child-2', name: 'Maya', role: 'baby', roleLabel: 'Baby', dob: '2026-11-22' }
    ],
    travelMonth: '2027-09',
    flexibleWeeks: 2,
    selectedDestinations: ['orlando', 'paris'],
    maxFlightHours: 8,
    departureWindow: 'morning_nap',
    heatLimitC: 28,
    budgetCeilingEur: 9000,
    aviosBalance: 120000,
    stayType: 'either',
    weekShift: 'mid',
    maxCribTransitMins: 15,
    strollerMode: 'gate_check',
    mitigations: {
      overnightFlight: false,
      middayAcBreak: false
    },
    pacingProfile: 'toddler_infant',
    activeDay: 2,
    swapAfternoonPool: false,
    extraNapMinutes: 0,
    confirmOverThreeTicket: false,
    approvals: {
      paris: {
        optionId: 'paris',
        title: 'Option A · Paris Fairytale Package',
        destinationId: 'paris',
        summaryLine: 'Lakeside Promenade Hotel (Park-Side Family Room) + 4d Short-Haul Rail/Flight',
        holdExpiresLabel: '48h zero-deposit courtesy hold',
        depositDueTodayEur: 0,
        cancellationTerms: '100% free cancellation until 14 days prior. Auto-expires if unpaid.',
        sarahApproved: false,
        markApproved: false,
        declined: false
      },
      orlando: {
        optionId: 'orlando',
        title: 'Option B · Orlando Resort Package',
        destinationId: 'orlando',
        summaryLine: 'Lagoon Monorail Family Suite + Direct Return Flights (Reward Offset Applied)',
        holdExpiresLabel: '48h zero-deposit courtesy hold',
        depositDueTodayEur: 0,
        cancellationTerms: '100% free cancellation until 14 days prior; €0 due until final approval.',
        sarahApproved: false,
        markApproved: false,
        declined: false
      }
    }
  };
}

export function createEmptyTripState(): TripState {
  const base = createInitialTripState();
  return {
    ...base,
    travellers: [
      { id: 'adult-1', name: 'Sarah', role: 'adult', roleLabel: 'Adult 1', dob: '' },
      { id: 'adult-2', name: 'Mark', role: 'adult', roleLabel: 'Adult 2', dob: '' },
      { id: 'child-1', name: 'Leo', role: 'toddler', roleLabel: 'Toddler', dob: '' },
      { id: 'child-2', name: 'Maya', role: 'baby', roleLabel: 'Baby', dob: '' }
    ],
    travelMonth: '',
    budgetCeilingEur: 0,
    aviosBalance: 0
  };
}

export function resolveStayLabel(stayType: StayType): string {
  if (stayType === 'villa') return 'Private Villa';
  if (stayType === 'park_hotel') return 'Park Hotel';
  return 'Park Hotel / Villa';
}
