"use client";

import { ArrowRight, BellRing, Radar, Timer } from "lucide-react";
import { Button, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";
import { JourneyStatus } from "@/components/journey/JourneyStatus";

// A generic sample order: no train, halt or person is named, so it never reads as the visitor's own journey.
const demoSteps = [
  { headline: "Food is being prepared", sub: "Cooking starts so the order is ready just before the train arrives.", progress: 0.1 },
  { headline: "Train approaching the halt", sub: "Running on time. The delivery partner is leaving the kitchen.", progress: 0.42 },
  { headline: "Partner waiting on the platform", sub: "Standing where the coach stops, order in hand.", progress: 0.78 },
  { headline: "Delivered at the seat", sub: "Handed over during the halt.", progress: 1, tone: "success" as const },
];
const demoStations = [{ label: "Ordered" }, { label: "Kitchen", sub: "Cooking" }, { label: "Platform", sub: "Partner" }, { label: "Seat", sub: "Hand-over" }];

const features = [
  { icon: Radar, t: "Live train coordination", d: "Delays move the prep time with them." },
  { icon: Timer, t: "Just-in-time cooking", d: "Kitchens start when your arrival time says so." },
  { icon: BellRing, t: "Platform-level updates", d: "Which platform, which coach, which minute." },
];

export function LiveJourney() {
  return (
    <section className="relative overflow-hidden gradient-cocoa py-14 text-cream-50 sm:py-16" aria-labelledby="live-title">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-50" />
      <div className="container-x relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal variant="slide-left">
          <SectionHeading dark title={<span id="live-title">Dinner that meets your train.</span>} description="We watch the train and the kitchen together, so the hand-over happens during the halt." />
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f.t} className="flex items-center gap-3.5">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-cream-50/8 text-gold-400">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <p className="text-sm text-cream-50/65">
                  <span className="block text-[15px] font-semibold text-cream-50">{f.t}</span>
                  {f.d}
                </p>
              </li>
            ))}
          </ul>
          <Button href="/track-order/SZ102948" variant="light" size="lg" className="mt-7" rightIcon={<ArrowRight className="size-4" />}>
            Open the demo order
          </Button>
        </Reveal>
        <Reveal variant="flip" delay={0.15}>
          <span className="signboard mb-3">Sample order</span>
          <JourneyStatus dark autoCycleMs={3800} steps={demoSteps} stations={demoStations} />
        </Reveal>
      </div>
    </section>
  );
}
