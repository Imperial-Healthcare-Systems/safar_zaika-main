"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EligibleStation, Journey } from "@/types";
import { computeEligibleStations, type DeliveryMoment } from "@/services";

interface JourneyState {
  journey: Journey | null;
  eligible: EligibleStation[];
  selectedStationCode: string | null;
  /** SMS/WhatsApp nudges before each halt where an order is possible (consent). */
  reminders: boolean;
  setJourney: (journey: Journey) => void;
  selectStation: (code: string | null) => void;
  setReminders: (on: boolean) => void;
  clear: () => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      journey: null,
      eligible: [],
      selectedStationCode: null,
      reminders: false,
      setJourney: (journey) =>
        set({ journey, eligible: computeEligibleStations(journey), selectedStationCode: null }),
      selectStation: (code) => set({ selectedStationCode: code }),
      setReminders: (on) => set({ reminders: on }),
      clear: () => set({ journey: null, eligible: [], selectedStationCode: null }),
    }),
    // Session-scoped: a journey belongs to this visit; a fresh visit never starts with a stale train in the navbar.
    { name: "sz-journey", skipHydration: true, storage: createJSONStorage(() => sessionStorage) },
  ),
);

export const selectSelectedStation = (s: JourneyState) =>
  s.eligible.find((e) => e.station.code === s.selectedStationCode) ?? null;

/* ---- Delivery moment ---------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");
// Wall clock as a primitive snapshot ("HH:mm|weekday") so useSyncExternalStore
// stays stable within a minute; re-checked every 30s.
const subscribeClock = (cb: () => void) => {
  const t = setInterval(cb, 30_000);
  return () => clearInterval(t);
};
const clockSnapshot = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}|${d.getDay()}`;
};
const serverSnapshot = () => "";

/**
 * When an order would reach the passenger: the scheduled arrival at the
 * delivery station (for `stationCode` if it is on the route, else the
 * selected station), otherwise the current time. Null until the clock is
 * known on the client.
 */
export function useDeliveryMoment(stationCode?: string | null): DeliveryMoment | null {
  const journey = useJourneyStore((s) => s.journey);
  const eligible = useJourneyStore((s) => s.eligible);
  const selectedCode = useJourneyStore((s) => s.selectedStationCode);
  const clock = useSyncExternalStore(subscribeClock, clockSnapshot, serverSnapshot);

  const stop = journey ? (eligible.find((e) => e.station.code === stationCode) ?? eligible.find((e) => e.station.code === selectedCode)) : undefined;
  const hhmm = stop?.stop.arrival ?? stop?.stop.departure;
  if (journey && stop && hhmm) {
    const day0 = new Date(`${journey.date}T00:00:00`).getDay();
    return { hhmm, weekday: (day0 + stop.stop.day - 1) % 7, source: "arrival" };
  }
  if (!clock) return null;
  const [time, weekday] = clock.split("|");
  return { hhmm: time, weekday: Number(weekday), source: "now" };
}
