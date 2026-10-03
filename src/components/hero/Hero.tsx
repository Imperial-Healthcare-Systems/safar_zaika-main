"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useRef, useState } from "react";
import { Armchair, Radar, Wallet } from "lucide-react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { cn, formatClock, prefersReducedMotion } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWebGL } from "@/hooks/useWebGL";
import { useHydrated } from "@/hooks/useHydrated";
import { RouteLine } from "@/components/animations/RouteLine";
import { HeroServices } from "./HeroServices";
import { MEALS, isWithinWindows } from "@/services";
import { useDeliveryMoment, useJourneyStore } from "@/stores";

/**
 * Layout numbers, as CSS variables on the section (classes, not inline styles, so nothing can differ at hydration):
 *  --hero-h      first-screen height on md+ (section minimum and the 3D stage): the viewport, but never shorter than the
 *                copy plus the train band needs (720px) and never so tall that the train drifts away from the copy
 *                (960px, or wider than 21:9 allows)
 *  --hero-nav    height of the fixed navbar at the top of the page
 *  --hero-room   where the copy has to end: above the tab bar on phones, above the train band (the lower 11.5% of the stage) on md+
 *  --hero-block  height of the copy block with the default PNR card
 *  --hero-title  headline size on lg+; shrinks on short screens so the block still has air above and below
 * The block is centred between the navbar and the train band by its top padding, computed from those numbers. It is
 * anchored at the top on purpose: when the search card grows (train tab, hotels) it grows downward and the headline stays put.
 */
const heroVars =
  "[--hero-nav:88px] [--hero-room:calc(100svh_-_56px)] [--hero-block:42rem] " +
  "sm:[--hero-block:36rem] " +
  "md:[--hero-h:clamp(720px,calc(100svh_-_56px),max(960px,43vw))] md:[--hero-room:calc(var(--hero-h)_*_0.885)] md:[--hero-block:34rem] " +
  "lg:[--hero-h:clamp(720px,100svh,max(960px,43vw))] lg:[--hero-nav:100px] lg:[--hero-title:clamp(2.5rem,calc(10svh_-_2rem),3rem)] lg:[--hero-block:calc(25.5rem_+_2.12_*_var(--hero-title))] " +
  "xl:[--hero-title:clamp(2.75rem,calc(10svh_-_2rem),3.5rem)]";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

const promises = [
  { icon: Wallet, label: "Prepaid or cash on delivery" },
  { icon: Radar, label: "Live order tracking" },
  { icon: Armchair, label: "Delivered at your seat" },
];

/**
 * One quiet line under the chips. Before a PNR it names the meal window the clock is in; once a journey is
 * loaded it names the first halt on that route where a kitchen can still take an order.
 * Fixed width and height: the text changes, the layout never does.
 */
function HeroInfo() {
  const hydrated = useHydrated();
  const journey = useJourneyStore((s) => s.journey);
  const eligible = useJourneyStore((s) => s.eligible);
  const moment = useDeliveryMoment();
  const halt = hydrated && journey ? eligible.find((e) => e.availability === "available") : undefined;
  // Timed meals come first in MEALS; outside all of them it is the all-day chai and snacks window.
  const meal = moment ? (MEALS.find((m) => isWithinWindows(moment.hhmm, [m.window])) ?? MEALS[MEALS.length - 1]) : null;

  const text = halt
    ? `${halt.station.name}, ${formatClock(halt.stop.arrival)}. ${halt.restaurantCount} ${halt.restaurantCount === 1 ? "kitchen" : "kitchens"} ready`
    : !meal
      ? "Meals timed to your halt"
      : meal.id === "snacks"
        ? "Serving chai and snacks, all day"
        : `Serving ${meal.label.toLowerCase()}, ${formatClock(meal.window.from)} to ${formatClock(meal.window.to)}`;

  return (
    <p className="flex h-10 w-full max-w-[26rem] items-center justify-center gap-2.5 rounded-full bg-cocoa-950/70 px-4 text-[13px] font-semibold text-cream-50 ring-1 ring-cream-50/15 sm:text-sm" aria-live="polite">
      <span className="size-2 shrink-0 rounded-full bg-leaf-300" aria-hidden />
      {/* Keyed on the text: a new line fades in (CSS @starting-style) instead of snapping. */}
      <span key={text} className="truncate transition-opacity duration-500 starting:opacity-0">
        {halt && (
          <span className="font-medium text-cream-50/70">
            Next<span className="max-sm:hidden"> food stop</span>:{" "}
          </span>
        )}
        {text}
      </span>
    </p>
  );
}

/**
 * Stage: a fixed-height layer behind the copy (the first screen on md+), so the canvas never resizes when the
 * search card changes height. Owns its own visibility state, so the 3D scene idles off screen without re-rendering the hero.
 * Phones have no canvas: the layer follows the section and the route line sits along its bottom edge.
 */
const HeroStage = memo(function HeroStage({ use3D, reduced }: { use3D: boolean; reduced: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries.some((e) => e.isIntersecting)), { threshold: 0.02 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={stageRef} className="absolute inset-x-0 top-0 -z-10 h-full md:h-(--hero-h)" aria-hidden>
      {use3D ? (
        <HeroScene animate={!reduced && inView} />
      ) : (
        <div className="absolute inset-x-0 bottom-3 opacity-80 md:bottom-[10%]">
          <RouteLine dark labels={false} duration={9} stations={[{ label: "" }, { label: "" }, { label: "" }, { label: "" }, { label: "" }]} className="scale-110" />
        </div>
      )}
      {/* Navy scrim over the upper half: nothing in the scene sits bright behind the headline. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,22,52,0.92)_0%,rgba(7,22,52,0.62)_36%,rgba(7,22,52,0)_64%)]" />
      {/* Side vignette: the wet ground mirrors the dusk light at the edges, which would pull the eye off the card. */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,52,0.8)_0%,rgba(7,22,52,0.45)_22%,rgba(7,22,52,0)_42%,rgba(7,22,52,0)_78%,rgba(7,22,52,0.4)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cocoa-950/70 to-transparent" />
    </div>
  );
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const webgl = useWebGL();
  const use3D = wide && webgl;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const title = el.querySelector<HTMLElement>("#hero-title");
      if (prefersReducedMotion()) {
        gsap.set(q("[data-hero-anim]"), { autoAlpha: 1 });
        if (title) gsap.set(title, { autoAlpha: 1 });
        return;
      }
      // Lines are split after layout so the headline wraps naturally at every width.
      if (title) {
        gsap.set(title, { autoAlpha: 1 });
        SplitText.create(title, {
          type: "lines",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 70, autoAlpha: 0, stagger: 0.1, duration: 1.1, ease: "expo.out", delay: 0.1 }),
        });
      }
      gsap
        .timeline({ defaults: { ease: "expo.out", duration: 1 } })
        .fromTo(q("[data-hero-copy]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 }, 0.4)
        .fromTo(q("[data-hero-card]"), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.1 }, 0.5)
        .fromTo(q("[data-hero-point]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.08 }, 0.75)
        .fromTo(q("[data-hero-info]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0 }, 0.95);
    },
    { scope: ref },
  );

  return (
    // data-hero: the navbar stays transparent while this section is behind it.
    <section ref={ref} data-hero className={cn("relative isolate min-h-[100svh] overflow-hidden gradient-cocoa text-cream-50 md:min-h-(--hero-h)", heroVars)} aria-labelledby="hero-title">
      <HeroStage use3D={use3D} reduced={reduced} />

      {/* Top padding centres the block between the navbar and the train band; it never drops below the navbar plus 12px. */}
      <div className="container-x relative flex flex-col items-center pb-24 pt-[max(calc(var(--hero-nav)_+_0.75rem),calc((var(--hero-room)_-_var(--hero-block)_+_var(--hero-nav))_/_2))] text-center md:pb-16">
        <h1 id="hero-title" className="max-w-4xl text-balance font-display text-[2.125rem] leading-[1.06] opacity-0 sm:text-[2.75rem] lg:text-[length:var(--hero-title)]">
          Hot food on your train, handed over <span className="text-gold-400">at your seat.</span>
        </h1>
        <p data-hero-anim data-hero-copy className="mt-3 max-w-3xl text-pretty text-base leading-normal text-cream-50/80 opacity-0 sm:mt-4 sm:leading-relaxed lg:max-w-4xl lg:text-[17px]">
          Enter your PNR and pick a halt on your route. A kitchen near that station cooks to your train&apos;s arrival time.
        </p>

        {/* z-10: the card's suggestion lists drop over the rows below it */}
        <div data-hero-anim data-hero-card className="relative z-10 mt-4 w-full max-w-3xl text-left opacity-0 sm:mt-5">
          <HeroServices />
        </div>

        {/* Chips carry their own navy backing: when the card grows (train tab) they slide over the train band and stay readable. */}
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px] font-semibold text-cream-50/90 sm:mt-4 sm:gap-2.5 sm:text-sm">
          {promises.map((p) => (
            <li key={p.label} data-hero-anim data-hero-point className="inline-flex items-center gap-2 rounded-full bg-cocoa-950/60 px-3.5 py-1.5 opacity-0 ring-1 ring-cream-50/10">
              <p.icon className="size-4 text-gold-400" aria-hidden />
              {p.label}
            </li>
          ))}
        </ul>

        <div data-hero-anim data-hero-info className="mt-2.5 flex w-full justify-center opacity-0 sm:mt-3">
          <HeroInfo />
        </div>
      </div>
    </section>
  );
}
