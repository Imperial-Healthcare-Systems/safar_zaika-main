"use client";

import { ChefHat, MapPin, Route, Timer } from "lucide-react";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { Reveal } from "@/components/animations/Reveal";

// Figures from the operating plan, not live metrics.
const stats = [
  { value: "450", label: "Stations planned", icon: MapPin },
  { value: "2", label: "Kitchens live per station at launch", icon: ChefHat },
  { value: "2-3 KM", label: "From the platform", icon: Route },
  { value: "20-30", label: "Minutes to prepare", icon: Timer },
];

/** Compact white strip directly under the hero: four departure-board figures, each with its icon. */
export function StatsBand() {
  return (
    <section aria-label="Service at a glance" className="border-b border-line bg-white py-6">
      {/* start "top 100%": the strip sits right at the hero fold, so it comes in as soon as its top edge shows. */}
      <Reveal className="container-x" y={14} start="top 100%">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4 md:gap-x-0 md:divide-x md:divide-line">
          {stats.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3 md:justify-center md:px-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-rail-50 text-rail-600" aria-hidden>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <SplitFlap text={s.value} delay={i * 140} className="text-lg lg:text-xl" />
                <p className="mt-1 text-[13px] font-semibold leading-tight text-muted">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
