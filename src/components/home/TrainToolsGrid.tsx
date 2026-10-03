import Link from "next/link";
import { ArrowRight, CalendarClock, Headset, MapPin, PackageSearch, Radar, Store, Ticket, Users } from "lucide-react";
import { Button, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

/** Every tile is a working route: the first three are tools on /train-tools, the rest are existing pages. */
const tools = [
  { label: "PNR status", href: "/train-tools?tool=pnr-status", icon: Ticket },
  { label: "Train schedule", href: "/train-tools?tool=schedule", icon: CalendarClock },
  { label: "Live train status", href: "/train-tools?tool=live-status", icon: Radar },
  { label: "Stations", href: "/stations", icon: MapPin },
  { label: "Kitchens near stations", href: "/restaurants", icon: Store },
  { label: "Track my order", href: "/track-order", icon: PackageSearch },
  { label: "Group order", href: "/bulk-order", icon: Users },
  { label: "Help", href: "/help", icon: Headset },
];

export function TrainToolsGrid() {
  return (
    <section className="container-x pb-14 sm:pb-16" aria-labelledby="tools-title">
      <Reveal variant="slide-left">
        <SectionHeading
          title={<span id="tools-title">Train tools</span>}
          description="Check your PNR, timetable and live status before you order."
          action={
            <Button href="/train-tools" variant="outline" rightIcon={<ArrowRight className="size-4" />}>
              View all
            </Button>
          }
        />
      </Reveal>
      <Reveal variant="zoom" scale={0.7} ease="back.out(1.6)" stagger={0.05} selector="a" className="mt-8">
        <ul className="grid grid-cols-2 gap-1 rounded-3xl border border-line bg-cream-100 p-2 sm:gap-2 sm:p-4 md:grid-cols-4">
          {tools.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="group flex h-full flex-col items-center gap-3 rounded-2xl px-2 py-5 text-center transition-[translate,background-color] duration-300 ease-(--ease-out-quart) hover:-translate-y-1 hover:bg-white sm:py-6">
                <span className="flex size-14 items-center justify-center rounded-full bg-white text-rail-600 shadow-card transition-colors duration-300 group-hover:bg-rail-500 group-hover:text-white sm:size-16">
                  <t.icon className="size-6 sm:size-7" aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-tight text-cocoa-900 sm:text-[15px]">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
