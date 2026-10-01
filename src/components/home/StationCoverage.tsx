"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { demoJourneys } from "@/data/journeys";
import { stations } from "@/data/stations";
import { computeEligibleStations } from "@/services";
import { useHydrated } from "@/hooks/useHydrated";
import { useJourneyStore } from "@/stores";
import { gsap } from "@/lib/gsap";
import { cn, formatClock } from "@/lib/utils";
import { Button, SectionHeading } from "@/components/ui";
import { Reveal, useReveal } from "@/components/animations/Reveal";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { JourneyMap } from "@/components/journey/JourneyMap";
import type { EligibleStation } from "@/types";

const sampleJourney = demoJourneys["1234567890"];
const sampleStops = computeEligibleStations(sampleJourney);
const popular = stations.filter((s) => s.popular);

const stateLabel: Record<EligibleStation["availability"], string> = {
  available: "",
  "too-soon": "Too soon to deliver",
  "no-food": "No kitchens yet",
  passed: "Boarding",
  destination: "Destination",
};

/**
 * "Food stops on your route": the journey entered in this session (store,
 * hydration-guarded) on the night map, with its halts listed beside it and the
 * selected halt shared with /journey. Without a journey it shows a sample route
 * and says so.
 */
export function StationCoverage() {
  const hydrated = useHydrated();
  const journey = useJourneyStore((s) => s.journey);
  const eligible = useJourneyStore((s) => s.eligible);
  const selectedCode = useJourneyStore((s) => s.selectedStationCode);
  const selectStation = useJourneyStore((s) => s.selectStation);
  const [sampleCode, setSampleCode] = useState<string | null>("BRC");
  const live = hydrated && journey ? journey : null;
  const stops = live ? eligible : sampleStops;
  const selected = live ? selectedCode : sampleCode;
  const onSelect = live ? selectStation : setSampleCode;
  const halt = stops.find((e) => e.station.code === selected);
  const halts = stops.filter((e) => e.availability !== "passed");
  const available = halts.filter((e) => e.availability === "available").length;
  const askable = halts.filter((e) => e.availability !== "destination").length;
  const mapBox = useRef<HTMLDivElement>(null);

  // The map scales up from 0.94 while a dark veil over it lifts (the veil is opacity-0 by default, so reduced motion never sees it).
  useReveal(mapBox, (el) => {
    const veil = el.querySelector("[data-veil]");
    gsap.set(el, { autoAlpha: 0, scale: 0.94 });
    gsap.set(veil, { opacity: 1 });
    return () =>
      gsap
        .timeline()
        .to(el, { autoAlpha: 1, scale: 1, duration: 1.1, ease: "expo.out", clearProps: "opacity,visibility,transform" })
        .to(veil, { opacity: 0, duration: 1.4, ease: "power2.inOut", clearProps: "opacity" }, 0.15);
  });

  return (
    <section className="py-20 sm:py-24" aria-labelledby="stations-title">
      <div className="container-x">
        <Reveal variant="clip-up">
          <SectionHeading
            title={<span id="stations-title">{live ? "Food stops on your route." : "Food stops along the route."}</span>}
            description={live ? `${live.trainNumber} ${live.trainName}: ${available} of ${askable} halts can take an order.` : "A sample route: tap a halt and the train rides there. Enter your PNR to see yours."}
            action={
              <Button href={live ? "/journey" : "/stations"} variant="outline" rightIcon={<ArrowRight className="size-4" />}>
                {live ? "Open my route" : "All stations"}
              </Button>
            }
          />
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div ref={mapBox} className="relative">
            <JourneyMap stops={stops} boardingIndex={(live ?? sampleJourney).boardingIndex} selectedCode={selected} onSelect={onSelect} className="aspect-[4/3] lg:aspect-auto lg:h-full" />
            <div aria-hidden data-veil className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(80%_80%_at_50%_50%,rgba(22,10,3,0.55),rgba(22,10,3,0.98))] opacity-0" />
          </div>
          <Reveal variant="clip-right" delay={0.2}>
            <div className="flex h-full flex-col rounded-3xl bg-cocoa-900 p-5 text-cream-50 sm:p-6">
              {/* Departure-board readout of the halt picked on the map */}
              <div className="led-panel rounded-2xl px-4 py-3">
                <SplitFlap text={halt?.station.name ?? "Pick a halt"} length={14} trigger="mount" className="text-xl sm:text-2xl" />
                <p className="led mt-2 text-[11px]">
                  {halt ? `${halt.station.code} · arrives ${formatClock(halt.stop.arrival)} · ${halt.restaurantCount} kitchens` : "Tap a station on the map"}
                </p>
              </div>

              {live ? (
                <>
                  <h3 className="mt-6 font-display text-xl">Halts on your route</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {halts.map((e) => {
                      const ok = e.availability === "available";
                      const on = e.station.code === selected;
                      const cls = cn(
                        "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-sm transition-colors",
                        on ? "border-gold-400 bg-cream-50/10" : "border-cream-50/10 bg-cream-50/5",
                        ok ? "hover:border-gold-400/50 hover:bg-cream-50/10" : "opacity-60",
                      );
                      const inner = (
                        <>
                          <span className="signboard shrink-0 text-[10px]">{e.station.code}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{e.station.name}</span>
                            <span className={cn("block text-[11px]", ok ? "text-gold-300" : "text-cream-50/60")}>
                              {formatClock(e.stop.arrival)} · {ok ? `${e.restaurantCount} kitchens` : stateLabel[e.availability]}
                            </span>
                          </span>
                        </>
                      );
                      return (
                        <li key={e.station.code}>
                          {ok ? (
                            <button type="button" aria-pressed={on} onClick={() => onSelect(e.station.code)} className={cls}>
                              {inner}
                            </button>
                          ) : (
                            <div className={cls}>{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto pt-6">
                    {halt?.availability === "available" ? (
                      <Button href={`/restaurants?station=${halt.station.code}`} full rightIcon={<ArrowRight className="size-4" />}>
                        See kitchens at {halt.station.code}
                      </Button>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-cream-50/60">Pick a halt to see the kitchens that can meet your train there. Kitchens need at least 45 minutes before arrival.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mt-6 font-display text-xl">Popular stations</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {popular.map((s) => (
                      <li key={s.code}>
                        <Link
                          href={`/restaurants?station=${s.code}`}
                          className="flex items-center gap-2.5 rounded-xl border border-cream-50/10 bg-cream-50/5 px-2.5 py-2 text-sm transition-colors hover:border-gold-400/50 hover:bg-cream-50/10"
                        >
                          <span className="signboard shrink-0 text-[10px]">{s.code}</span>
                          <span className="truncate font-semibold">{s.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-6 text-[13px] leading-relaxed text-cream-50/60">
                    Don&apos;t see your station? Enter your PNR — we check every halt on your route and tell you exactly where delivery is possible.
                  </p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
