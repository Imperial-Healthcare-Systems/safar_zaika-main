"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { RouteLine } from "@/components/animations/RouteLine";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui";

const chip = "absolute bottom-4 right-4 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-cocoa-900 shadow-card";

/** Small white chips laid over the step photos: a sample PNR, a route with the chosen halt lit, the payment options. */
const overlays = {
  pnr: (
    <span className={chip}>
      <span className="font-medium text-muted">PNR</span> 123 ... 890
    </span>
  ),
  route: (
    <span className={cn(chip, "flex items-center gap-2.5")}>
      <svg width="64" height="16" viewBox="0 0 64 16" aria-hidden className="block">
        <line x1="8" y1="8" x2="56" y2="8" className="stroke-cream-300" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="8" r="3.5" className="fill-cream-400" />
        <circle cx="32" cy="8" r="7" className="fill-copper-500/25" />
        <circle cx="32" cy="8" r="4" className="fill-copper-500" />
        <circle cx="56" cy="8" r="3.5" className="fill-cream-400" />
      </svg>
      BRC, 9:08 PM
    </span>
  ),
  pay: <span className={chip}>Prepaid or cash on delivery</span>,
};

const steps: { title: string; desc: string; image: string; overlay?: keyof typeof overlays }[] = [
  { title: "Enter PNR", desc: "We read your train, date, coach and berth from the ticket — no typing station names.", image: "/images/stations/new-delhi.jpg", overlay: "pnr" },
  { title: "Choose a station", desc: "See every upcoming halt with arrival time, halt duration and which kitchens are ready there.", image: "/images/stations/mumbai.jpg", overlay: "route" },
  { title: "Pick your food", desc: "Thalis, biryanis, Jain meals, chai flasks. Real menus from verified local kitchens.", image: "/images/food/thali-overhead.jpg" },
  { title: "Pay your way", desc: "UPI, card, net banking, or cash at your seat. Prices shown are exactly what you pay.", image: "/images/scenes/restaurant-serving.jpg", overlay: "pay" },
  { title: "Enjoy at your seat", desc: "Our partner tracks your train live and hands over a sealed, hot meal at your berth.", image: "/images/scenes/friends-eating.jpg" },
];

const stations = steps.map((s) => ({ label: s.title }));

/**
 * Desktop: section pins and the five steps scroll horizontally while the
 * train hops station to station; the active card sits centred in the
 * viewport with its neighbours peeking in. Mobile: vertical cards + autoplay route.
 */
export function HowItWorks({ standalone }: { standalone?: boolean }) {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);
  // Only the route line for this breakpoint is mounted: a display:none autoplay RouteLine would still animate every frame.
  const lg = useMediaQuery("(min-width: 1024px)", true);
  const current = steps[step] ?? steps[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current;
        const w = wrap.current;
        if (!t || !w) return;
        setPinned(true);
        // Track x that puts card i's centre on the viewport centre. Cards share one width and gap,
        // so this needs no offsets and is right whether or not the track is still padded.
        const xFor = (i: number) => {
          const cardW = (t.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
          const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
          return w.clientWidth / 2 - (i * (cardW + gap) + cardW / 2);
        };
        const last = steps.length - 1;
        let shown = -1; // React only hears about a change of step, not every scrub tick
        gsap.fromTo(
          t,
          { x: () => xFor(0) },
          {
            x: () => xFor(last),
            ease: "none",
            force3D: true, // the track stays composited while pinned instead of re-rasterising between scrub tweens
            scrollTrigger: {
              trigger: w,
              pin: true,
              scrub: 0.8,
              start: "top top",
              end: () => `+=${xFor(0) - xFor(last) + 200}`,
              invalidateOnRefresh: true,
              anticipatePin: 1,
              onUpdate: (self) => {
                const s = Math.round(self.progress * last);
                if (s !== shown) {
                  shown = s;
                  setStep(s);
                }
              },
            },
          },
        );
        return () => setPinned(false);
      });
      return () => mm.revert();
    },
    { scope: wrap },
  );

  return (
    <section ref={wrap} id="how-it-works" className="relative overflow-hidden bg-cream-50 py-20 lg:flex lg:h-screen lg:min-h-[820px] lg:flex-col lg:justify-center lg:pb-4 lg:pt-24" aria-labelledby="hiw-title">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            as={standalone ? "h1" : "h2"}
            title={<span id="hiw-title">Five stops to a hot meal.</span>}
            description="Scroll. The train follows."
            action={
              <div className="hidden w-72 lg:block">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-display text-xl text-cocoa-900">{current.title}</span>
                  <span className="shrink-0 text-sm font-semibold text-muted">
                    Step {step + 1} of {steps.length}
                  </span>
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                  <div className="h-full rounded-full bg-copper-500 transition-[width] duration-500 ease-(--ease-out-quart)" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                </div>
              </div>
            }
          />
        </Reveal>
        {lg ? (
          <div className="mt-4 hidden max-w-3xl lg:block">
            <RouteLine stations={stations} labelSize={17} progress={steps.map((_, i) => i / (steps.length - 1))[step]} />
          </div>
        ) : (
          <div className="mt-6 lg:hidden">
            <RouteLine stations={stations} labels={false} duration={8} />
          </div>
        )}
      </div>

      {/* Desktop horizontal track: unpadded, GSAP centres the active card. Unpinned (reduced motion) it scrolls natively. */}
      <div className={cn("mt-4 hidden lg:block", pinned ? "overflow-hidden" : "no-scrollbar overflow-x-auto")}>
        <div ref={track} className={cn("flex w-max gap-6", !pinned && "px-[max(1rem,calc((100vw-82rem)/2+2.5rem))]")}>
          {steps.map((s, i) => (
            <StepCard key={s.title} step={s} index={i} active={i === step} />
          ))}
        </div>
      </div>

      {/* Mobile / tablet vertical */}
      <div className="container-x mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.05}>
            <StepCard step={s} index={i} active compact />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** A photo card: picture on the top half with its step number, details below. */
function StepCard({ step, index, active, compact }: { step: (typeof steps)[number]; index: number; active: boolean; compact?: boolean }) {
  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-[transform,opacity] duration-500 ease-(--ease-out-quart)",
        compact ? "h-[340px]" : "h-[380px] w-[min(500px,70vw)]",
        !compact && (active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"),
      )}
      aria-current={active ? "step" : undefined}
    >
      <div className="relative h-1/2 shrink-0 overflow-hidden">
        {/* The first card is above the fold on /how-it-works, so its photo is not lazy. */}
        <Image src={step.image} alt="" fill sizes="520px" loading={index === 0 ? "eager" : "lazy"} className="object-cover" />
        <span className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white text-[15px] font-bold text-cocoa-900 shadow-card">
          <span className="sr-only">Step </span>
          {index + 1}
        </span>
        {step.overlay && overlays[step.overlay]}
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <h3 className="font-display text-2xl text-cocoa-900">{step.title}</h3>
        <p className="mt-1.5 text-[14px] leading-snug text-muted">{step.desc}</p>
        <div className="mt-auto flex items-center gap-1.5 pt-4" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={cn("h-1 rounded-full transition-all duration-500", i === index ? "w-8 bg-copper-500" : "w-3 bg-cream-300")} />
          ))}
        </div>
      </div>
    </article>
  );
}
