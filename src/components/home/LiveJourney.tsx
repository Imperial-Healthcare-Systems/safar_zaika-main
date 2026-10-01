"use client";

import { ArrowRight, BellRing, Radar, Timer } from "lucide-react";
import { Button, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";
import { JourneyStatus } from "@/components/journey/JourneyStatus";

const demoSteps = [
  { headline: "Your food is being prepared", sub: "Sayaji Thali Ghar started cooking at 8:22 PM, timed to your 9:08 PM arrival.", progress: 0.1 },
  { headline: "Your train is approaching Vadodara", sub: "12951 is running on time. Delivery partner Ravi is leaving the kitchen.", progress: 0.42 },
  { headline: "Your partner is at Vadodara Jn, platform 1", sub: "Coach B4 stops near the footbridge — he's waiting right there.", progress: 0.78 },
  { headline: "Delivered to B4 / 23. Enjoy!", sub: "Handed over at 9:10 PM. Rate your meal when you're done.", progress: 1, tone: "success" as const },
];

export function LiveJourney() {
  return (
    <section className="relative overflow-hidden gradient-cocoa py-20 text-cream-50 sm:py-24" aria-labelledby="live-title">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-50" />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal variant="slide-left">
          <SectionHeading
            dark
            title={<span id="live-title">Dinner that meets your train.</span>}
            description="We watch the train's live position and the kitchen's timer together, so the hand-over happens in the halt. Not before, not after."
          />
          <ul className="mt-8 space-y-4">
            {[
              { icon: Radar, t: "Live train coordination", d: "Delays reroute prep time automatically." },
              { icon: Timer, t: "Just-in-time cooking", d: "Kitchens start when your ETA says so." },
              { icon: BellRing, t: "Platform-level updates", d: "Which platform, which coach door, which minute." },
            ].map((f) => (
              <li key={f.t} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream-50/8 text-gold-400">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{f.t}</p>
                  <p className="text-sm text-cream-50/60">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button href="/track-order/SZ102948" variant="light" size="lg" className="mt-8" rightIcon={<ArrowRight className="size-4" />}>
            See a live order
          </Button>
        </Reveal>
        <Reveal variant="flip" delay={0.15}>
          <JourneyStatus
            dark
            autoCycleMs={3800}
            steps={demoSteps}
            stations={[{ label: "Surat", sub: "7:43 PM" }, { label: "Kitchen", sub: "Cooking" }, { label: "Platform 1", sub: "Partner" }, { label: "Vadodara", sub: "9:08 PM" }]}
          />
        </Reveal>
      </div>
    </section>
  );
}
