"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/lenis";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWebGL } from "@/hooks/useWebGL";
import { useHydrated } from "@/hooks/useHydrated";
import { Button } from "@/components/ui";
import { Magnetic } from "@/components/animations/Magnetic";
import { RouteLine } from "@/components/animations/RouteLine";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { PnrModule } from "@/components/pnr/PnrModule";
import { selectSelectedStation, useJourneyStore, useUIStore } from "@/stores";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

/** Meal windows: generic, never tied to a specific journey. */
const meals = [
  { id: "breakfast", label: "Breakfast", window: "6 - 11 AM", src: "/images/food/idli-vada.jpg" },
  { id: "lunch", label: "Lunch", window: "11:30 - 3:30", src: "/images/food/thali-overhead.jpg" },
  { id: "dinner", label: "Dinner", window: "6:30 - 11 PM", src: "/images/food/chicken-biryani.jpg" },
  { id: "snacks", label: "Chai & snacks", window: "Anytime", src: "/images/food/masala-chai.jpg" },
];

const genericRows = [
  { main: "BREAKFAST", sub: "06:00", note: "UNTIL 11:00" },
  { main: "LUNCH", sub: "11:30", note: "UNTIL 15:30" },
  { main: "DINNER", sub: "18:30", note: "UNTIL 23:00" },
  { main: "CHAI", sub: "ANYTIME", note: "FLASKS AND SNACKS" },
];

/**
 * Platform-indicator board. Before a PNR is entered it cycles the meal
 * windows; once a journey is loaded it cycles the real halts on that route
 * where a kitchen can meet the train. Fixed width: rows never resize it.
 */
function HaltBoard({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const journey = useJourneyStore((s) => s.journey);
  const eligible = useJourneyStore((s) => s.eligible);
  const board = useMemo(() => {
    if (hydrated && journey) {
      const halts = eligible
        .filter((e) => e.availability === "available")
        .map((e) => ({ main: e.station.name.toUpperCase(), sub: e.stop.arrival ?? "--:--", note: `${e.restaurantCount} KITCHEN${e.restaurantCount === 1 ? "" : "S"} READY` }));
      if (halts.length) return { label: `${journey.trainNumber} next halt`, rows: halts };
    }
    return { label: "Serving", rows: genericRows };
  }, [hydrated, journey, eligible]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 4200);
    return () => window.clearInterval(t);
  }, []);
  const row = board.rows[tick % board.rows.length];
  return (
    <div className={cn("led-panel w-full max-w-[720px] rounded-xl px-3 py-2.5 sm:px-4 sm:py-3", className)} aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span className="led truncate text-[10px] sm:text-[11px]">{board.label}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-leaf-300 sm:text-[11px]">
          <span className="size-1.5 animate-blink rounded-full bg-leaf-300" aria-hidden /> On time
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <SplitFlap text={row.main} length={13} trigger="mount" className="text-[13px] sm:text-[15px] lg:text-base" />
        <SplitFlap text={row.sub} length={6} trigger="mount" className="text-[13px] sm:text-[15px] lg:text-base" />
        <span className="led hidden truncate text-[11px] lg:inline">{row.note}</span>
      </div>
    </div>
  );
}

function MealTile({ meal, href, compact }: { meal: (typeof meals)[number]; href: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      data-hero-anim
      data-hero-tile
      className="group block overflow-hidden rounded-2xl border border-cream-50/15 bg-cocoa-900/85 opacity-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] transition-[transform,border-color] duration-500 ease-(--ease-out-quart) hover:-translate-y-1 hover:border-gold-400/50"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={cn("relative", compact ? "aspect-[5/3]" : "aspect-[4/3]")}>
        <Image src={meal.src} alt="" fill sizes="(max-width: 1024px) 45vw, 240px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className="signboard absolute left-2.5 top-2.5 text-[10px]">{meal.window}</span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="truncate text-[13px] font-semibold text-cream-50">{meal.label}</p>
        <ArrowUpRight className="size-4 shrink-0 text-gold-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}

/**
 * Stage: a fixed 100svh layer, so the canvas never resizes when the PNR card changes height.
 * Owns its own visibility state, so the 3D scene idles off screen without re-rendering the hero.
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
    <div ref={stageRef} className="absolute inset-x-0 top-0 -z-10 h-[100svh] min-h-[720px]" aria-hidden>
      {use3D ? (
        <HeroScene animate={!reduced && inView} />
      ) : (
        <div className="absolute inset-x-0 bottom-[6%] opacity-80 md:bottom-[10%]">
          <RouteLine dark labels={false} duration={9} stations={[{ label: "" }, { label: "" }, { label: "" }, { label: "" }, { label: "" }]} className="scale-110" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_15%_20%,rgba(45,95,174,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,52,0.82)_0%,rgba(7,22,52,0.45)_45%,rgba(7,22,52,0)_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cocoa-950/80 to-transparent" />
    </div>
  );
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const setOrderNowOpen = useUIStore((s) => s.setOrderNowOpen);
  const introDone = useUIStore((s) => s.introDone);
  const hydrated = useHydrated();
  const selected = useJourneyStore(selectSelectedStation);
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");
  const webgl = useWebGL();
  const use3D = wide && webgl;
  const mealHref = (id: string) => `/restaurants?meal=${id}${hydrated && selected ? `&station=${selected.station.code}` : ""}`;

  // Safety net: if no intro loader ever reports, the hero still plays.
  useEffect(() => {
    const t = window.setTimeout(() => useUIStore.getState().setIntroDone(), 3500);
    return () => window.clearTimeout(t);
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !introDone) return;
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
      const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1 } });
      tl.fromTo(q("[data-hero-copy]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0 }, 0.45)
        .fromTo(q("[data-hero-cta]"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.08 }, 0.6)
        .fromTo(q("[data-hero-card]"), { autoAlpha: 0, x: 36, rotateY: -6 }, { autoAlpha: 1, x: 0, rotateY: 0, duration: 1.2 }, 0.35)
        .fromTo(q("[data-hero-board]"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0 }, 0.9)
        .fromTo(q("[data-hero-tile]"), { autoAlpha: 0, y: 40, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, stagger: 0.1, duration: 1 }, 0.95);

      // Tiles tilt together with the pointer (one shared angle keeps the row symmetric).
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(q("[data-hero-tile]"), { rotateY: dx * 8, rotateX: -dy * 6, duration: 0.8, ease: "power2.out" });
      };
      if (window.matchMedia("(pointer: fine)").matches) el.addEventListener("mousemove", onMove);
      return () => el.removeEventListener("mousemove", onMove);
    },
    { scope: ref, dependencies: [introDone] },
  );

  return (
    <section ref={ref} className="relative isolate min-h-[100svh] overflow-hidden gradient-cocoa text-cream-50" aria-labelledby="hero-title">
      <HeroStage use3D={use3D} reduced={reduced} />

      <div className="container-x relative grid items-start gap-10 pb-12 pt-32 md:pt-36 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pb-10 lg:pt-40 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="max-w-2xl lg:pt-4">
          <h1 id="hero-title" className="max-w-3xl text-balance font-display text-[3.3rem] leading-[0.94] opacity-0 sm:text-[4.4rem] lg:text-[4.7rem] xl:text-[5.5rem]">
            Hot food on your train, handed over <span className="text-gold-400">at your seat.</span>
          </h1>
          <p data-hero-anim data-hero-copy className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-cream-50/78 opacity-0 sm:text-lg">
            Enter your PNR and pick a halt on your route. A local kitchen cooks to your train&apos;s arrival time and a partner hands it over at your berth.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div data-hero-anim data-hero-cta className="opacity-0">
              <Magnetic>
                <Button size="xl" className="uppercase tracking-[0.1em]" onClick={() => setOrderNowOpen(true)} rightIcon={<ArrowRight className="size-4" />}>
                  Order now
                </Button>
              </Magnetic>
            </div>
            <div data-hero-anim data-hero-cta className="opacity-0">
              <Button variant="glass" size="xl" onClick={() => scrollToTarget("#how-it-works")}>
                See how it works
              </Button>
            </div>
          </div>
          <div data-hero-anim data-hero-board className="mt-10 opacity-0">
            <HaltBoard />
          </div>
        </div>

        <div data-hero-anim data-hero-card className="opacity-0 lg:w-full lg:max-w-md lg:justify-self-end" style={{ perspective: 1200 }}>
          <PnrModule dark />
        </div>
      </div>

      {/* Meal windows: four equal tiles, centred, one row on desktop and two by two on phones */}
      <div className="container-x relative pb-16 lg:pb-14" style={{ perspective: 1400 }}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {meals.map((m) => (
            <MealTile key={m.id} meal={m} href={mealHref(m.id)} compact={!wide} />
          ))}
        </div>
      </div>
    </section>
  );
}
