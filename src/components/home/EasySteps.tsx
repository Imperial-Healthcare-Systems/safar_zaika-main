"use client";

import Link from "next/link";
import { useRef } from "react";
import { Armchair, ArrowRight, CreditCard, Ticket, Utensils } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { SectionHeading } from "@/components/ui";
import { Reveal, useReveal } from "@/components/animations/Reveal";
import { TrainIcon } from "@/components/animations/TrainIcon";

const steps = [
  { icon: Ticket, title: "Enter PNR or train number", desc: "We find your train and its upcoming halts." },
  { icon: Utensils, title: "Choose a kitchen and your food", desc: "Menus from kitchens near the station." },
  { icon: CreditCard, title: "Pay online or cash on delivery", desc: "UPI, card, net banking or cash at your seat." },
  { icon: Armchair, title: "Delivered at your seat", desc: "Handed over while the train halts." },
];

/**
 * The whole order in one row: four stations on a dashed track. On desktop a small train crosses the
 * track once when the section enters and parks past the last station (its CSS resting place, so
 * reduced motion simply shows it parked).
 */
export function EasySteps() {
  const track = useRef<HTMLDivElement>(null);

  useReveal(track, (el) => {
    const train = el.querySelector<HTMLElement>("[data-train]");
    if (!train) return;
    gsap.set(train, { autoAlpha: 0 });
    return () =>
      gsap
        .timeline({ delay: 0.3 })
        .set(train, { x: train.offsetWidth - el.offsetWidth })
        .to(train, { autoAlpha: 1, duration: 0.3 })
        .to(train, { x: 0, duration: 2.6, ease: "power2.inOut", clearProps: "transform,opacity,visibility" }, 0);
  });

  return (
    <section className="py-14 sm:py-16" aria-labelledby="steps-title">
      <div className="container-x">
        <Reveal>
          <SectionHeading align="center" title={<span id="steps-title">Order in four easy steps</span>} />
        </Reveal>
        <div className="relative mt-10">
          {/* Track through the centre of the icon tiles (72px tall on lg); the tiles sit on top of it like stations. */}
          <div ref={track} aria-hidden className="absolute inset-x-0 top-9 hidden lg:block">
            <div className="border-t-2 border-dashed border-rail-300 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]" />
            <span data-train className="absolute bottom-full right-0 flex text-cocoa-800">
              <TrainIcon className="h-3.5 xl:h-[18px]" />
            </span>
          </div>
          <Reveal stagger={0.12} selector="li">
            <ol className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
              {steps.map((s, i) => (
                <li key={s.title} className="flex flex-col items-center text-center">
                  <span className="relative flex size-16 items-center justify-center rounded-full bg-rail-50 text-rail-600 ring-4 ring-cream-50 lg:size-[72px]">
                    <s.icon className="size-7" aria-hidden />
                    <span aria-hidden className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-cocoa-900 text-xs font-bold text-cream-50">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 text-balance text-lg leading-tight text-cocoa-900 sm:text-xl">{s.title}</h3>
                  <p className="mt-1.5 max-w-[15rem] text-pretty text-[13px] leading-snug text-muted sm:text-sm">{s.desc}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <p className="mt-8 text-center">
          <Link href="/how-it-works" className="inline-flex items-center gap-1.5 text-sm font-bold text-rail-600 transition-colors hover:text-rail-700">
            See how it works <ArrowRight className="size-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
}
