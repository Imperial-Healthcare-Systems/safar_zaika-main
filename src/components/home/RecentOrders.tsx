"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { dishMap } from "@/data/menu";
import { stationMap } from "@/data/stations";
import { formatClock, prefersReducedMotion } from "@/lib/utils";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

/** SAMPLE entries only: coach, quantity, a dish and a station from the demo catalogue, and a hand-over time. No people. */
const SAMPLE: [coach: string, qty: number, dishId: string, stationCode: string, time: string][] = [
  ["B4", 2, "d-deluxe-thali", "BRC", "21:08"],
  ["S7", 1, "d-chicken-biryani", "NDLS", "13:20"],
  ["A1", 3, "d-masala-chai", "JP", "07:45"],
  ["B2", 1, "d-jain-thali", "PUNE", "12:35"],
  ["S3", 2, "d-masala-dosa", "SBC", "08:10"],
  ["H1", 1, "d-butter-chicken", "LKO", "20:25"],
  ["B6", 4, "d-veg-thali", "ADI", "13:05"],
  ["S9", 2, "d-pav-bhaji", "MMCT", "17:40"],
  ["A2", 1, "d-fish-curry", "HWH", "14:15"],
  ["S5", 2, "d-idli-vada", "MAS", "07:20"],
];

const entries = SAMPLE.flatMap(([coach, qty, dishId, code, time]) => {
  const dish = dishMap[dishId];
  const station = stationMap[code];
  // "Masala Chai (Flask, 2 cups)" -> "Masala Chai"
  return dish && station ? [{ coach, qty, dish: dish.name.replace(/\s*\(.*\)$/, ""), station: station.name, time: formatClock(time) }] : [];
});

/**
 * A vertical ticker of sample activity. The list is rendered twice and the track slides up by half
 * its height on a loop; hover pauses it, it only runs in view, and with reduced motion it is a plain list.
 */
export function RecentOrders() {
  const box = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = box.current;
      const track = el?.querySelector("ul");
      if (!el || !track || prefersReducedMotion()) return;
      const tween = gsap.to(track, { yPercent: -50, duration: 32, ease: "none", repeat: -1, scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" } });
      const pause = () => tween.pause();
      const resume = () => tween.resume();
      el.addEventListener("mouseenter", pause);
      el.addEventListener("mouseleave", resume);
      return () => {
        el.removeEventListener("mouseenter", pause);
        el.removeEventListener("mouseleave", resume);
      };
    },
    { scope: box },
  );

  return (
    <section className="bg-cream-100 py-14 sm:py-16" aria-labelledby="recent-title">
      <div className="container-x grid items-center gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
        <Reveal>
          <SectionHeading title={<span id="recent-title">Orders on the move</span>} description="Demo data shown until live orders start." />
          <span className="tag mt-4 bg-white">Sample activity</span>
        </Reveal>
        <Reveal variant="tilt">
          <div ref={box} className="h-[300px] overflow-hidden rounded-3xl border border-line bg-white px-4 shadow-card motion-reduce:h-auto sm:px-6">
            <div className="h-full [mask-image:linear-gradient(transparent,#000_14%,#000_86%,transparent)] motion-reduce:[mask-image:none]">
              <ul>
                {[...entries, ...entries].map((e, i) => {
                  const copy = i >= entries.length;
                  return (
                    <li key={i} aria-hidden={copy || undefined} className={`flex items-center gap-3 border-b border-line py-3.5 sm:gap-4 ${copy ? "motion-reduce:hidden" : ""}`}>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rail-50 text-sm font-bold text-rail-700">{e.coach}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-cocoa-900">
                          {e.qty} × {e.dish}
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {e.station} · {e.time}
                        </span>
                      </span>
                      <span className="tag max-sm:hidden">Sample</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
