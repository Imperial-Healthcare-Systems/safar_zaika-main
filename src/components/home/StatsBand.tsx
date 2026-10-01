"use client";

import { SplitFlap } from "@/components/animations/SplitFlap";
import { Reveal } from "@/components/animations/Reveal";

// Figures from the operating plan, not live metrics.
const stats = [
  { value: "450", label: "Stations planned" },
  { value: "2", label: "Kitchens live per station at launch" },
  { value: "2-3 KM", label: "From the platform" },
  { value: "20-30", label: "Minutes to prepare" },
];

/** Departure-board style figures; overlaps the hero like the old count-up band did. Cells pop in one by one while the flaps spin. */
export function StatsBand() {
  return (
    <div className="container-x relative z-10 -mt-10">
      {/* start "top 100%": the band peeks under the hero fold on load, so it pops in right away. */}
      <Reveal variant="zoom" scale={0.7} ease="back.out(1.8)" stagger={0.1} start="top 100%">
        <dl className="grid grid-cols-2 divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-lift md:grid-cols-4 md:divide-x">
          {stats.map((s, i) => (
            <div key={s.label} className="px-3 py-6 text-center md:px-2 md:py-7 lg:px-6">
              <dd className="flex justify-center">
                <SplitFlap text={s.value} delay={i * 140} className="text-[1.35rem] sm:text-3xl md:text-2xl lg:text-3xl xl:text-4xl" />
              </dd>
              <dt className="mt-2 text-[13px] font-semibold text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </div>
  );
}
