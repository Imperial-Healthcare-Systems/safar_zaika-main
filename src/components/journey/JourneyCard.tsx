"use client";

import { ArrowRight, UserRound } from "lucide-react";
import { getStation } from "@/data/stations";
import { trainMap } from "@/data/trains";
import { cn, formatClock, formatDate } from "@/lib/utils";
import type { Journey } from "@/types";

/** Ticket-shaped journey summary on navy: train, the two ends with their times, the ticket facts, then the passengers. */
export function JourneyCard({ journey, className, compact }: { journey: Journey; className?: string; compact?: boolean }) {
  const train = trainMap[journey.trainNumber];
  const from = train?.stops[journey.boardingIndex];
  const to = train?.stops[journey.destinationIndex];
  const fromStation = getStation(journey.from);
  const toStation = getStation(journey.to);
  const duration = train && from && to ? (to.day - from.day) * 24 * 60 + toMin(to.arrival) - toMin(from.departure) : 0;

  return (
    <article className={cn("ticket-edge relative overflow-hidden rounded-3xl bg-cocoa-900 text-cream-50", className)} aria-label="Journey details">
      <div className={cn("relative grid gap-6 p-6 sm:p-7", !compact && "lg:grid-cols-[1fr_auto] lg:gap-8")}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="font-display text-2xl sm:text-3xl">
              {journey.trainNumber} {journey.trainName}
            </p>
            {journey.chartPrepared && (
              <span className="tag-dark">
                <span aria-hidden className="size-1.5 rounded-full bg-leaf-300" />
                Chart prepared
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div>
              <p className="whitespace-nowrap font-display text-[1.75rem] tabular-nums sm:text-[2.5rem]">{formatClock(from?.departure ?? null)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                <span className="tag-dark">{journey.from}</span>
                {fromStation?.name ?? journey.from}
              </p>
            </div>
            <div className="flex flex-col items-center px-1 pt-0.5 text-center text-xs font-medium text-cream-50/65 sm:px-2 sm:pt-1.5 sm:text-[13px]">
              <span>{duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : ""}</span>
              <span aria-hidden className="my-1.5 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-cream-50/60" />
                <span className="h-px w-8 bg-cream-50/30 sm:w-20" />
                <ArrowRight className="size-3.5 text-cream-50/60" />
              </span>
              <span>{train ? `${train.stops.length - 2} stops` : ""}</span>
            </div>
            <div className="text-right">
              <p className="whitespace-nowrap font-display text-[1.75rem] tabular-nums sm:text-[2.5rem]">{formatClock(to?.arrival ?? null)}</p>
              <p className="mt-2 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-sm font-semibold">
                {toStation?.name ?? journey.to}
                <span className="tag-dark">{journey.to}</span>
              </p>
              {to && from && to.day > from.day && <p className="mt-1 text-xs font-medium text-cream-50/65">+{to.day - from.day} day</p>}
            </div>
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-cream-50/10 pt-5">
            <Field label="PNR" value={journey.pnr ? `${journey.pnr.slice(0, 3)} ••• ${journey.pnr.slice(-3)}` : "Guest journey"} />
            <Field label="Date of journey" value={formatDate(journey.date)} />
            <Field label="Class" value={journey.travelClass} />
          </dl>
        </div>

        <div className={cn("flex flex-col gap-3 border-t border-dashed border-cream-50/20 pt-5", !compact && "lg:min-w-64 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0")}>
          <p className="text-sm font-semibold text-cream-50/65">Passengers</p>
          {journey.passengers.length === 0 ? (
            <p className="text-sm text-cream-50/70">No ticket details yet. Add your coach and berth at checkout.</p>
          ) : (
            journey.passengers.map((p) => (
              <div key={p.name + p.berth} className="panel-dark flex items-center gap-3 px-3 py-2.5">
                <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-50/10 text-cream-50/85">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-cream-50/65">
                    {p.age} · {p.gender} · {p.berthType}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold leading-tight tabular-nums">
                    {p.coach} / {p.berth}
                  </p>
                  <p className="mt-0.5 text-xs text-cream-50/65">
                    Coach / berth · <span className="font-bold text-leaf-300">{p.status}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}

/** Small sentence-case label over its value. */
function Field({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-xs text-cream-50/65">{label}</dt>
      <dd className="mt-0.5 text-base font-bold leading-tight">{value}</dd>
    </div>
  );
}

function toMin(hhmm: string | null) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
