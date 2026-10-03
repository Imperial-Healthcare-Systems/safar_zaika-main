"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MEALS, dishesForMeal, isWithinWindows, type MealId } from "@/services";
import { selectSelectedStation, useDeliveryMoment, useJourneyStore } from "@/stores";
import { useHydrated } from "@/hooks/useHydrated";
import { cn, formatClock } from "@/lib/utils";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui";
import type { Dish, TimeWindow } from "@/types";

/** Three dishes per meal, bestsellers first. */
const PICKS = Object.fromEntries(
  MEALS.map((m) => [m.id, [...dishesForMeal(m.id)].sort((a, b) => Number(Boolean(b.bestseller)) - Number(Boolean(a.bestseller))).slice(0, 3)]),
) as Record<MealId, Dish[]>;

/** Desktop column widths: the expanded meal gets 1.6fr. Full class strings so Tailwind generates them. */
const COLS: Record<MealId, string> = {
  breakfast: "lg:grid-cols-[1.6fr_1fr_1fr_1fr]",
  lunch: "lg:grid-cols-[1fr_1.6fr_1fr_1fr]",
  dinner: "lg:grid-cols-[1fr_1fr_1.6fr_1fr]",
  snacks: "lg:grid-cols-[1fr_1fr_1fr_1.6fr]",
};

/** "06:00".."11:00" -> "6-11 AM"; "11:30".."15:30" -> "11:30 AM-3:30 PM"; all day -> "All day". */
function windowLabel(w: TimeWindow) {
  if (w.from === "00:00" && w.to === "23:59") return "All day";
  const short = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return m ? `${h % 12 || 12}:${String(m).padStart(2, "0")}` : String(h % 12 || 12);
  };
  const ampm = (hhmm: string) => (Number(hhmm.slice(0, 2)) >= 12 ? "PM" : "AM");
  return ampm(w.from) === ampm(w.to) ? `${short(w.from)}-${short(w.to)} ${ampm(w.to)}` : `${short(w.from)} ${ampm(w.from)}-${short(w.to)} ${ampm(w.to)}`;
}

/**
 * Four image-led meal panels. The one covering the delivery moment (arrival at
 * the chosen halt, else the clock) is tagged and widened; hovering or focusing
 * another panel widens that one instead. Mobile: a snap-scroll row, active first.
 */
export function MealTimes() {
  const moment = useDeliveryMoment();
  const hydrated = useHydrated();
  const journeyStation = useJourneyStore(selectSelectedStation);
  const stationCode = hydrated ? journeyStation?.station.code : undefined;
  const [hover, setHover] = useState<MealId | null>(null);
  const row = useRef<HTMLDivElement>(null);

  // Timed meals come first in MEALS, so a halt inside one wins over the all-day snacks panel.
  const activeId = moment ? (MEALS.find((m) => isWithinWindows(moment.hhmm, [m.window]))?.id ?? "snacks") : null;
  const expanded = hover ?? activeId;
  const tag = moment?.source === "arrival" ? `At your ${formatClock(moment.hhmm)} arrival` : "Serving now";

  // The active panel moves to the front once the clock is known; Chrome re-snaps the row to keep
  // the originally-first panel in view, so bring the row back to its start.
  useEffect(() => {
    row.current?.scrollTo({ left: 0 });
  }, [activeId]);

  return (
    <section className="overflow-hidden bg-cocoa-950 py-14 text-cream-50 sm:py-16" aria-labelledby="meals-title">
      <div className="container-x">
        <Reveal variant="slide-right">
          <SectionHeading dark title={<span id="meals-title">Breakfast, lunch or dinner, timed to your halt.</span>} description="Every window matches a halt on your route. We only show kitchens that can cook for it." />
        </Reveal>
        <Reveal variant="clip-up" stagger={0.08} selector="article" className="mt-8">
          <div
            ref={row}
            className={cn(
              "no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scroll-pl-4 sm:-mx-6 sm:px-6 sm:scroll-pl-6",
              "lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 lg:transition-[grid-template-columns] lg:duration-500 lg:ease-(--ease-out-quart)",
              expanded ? COLS[expanded] : "lg:grid-cols-4",
            )}
            data-lenis-prevent-horizontal
          >
            {MEALS.map((m) => {
              const active = m.id === activeId;
              const open = m.id === expanded;
              return (
                <article
                  key={m.id}
                  onMouseEnter={() => setHover(m.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(m.id)}
                  onBlur={() => setHover(null)}
                  className={cn(
                    "group relative flex h-[380px] w-[76vw] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-3xl bg-cocoa-900 sm:w-[46vw] lg:h-[420px] lg:w-auto",
                    active && "max-lg:order-first",
                  )}
                >
                  <Image src={m.image} alt="" fill sizes="(max-width: 1024px) 76vw, 40vw" className={cn("object-cover transition-transform duration-700 ease-(--ease-out-quart)", open ? "scale-100" : "scale-105")} />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-cocoa-950 via-cocoa-950/55 to-cocoa-950/10" />
                  <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 lg:left-5 lg:top-5">
                    <span className="signboard">{windowLabel(m.window)}</span>
                    {active && <span className="led-panel led rounded-md px-2 py-1 text-[10px]">{tag}</span>}
                  </div>
                  <div className="relative p-4 lg:p-5">
                    <h3 className="font-display text-3xl text-cream-50 lg:text-4xl">{m.label}</h3>
                    <div className={cn("overflow-hidden transition-[max-height,opacity] duration-500 ease-(--ease-out-quart)", open ? "lg:max-h-72 lg:opacity-100" : "lg:max-h-0 lg:opacity-0")}>
                      <p className="mt-1.5 text-sm text-cream-50/70">{m.blurb}</p>
                      <ul className="mt-4 flex flex-col gap-2">
                        {PICKS[m.id].map((d) => (
                          <li key={d.id} className="flex items-center gap-2.5 text-[13px] font-semibold text-cream-50/90">
                            <span className="relative size-8 shrink-0 overflow-hidden rounded-full border border-cream-50/20">
                              <Image src={d.image} alt="" fill sizes="32px" className="object-cover" />
                            </span>
                            <span className="truncate">{d.name}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={`/restaurants?meal=${m.id}${stationCode ? `&station=${stationCode}` : ""}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold-400 transition-colors hover:text-gold-300">
                        See {m.label.toLowerCase()} kitchens <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
