"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, CalendarClock, Utensils } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { getTrainSchedule } from "@/services";
import { cn, formatClock } from "@/lib/utils";
import type { ScheduleStop, TrainSchedule } from "@/types";
import { IdleHint, ToolError, TrainSearch } from "./ToolParts";

type State = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "done"; data: TrainSchedule };

/** Desktop column template shared by the header row and every stop: station, 5 figures, food. */
const COLS = "lg:grid lg:grid-cols-[minmax(0,2.4fr)_repeat(5,minmax(0,1fr))_minmax(0,2.6fr)] lg:items-center lg:gap-x-4";

export function ScheduleTool() {
  const [state, setState] = useState<State>({ status: "idle" });
  const req = useRef(0);

  const search = async (query: string) => {
    const mine = ++req.current;
    setState({ status: "loading" });
    const res = await getTrainSchedule(query);
    if (mine !== req.current) return;
    setState(res.ok ? { status: "done", data: res.data } : { status: "error", message: res.error.message });
  };

  return (
    <div className="space-y-6">
      <TrainSearch action="Show schedule" loading={state.status === "loading"} onSearch={(q) => void search(q)} note="Demo timetable: approximate times for a few sample trains, not an official schedule." />
      <div aria-live="polite">
        {state.status === "idle" && <IdleHint icon={<CalendarClock className="size-5" />}>Search a train to see every stop with its times, and the stops that have partner kitchens.</IdleHint>}
        {state.status === "loading" && (
          <div role="status" aria-label="Loading the schedule" className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="ml-10 h-16 rounded-2xl" />
            ))}
          </div>
        )}
        {state.status === "error" && <ToolError message={state.message} />}
        {state.status === "done" && <Timetable data={state.data} />}
      </div>
    </div>
  );
}

function Timetable({ data: { train, stops } }: { data: TrainSchedule }) {
  const last = stops.length - 1;
  const withFood = stops.filter((s) => s.foodAvailable).length;
  return (
    <section aria-label={`Schedule of ${train.number} ${train.name}`}>
      {/* Sticks under the navbar while the stops scroll. */}
      <header className="sticky top-[68px] z-10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-cocoa-900 px-4 py-3.5 text-cream-50 shadow-lift sm:px-6 lg:top-[76px]">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl">
            {train.number} {train.name}
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tag-dark">{train.from}</span>
            <ArrowRight className="size-3.5 text-cream-50/60" aria-hidden />
            <span className="tag-dark">{train.to}</span>
            <span className="ml-1 text-xs text-cream-50/65">
              {stops.length} stops &middot; {stops[last].distanceKm.toLocaleString("en-IN")} km
            </span>
          </p>
        </div>
        <dl className="flex gap-6 sm:ml-auto">
          <div>
            <dt className="text-xs text-cream-50/65">Runs on</dt>
            <dd className="mt-0.5 text-[15px] font-bold leading-tight">{train.runsOn}</dd>
          </div>
          <div>
            <dt className="text-xs text-cream-50/65">Classes</dt>
            <dd className="mt-0.5 text-[15px] font-bold leading-tight">{train.classes.join(" · ")}</dd>
          </div>
        </dl>
      </header>

      <p className="mt-4 text-sm text-muted">
        Food available at {withFood} of {stops.length} stops. Times are scheduled times.
      </p>

      {/* Column labels for the desktop rows; each figure carries its own label for smaller screens and screen readers. */}
      <div aria-hidden className={cn("mt-4 hidden pl-[3.8125rem] pr-[1.3125rem] text-xs font-semibold text-muted", COLS)}>
        <span>Station</span>
        <span>Arrives</span>
        <span>Departs</span>
        <span>Halt</span>
        <span>Day</span>
        <span>Distance</span>
        <span>Food</span>
      </div>

      <ol className="mt-3 lg:mt-2">
        {stops.map((s, i) => (
          <li key={s.stationCode + i} className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3">
            {/* The rail: a continuous line down the stops with a dot at each station. */}
            <span aria-hidden className="relative">
              <span className={cn("absolute left-1/2 w-[3px] -translate-x-1/2 bg-rail-300", i === 0 ? "bottom-0 top-8 lg:top-1/2" : i === last ? "top-0 h-8 lg:h-1/2" : "inset-y-0")} />
              <span
                className={cn(
                  "absolute left-1/2 top-8 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] lg:top-[calc(50%-0.25rem)] lg:group-last:top-1/2",
                  i === 0 || i === last ? "border-cocoa-900 bg-cocoa-900" : s.foodAvailable ? "border-leaf-500 bg-white" : "border-rail-500 bg-white",
                )}
              />
            </span>
            {/* The gap between stops is padding inside the row, so the rail runs through it. */}
            <div className="pb-3 group-last:pb-0 lg:pb-2">
              <Stop stop={s} first={i === 0} last={i === last} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One stop: a table-like row from lg up, a stacked card on phones and tablets. */
function Stop({ stop, first, last }: { stop: ScheduleStop; first: boolean; last: boolean }) {
  const { station } = stop;
  const place = [station.city !== station.name && station.city, station.state].filter(Boolean).join(", ");
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-4 lg:px-5 lg:py-3", COLS)}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-cocoa-900">
          {station.name}
          <span className="tag">{station.code}</span>
        </p>
        {place && <p className="mt-0.5 truncate text-xs text-muted">{place}</p>}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3 md:grid-cols-5 lg:contents">
        <Figure label="Arrives" value={first ? "Starts" : formatClock(stop.arrival)} />
        <Figure label="Departs" value={last ? "Ends" : formatClock(stop.departure)} />
        <Figure label="Halt" value={stop.halt ? `${stop.halt} min` : "-"} />
        <Figure label="Day" value={`Day ${stop.day}`} />
        <Figure label="Distance" value={`${stop.distanceKm.toLocaleString("en-IN")} km`} />
      </dl>
      <div className="mt-3 border-t border-line pt-2 lg:mt-0 lg:border-0 lg:pt-0">
        {stop.foodAvailable ? (
          <div className="flex flex-wrap items-center gap-x-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-bold text-leaf-700">
              <Utensils className="size-3.5" aria-hidden />
              Food available
            </span>
            <Link href={`/restaurants?station=${station.code}`} className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-copper-700 underline-offset-2 hover:underline lg:min-h-8">
              {stop.restaurantCount} kitchen{stop.restaurantCount === 1 ? "" : "s"}
              <span className="sr-only"> at {station.name}</span>
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="flex min-h-11 items-center text-[13px] text-muted lg:min-h-8">No kitchen at this stop</p>
        )}
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted lg:sr-only">{label}</dt>
      <dd className="text-[15px] font-bold leading-tight tabular-nums text-cocoa-900">{value}</dd>
    </div>
  );
}
