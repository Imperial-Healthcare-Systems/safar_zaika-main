"use client";

import { useRef } from "react";
import { BadgeCheck, ChefHat, Headset, Radar, ShieldCheck, TrainFront } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { SectionHeading } from "@/components/ui";
import { Reveal, useReveal } from "@/components/animations/Reveal";

const items = [
  { icon: BadgeCheck, t: "Verified food partners", d: "Every kitchen is audited for hygiene, packaging and punctuality before it goes live." },
  { icon: ChefHat, t: "Fresh preparation", d: "Cooking starts against your train's ETA, not when you tap order." },
  { icon: ShieldCheck, t: "Secure payment", d: "UPI, cards and net banking through a PCI-compliant gateway. Or pay cash at your seat." },
  { icon: TrainFront, t: "Journey-aware delivery", d: "We read halt times, platform changes and coach positions so hand-over is calm, not frantic." },
  { icon: Radar, t: "Live train coordination", d: "Running late? Your kitchen and partner get the new time automatically." },
  { icon: Headset, t: "Human support", d: "A real person on call from the moment you order until you've eaten." },
];

/** Same two shadows as the `led` utility, written so GSAP can tween between them. */
const LED_DIM = "0px 0px 6px rgba(255,160,40,0.85), 0px 0px 16px rgba(255,120,20,0.45)";
const LED_BRIGHT = "0px 0px 22px rgba(255,205,120,1), 0px 0px 46px rgba(255,140,30,0.95)";
const CELL_STEP = 0.13;

/** Six promises on a coach-indicator board: dark strip, LED cells, no white card grid. */
export function TrustSection() {
  const board = useRef<HTMLOListElement>(null);

  // Cells power on one after another with a flicker; their LED text flares bright and settles.
  useReveal(board, (el) => {
    const cells = Array.from(el.children);
    const leds = Array.from(el.querySelectorAll(".led"));
    gsap.set(cells, { autoAlpha: 0 });
    return () =>
      gsap
        .timeline()
        .to(cells, {
          keyframes: [
            { autoAlpha: 0.85, duration: 0.06 },
            { autoAlpha: 0.2, duration: 0.08 },
            { autoAlpha: 1, duration: 0.45, ease: "power1.out", clearProps: "opacity,visibility" },
          ],
          stagger: CELL_STEP,
        })
        .fromTo(
          leds,
          { textShadow: LED_BRIGHT },
          { textShadow: LED_DIM, duration: 1.1, ease: "power2.out", stagger: (_, t: Element) => cells.indexOf(t.closest("li") as Element) * CELL_STEP, clearProps: "textShadow" },
          0.1,
        );
  });

  return (
    <section className="container-x py-20 sm:py-24" aria-labelledby="trust-title">
      <Reveal>
        <SectionHeading align="center" title={<span id="trust-title">Built for a moving train.</span>} description="Kitchens, timing, payment and support, all planned around the halt instead of a doorstep." />
      </Reveal>
      <ol ref={board} className="mt-12 grid gap-3 rounded-[2rem] bg-cocoa-900 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((it, i) => (
          <li key={it.t} className="led-panel relative rounded-2xl p-5 text-cream-50">
            <span aria-hidden className="led absolute right-4 top-4 text-[11px]">
              0{i + 1}
            </span>
            <it.icon className="size-6 text-gold-400" aria-hidden />
            <h3 className="led mt-5 text-lg leading-tight">{it.t}</h3>
            <p className="mt-2 text-[13px] leading-snug text-cream-50/65">{it.d}</p>
          </li>
        ))}
      </ol>
      <Reveal delay={0.4}>
        <p className="mt-4 text-center text-sm text-muted">Authorisation and partner badges will appear here once formal approvals are in place.</p>
      </Reveal>
    </section>
  );
}
