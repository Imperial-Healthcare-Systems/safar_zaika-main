// MOCK — replace with the Safar Zaika backend railway endpoints.
// Frontend -> API client -> Safar Zaika backend -> Railway provider.
// Never call a railway data provider (e.g. RapidAPI) from the browser.
import { demoJourneys, demoPnrList } from "@/data/journeys";
import { findTrain, trainMap } from "@/data/trains";
import { getStation } from "@/data/stations";
import { restaurantsByStation } from "@/data/restaurants";
import { getRestaurantAvailability } from "./mockRestaurantService";
import { hashString, sleep } from "@/lib/utils";
import type { EligibleStation, Journey, ServiceErrorCode, ServiceResult, Train } from "@/types";

const ok = <T,>(data: T): ServiceResult<T> => ({ ok: true, data });
const fail = <T,>(code: ServiceErrorCode, message: string): ServiceResult<T> => ({ ok: false, error: { code, message } });

const latency = (base: number) => sleep(base + Math.random() * 500);

export const PNR_REGEX = /^\d{10}$/;

/**
 * Resolve a PNR to a journey.
 * Demo rules: 0000xxxxxx -> service error, 1111111111 -> not found,
 * seeded PNRs -> their journey, anything else -> a deterministic demo journey.
 */
export async function getPNRJourney(pnr: string): Promise<ServiceResult<Journey>> {
  await latency(1500);
  const clean = pnr.replace(/\s/g, "");
  if (!PNR_REGEX.test(clean)) {
    return fail("INVALID_PNR", "That PNR doesn't look right. It should be 10 digits, like on your ticket.");
  }
  if (clean.startsWith("0000")) {
    return fail("SERVICE_UNAVAILABLE", "We're having trouble checking your journey with the railway right now. Please try again in a moment.");
  }
  if (clean === "1111111111") {
    return fail("NOT_FOUND", "We couldn't find a journey for that PNR. Double-check the number on your ticket.");
  }
  const seeded = demoJourneys[clean];
  if (seeded) return ok(seeded);
  const base = demoJourneys[demoPnrList[hashString(clean) % demoPnrList.length]];
  return ok({ ...base, pnr: clean });
}

export async function getTrain(query: string): Promise<ServiceResult<Train>> {
  await latency(700);
  const exact = trainMap[query.trim()];
  if (exact) return ok(exact);
  const [first] = findTrain(query);
  if (first) return ok(first);
  return fail("TRAIN_NOT_FOUND", "Looks like we can't find that train. Try the 5-digit train number.");
}

export async function searchTrains(query: string): Promise<Train[]> {
  await sleep(120);
  return findTrain(query).slice(0, 6);
}

/** Build a guest journey (no passenger details) from a train, date and boarding station. */
export async function getJourneyByTrain(input: {
  trainNumber: string;
  date: string;
  boardingCode: string;
}): Promise<ServiceResult<Journey>> {
  await latency(900);
  const train = trainMap[input.trainNumber];
  if (!train) return fail("TRAIN_NOT_FOUND", "Looks like we can't find that train.");
  const boardingIndex = Math.max(0, train.stops.findIndex((s) => s.stationCode === input.boardingCode));
  return ok({
    pnr: null,
    trainNumber: train.number,
    trainName: train.name,
    from: train.stops[boardingIndex].stationCode,
    to: train.to,
    date: input.date,
    travelClass: train.classes[0],
    passengers: [],
    boardingIndex,
    destinationIndex: train.stops.length - 1,
    chartPrepared: false,
  });
}

const toMinutes = (hhmm: string | null, day: number) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (day - 1) * 24 * 60 + h * 60 + m;
};

/** Weekday (0 = Sunday) of journey day N, computed in UTC so the host timezone never shifts the date. */
const weekdayAt = (isoDate: string, day: number) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + (day - 1))).getUTCDay();
};

/** Minimum lead time a kitchen needs before the train reaches a station. */
export const MIN_LEAD_MINUTES = 45;

export function computeEligibleStations(journey: Journey): EligibleStation[] {
  const train = trainMap[journey.trainNumber];
  if (!train) return [];
  const boarding = train.stops[journey.boardingIndex];
  const boardingMin = toMinutes(boarding.departure ?? boarding.arrival, boarding.day);
  return train.stops.map((stop, i) => {
    const station = getStation(stop.stationCode) ?? {
      code: stop.stationCode,
      name: stop.stationCode,
      city: "",
      state: "",
      lat: 0,
      lng: 0,
    };
    const minutesFromBoarding = toMinutes(stop.arrival ?? stop.departure, stop.day) - boardingMin;
    // Only kitchens that are live and inside a service window at the scheduled arrival count (vendor availability by day/time slot).
    const moment = { hhmm: stop.arrival ?? stop.departure ?? "00:00", weekday: weekdayAt(journey.date, stop.day) };
    const restaurantCount = restaurantsByStation(stop.stationCode).filter((r) => getRestaurantAvailability(r, moment).open).length;
    let availability: EligibleStation["availability"] = "available";
    if (i <= journey.boardingIndex) availability = "passed";
    else if (i >= journey.destinationIndex) availability = "destination";
    else if (minutesFromBoarding < MIN_LEAD_MINUTES) availability = "too-soon";
    else if (restaurantCount === 0) availability = "no-food";
    return { station, stop, availability, restaurantCount, minutesFromBoarding };
  });
}

export async function getEligibleStations(journey: Journey): Promise<ServiceResult<EligibleStation[]>> {
  await latency(500);
  return ok(computeEligibleStations(journey));
}
