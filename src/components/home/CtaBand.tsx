"use client";

import { Reveal } from "@/components/animations/Reveal";
import { PnrModule } from "@/components/pnr/PnrModule";

export function CtaBand() {
  return (
    <section className="container-x py-14 sm:py-16" aria-labelledby="cta-title">
      <Reveal variant="zoom" scale={0.92}>
        {/* Navy band: the orange stays on the CTA button inside the module, never on a full-bleed fill. */}
        <div className="relative overflow-hidden rounded-[2.5rem] gradient-cocoa p-8 text-cream-50 sm:p-12 lg:p-16">
          <div aria-hidden className="absolute inset-0 map-grid-dark opacity-50" />
          <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-copper-500/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-cocoa-600/35 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 id="cta-title" className="text-balance font-display text-[1.875rem] leading-[1.08] sm:text-[2.25rem] lg:text-[2.75rem]">
                Enter your PNR. Eat at your seat.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/85">
                Every kitchen on your route in seconds. Try it with the demo PNR if you&apos;re just looking around.
              </p>
            </div>
            <Reveal y={56} delay={0.25}>
              <PnrModule bare className="text-cocoa-900" />
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
