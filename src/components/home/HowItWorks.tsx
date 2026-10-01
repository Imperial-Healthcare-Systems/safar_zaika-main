"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { CreditCard, MapPin, Ticket, Utensils, Armchair } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { RouteLine } from "@/components/animations/RouteLine";
import { Reveal } from "@/components/animations/Reveal";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { SectionHeading } from "@/components/ui";

/** Small props laid over the step photos: a PNR stub, a route with the chosen halt lit, the payment signboard. */
const overlays = {
  pnr: (
    <span className="ticket-edge absolute bottom-4 right-4 flex flex-col bg-cream-50 px-5 py-1.5 shadow-card" style={{ "--n": "6px" } as CSSProperties}>
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">PNR</span>
      <span className="font-condensed text-xl font-bold leading-none tracking-[0.14em] text-cocoa-900">123 ... 890</span>
    </span>
  ),
  route: (
    <span className="absolute bottom-4 right-4 flex items-center gap-2.5 rounded-full bg-cocoa-950/80 py-2 pl-3 pr-3.5 backdrop-blur">
      <svg width="64" height="16" viewBox="0 0 64 16" aria-hidden className="block">
        <line x1="8" y1="8" x2="56" y2="8" className="stroke-cream-50/35" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="8" r="3.5" className="fill-cream-50/50" />
        <circle cx="32" cy="8" r="7" className="fill-copper-500/35" />
        <circle cx="32" cy="8" r="4" className="fill-gold-400" />
        <circle cx="56" cy="8" r="3.5" className="fill-cream-50/50" />
      </svg>
      <span className="led text-[10px]">BRC 9:08 PM</span>
    </span>
  ),
  pay: <span className="signboard absolute bottom-4 right-4 text-[11px]">Prepaid / COD</span>,
};

export const steps: { n: string; title: string; desc: string; icon: typeof Ticket; image: string; overlay?: keyof typeof overlays; accent: string }[] = [
  { n: "01", title: "Enter PNR", desc: "We read your train, date, coach and berth from the ticket — no typing station names.", icon: Ticket, image: "/images/stations/new-delhi.jpg", overlay: "pnr", accent: "bg-copper-500" },
  { n: "02", title: "Choose a station", desc: "See every upcoming halt with arrival time, halt duration and which kitchens are ready there.", icon: MapPin, image: "/images/stations/mumbai.jpg", overlay: "route", accent: "bg-cocoa-800" },
  { n: "03", title: "Pick your food", desc: "Thalis, biryanis, Jain meals, chai flasks. Real menus from verified local kitchens.", icon: Utensils, image: "/images/food/thali-overhead.jpg", accent: "bg-leaf-600" },
  { n: "04", title: "Pay your way", desc: "UPI, card, net banking, or cash at your seat. Prices shown are exactly what you pay.", icon: CreditCard, image: "/images/scenes/restaurant-serving.jpg", overlay: "pay", accent: "bg-gold-500" },
  { n: "05", title: "Enjoy at your seat", desc: "Our partner tracks your train live and hands over a sealed, hot meal at your berth.", icon: Armchair, image: "/images/scenes/friends-eating.jpg", accent: "bg-copper-600" },
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
        gsap.fromTo(
          t,
          { x: () => xFor(0) },
          {
            x: () => xFor(last),
            ease: "none",
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
                setStep((prev) => (prev === s ? prev : s));
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
              <div className="led-panel hidden rounded-2xl px-5 py-4 lg:block">
                <SplitFlap text={current.title} length={18} trigger="mount" className="text-2xl" />
                <p className="led mt-2 text-[11px]">
                  Stop {current.n} of {steps[steps.length - 1]?.n}
                </p>
              </div>
            }
          />
        </Reveal>
        <div className="mt-4 hidden max-w-3xl lg:block">
          <RouteLine stations={stations} labelSize={17} progress={steps.map((_, i) => i / (steps.length - 1))[step]} />
        </div>
        <div className="mt-6 lg:hidden">
          <RouteLine stations={stations} labels={false} duration={8} />
        </div>
      </div>

      {/* Desktop horizontal track: unpadded, GSAP centres the active card. Unpinned (reduced motion) it scrolls natively. */}
      <div className={cn("mt-4 hidden lg:block", pinned ? "overflow-hidden" : "no-scrollbar overflow-x-auto")}>
        <div ref={track} className={cn("flex w-max gap-6", !pinned && "px-[max(1rem,calc((100vw-82rem)/2+2.5rem))]")}>
          {steps.map((s, i) => (
            <StepCard key={s.n} step={s} index={i} active={i === step} />
          ))}
        </div>
      </div>

      {/* Mobile / tablet vertical */}
      <div className="container-x mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.05}>
            <StepCard step={s} index={i} active compact />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** A ticket stub: picture on the top half, perforation + notches at the middle, details below. */
function StepCard({ step, index, active, compact }: { step: (typeof steps)[number]; index: number; active: boolean; compact?: boolean }) {
  return (
    <article
      className={cn(
        "ticket-edge relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-[transform,opacity] duration-500 ease-(--ease-out-quart)",
        compact ? "h-[340px]" : "h-[380px] w-[min(500px,70vw)]",
        !compact && (active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"),
      )}
      aria-current={active ? "step" : undefined}
    >
      <div className="relative h-1/2 shrink-0 overflow-hidden">
        <Image src={step.image} alt="" fill sizes="520px" className="object-cover" />
        <span className="signboard absolute left-5 top-5">Stop {step.n}</span>
        {step.overlay && overlays[step.overlay]}
      </div>
      <div className="flex flex-1 flex-col border-t-2 border-dashed border-line p-5 pt-4">
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
