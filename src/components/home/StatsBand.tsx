import { type ReactNode } from "react";
import { ChefHat, Clock, MapPin, Route } from "lucide-react";
import { PLANNED_STATIONS, REGIONS } from "@/data/stations";
import { MIN_LEAD_MINUTES } from "@/services";
import { Reveal } from "@/components/animations/Reveal";
import { CountUp } from "@/components/animations/AnimatedNumber";

/** Kitchens signed per station for the launch window, and how far one may sit from the platform (operating plan). */
const KITCHENS_PER_STATION = 2;
const VENDOR_RADIUS_KM = [2, 3] as const;

// Figures from the operating plan and the rules this build enforces — not live metrics. Each one reads
// from the data, so the strip follows the plan instead of repeating numbers typed into the markup.
const stats: { value: ReactNode; label: string; icon: typeof MapPin }[] = [
  { value: <CountUp value={PLANNED_STATIONS} />, label: "Stations planned", icon: MapPin },
  { value: <CountUp value={REGIONS.length} />, label: `Regions: ${REGIONS.map((r) => r.id.toLowerCase()).join(", ")}`, icon: Route },
  { value: <CountUp value={KITCHENS_PER_STATION} />, label: "Kitchens per station at launch", icon: ChefHat },
  { value: <CountUp prefix={`${VENDOR_RADIUS_KM[0]}–`} value={VENDOR_RADIUS_KM[1]} suffix=" km" />, label: `Kitchen to platform, ${MIN_LEAD_MINUTES} min before arrival`, icon: Clock },
];

/** Compact white strip directly under the hero: four plain figures that count up as the strip arrives. */
export function StatsBand() {
  return (
    <section aria-label="Service at a glance" className="border-b border-line bg-white py-6">
      {/* start "top 100%": the strip sits right at the hero fold, so it comes in as soon as its top edge shows. */}
      <Reveal className="container-x" y={14} start="top 100%">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4 md:gap-x-0 md:divide-x md:divide-line">
          {stats.map((s) => (
            <li key={s.label} className="flex items-center gap-3 md:justify-center md:px-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rail-50 text-rail-600" aria-hidden>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl text-cocoa-900 lg:text-[1.75rem]">{s.value}</p>
                <p className="mt-1 text-[13px] font-medium leading-tight text-muted">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
