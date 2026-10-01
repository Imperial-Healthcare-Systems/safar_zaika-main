"use client";

import { ArrowRight, BadgeCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui";
import { getStation } from "@/data/stations";
import { trainMap } from "@/data/trains";
import { cn, formatClock, formatDate } from "@/lib/utils";
import type { Journey } from "@/types";

/** Ticket-style journey summary: cocoa stock, notched edges, condensed figures like a printed ticket. */
export function JourneyCard({ journey, className, compact }: { journey: Journey; className?: string; compact?: boolean }) {
  const train = trainMap[journey.trainNumber];
  const from = train?.stops[journey.boardingIndex];
  const to = train?.stops[journey.destinationIndex];
  const fromStation = getStation(journey.from);
  const toStation = getStation(journey.to);
  const duration = train && from && to ? (to.day - from.day) * 24 * 60 + toMin(to.arrival) - toMin(from.departure) : 0;

  return (
    <article className={cn("ticket-edge relative overflow-hidden rounded-3xl bg-cocoa-900 text-cream-50", className)} aria-label="Journey details">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-40" />
      <div className={cn("relative grid gap-6 p-6 sm:p-7", !compact && "lg:grid-cols-[1fr_auto]")}>
        <div>
          <div className="flex flex-wrap items-end gap-x-7 gap-y-3 font-condensed">
            <Field value={journey.pnr ? `${journey.pnr.slice(0, 3)} ••• ${journey.pnr.slice(-3)}` : "Guest journey"} label="PNR" />
            <Field value={formatDate(journey.date)} label="Date of journey" />
            <Field value={journey.travelClass} label="Class" />
            {journey.chartPrepared && (
              <Badge tone="glass" className="mb-0.5">
                <BadgeCheck className="size-3" /> Chart prepared
              </Badge>
            )}
          </div>
          <p className="mt-5 font-condensed text-3xl font-bold sm:text-4xl">
            <span className="text-gold-400">{journey.trainNumber}</span> {journey.trainName}
          </p>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div>
              <p className="whitespace-nowrap font-condensed text-[1.75rem] font-bold tabular-nums sm:text-5xl">{formatClock(from?.departure ?? null)}</p>
              <p className="mt-2">
                <span className="signboard text-[10px]">{journey.from}</span>
              </p>
              <p className="mt-1.5 text-sm font-semibold">{fromStation?.name ?? journey.from}</p>
            </div>
            <div className="flex flex-col items-center px-1 text-center font-condensed text-sm font-semibold text-cream-50/60 sm:px-2">
              <span>{duration ? `${Math.floor(duration / 60)}h ${duration % 60}m` : ""}</span>
              <span className="my-1 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-gold-400" />
                <span className="h-px w-10 bg-gradient-to-r from-gold-400 to-cream-50/30 sm:w-20" />
                <ArrowRight className="size-3.5 text-cream-50/60" />
              </span>
              <span>{train ? `${train.stops.length - 2} stops` : ""}</span>
            </div>
            <div className="text-right">
              <p className="whitespace-nowrap font-condensed text-[1.75rem] font-bold tabular-nums sm:text-5xl">{formatClock(to?.arrival ?? null)}</p>
              <p className="mt-2">
                <span className="signboard text-[10px]">{journey.to}</span>
                {to && from && to.day > from.day && <span className="ml-2 font-condensed text-sm font-semibold text-cream-50/60">+{to.day - from.day} day</span>}
              </p>
              <p className="mt-1.5 text-sm font-semibold">{toStation?.name ?? journey.to}</p>
            </div>
          </div>
        </div>

        <div className={cn("flex flex-col gap-3 border-t border-dashed border-cream-50/20 pt-5", !compact && "lg:min-w-56 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0")}>
          <p className="text-sm font-semibold text-cream-50/60">Passengers</p>
          {journey.passengers.length === 0 ? (
            <p className="text-sm text-cream-50/70">No ticket details yet. Add your coach and berth at checkout.</p>
          ) : (
            journey.passengers.map((p) => (
              <div key={p.name + p.berth} className="flex items-center gap-3 rounded-xl bg-cream-50/6 px-3 py-2">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-copper-500 text-cream-50">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-cream-50/60">
                    {p.age} · {p.gender} · {p.berthType}
                  </p>
                </div>
                <div className="text-right font-condensed">
                  <p className="text-2xl font-bold leading-none text-gold-300">
                    {p.coach}
                    <span className="text-cream-50/40">/</span>
                    {p.berth}
                  </p>
                  <p className="mt-1 text-xs text-cream-50/55">
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

/** Value on top, tiny sentence-case label under it, like the printed fields on a ticket. */
function Field({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-cream-50/55">{label}</p>
    </div>
  );
}

function toMin(hhmm: string | null) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
