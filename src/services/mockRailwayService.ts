// MOCK — replace with the Safar Zaika backend railway endpoints.
// Frontend -> API client -> Safar Zaika backend -> Railway provider.
// Never call a railway data provider (e.g. RapidAPI) from the browser.
import { demoJourneys, demoPnrList } from "@/data/journeys";
import { findTrain, trainMap } from "@/data/trains";
import { getStation } from "@/data/stations";
import { restaurantsByStation } from "@/data/restaurants";
import { getRestaurantAvailability } from "./mockRestaurantService";
import { hashString, sleep } from "@/lib/utils";
import type { EligibleStation, Journey, LiveStatus, PnrStatus, ServiceErrorCode, ServiceResult, Station, Train, TrainSchedule } from "@/types";

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

/* ------------------------------------------------------------------
   Train tools (/train-tools). Same envelope and demo rules as above.
------------------------------------------------------------------- */

const stationOf = (code: string): Station => getStation(code) ?? { code, name: code, city: "", state: "", lat: 0, lng: 0 };

/** "Aarav Mehta" -> "A**** M****": the status tool never shows a full passenger name. */
const maskName = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0] + "*".repeat(Math.max(1, w.length - 1)))
    .join(" ");

/** PNR status. Resolves the PNR exactly like `getPNRJourney` (same demo PNRs, same errors). */
export async function getPnrStatus(pnr: string): Promise<ServiceResult<PnrStatus>> {
  const res = await getPNRJourney(pnr);
  if (!res.ok) return res;
  const journey = res.data;
  const train = trainMap[journey.trainNumber];
  if (!train) return fail("TRAIN_NOT_FOUND", "Looks like we can't find that train.");
  const from = train.stops[journey.boardingIndex];
  const to = train.stops[journey.destinationIndex];
  return ok({
    journey,
    train,
    passengers: journey.passengers.map(({ name, coach, berth, berthType, status }) => ({ name: maskName(name), coach, berth, berthType, status })),
    chartPrepared: journey.chartPrepared,
    boardingStation: stationOf(from.stationCode),
    destinationStation: stationOf(to.stationCode),
    departure: from.departure,
    arrival: to.arrival,
  });
}

/** Timetable of a train (by number or name), every stop, with the partner kitchens we have there. */
export async function getTrainSchedule(query: string): Promise<ServiceResult<TrainSchedule>> {
  const res = await getTrain(query);
  if (!res.ok) return res;
  const train = res.data;
  return ok({
    train,
    stops: train.stops.map((s) => {
      const restaurantCount = restaurantsByStation(s.stationCode).length;
      return { ...s, station: stationOf(s.stationCode), restaurantCount, foodAvailable: restaurantCount > 0 };
    }),
  });
}

const DAY = 24 * 60;
/** Demo delays in minutes; a train always gets the same one (picked by a hash of its number). */
const LIVE_DELAYS = [0, 0, 7, 12, 18, 25];
/** How long after reaching the destination the board still says "arrived" before showing the next departure. */
const ARRIVED_HOLD = 60;
const toClock = (min: number) => {
  const m = ((Math.round(min) % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/**
 * SIMULATED train position. There is no live running feed in this prototype:
 * the position is worked out from the demo timetable alone. The train is
 * assumed to run daily, to leave its origin `delayMinutes` late (a fixed
 * number derived from the train number) and to keep that delay all the way.
 * `nowMinutes` is minutes since midnight in the timetable's timezone (IST),
 * passed in by the caller so this stays a pure function.
 * The real backend replaces this with the railway's running status.
 */
export function computeLiveStatus(train: Train, nowMinutes: number): LiveStatus {
  const stops = train.stops;
  const last = stops.length - 1;
  const origin = toMinutes(stops[0].departure, 1);
  // minutes from the origin's scheduled departure to each stop
  const at = stops.map((s) => ({ arr: toMinutes(s.arrival ?? s.departure, s.day) - origin, dep: toMinutes(s.departure ?? s.arrival, s.day) - origin }));
  const total = at[last].arr;
  const delayMinutes = LIVE_DELAYS[hashString(train.number) % LIVE_DELAYS.length];
  const now = ((Math.floor(nowMinutes) % DAY) + DAY) % DAY;
  // Minutes since the most recent (delayed) departure from the origin, 0..DAY. If that run has
  // already finished, every earlier run has too, so the board shows the next departure instead.
  // ponytail: always the most recent departure, so a train that runs longer than 24h (12627) never
  // shows its last legs. Add a start-date parameter when the real running feed is connected.
  const t = (((now - origin - delayMinutes) % DAY) + DAY) % DAY;
  const base = { train, simulated: true, delayMinutes, asOf: toClock(now) };

  if (t > total + ARRIVED_HOLD) {
    return { ...base, state: "not-started", lastStation: null, nextStation: stationOf(stops[0].stationCode), minutesToNext: DAY - t, eta: toClock(origin + delayMinutes), progress: 0 };
  }
  if (t >= total) {
    return { ...base, state: "arrived", lastStation: stationOf(stops[last].stationCode), nextStation: null, minutesToNext: 0, eta: null, progress: 1 };
  }
  let i = 0;
  while (i < last - 1 && at[i + 1].arr <= t) i++;
  const standing = t < at[i].dep;
  const leg = at[i + 1].arr - at[i].dep;
  const along = standing || leg <= 0 ? 0 : (t - at[i].dep) / leg;
  return {
    ...base,
    state: standing ? "at-station" : "running",
    lastStation: stationOf(stops[i].stationCode),
    nextStation: stationOf(stops[i + 1].stationCode),
    minutesToNext: Math.ceil(at[i + 1].arr - t),
    eta: toClock(origin + at[i + 1].arr + delayMinutes),
    progress: (i + along) / last,
  };
}

/**
 * "Live" status of a train: SIMULATED from the timetable (see `computeLiveStatus`), not live data.
 * `nowMinutes` = minutes since midnight IST, read from the clock by the caller.
 */
export async function getLiveStatus(trainNumber: string, nowMinutes: number): Promise<ServiceResult<LiveStatus>> {
  const res = await getTrain(trainNumber);
  if (!res.ok) return res;
  return ok(computeLiveStatus(res.data, nowMinutes));
}
