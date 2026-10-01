"use client";

import { useEffect, useRef, type Ref } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { TrainIcon } from "@/components/animations/TrainIcon";
import { SplitFlap } from "@/components/animations/SplitFlap";

/** ms from the click until the curtain may lift: the train crossing (0.4s + 1s) must read. */
const MIN_COVER_MS = 1400;
/** The board's CSS animations; the intro renders them on, the route transition adds them on cue. */
const ANIM = { logo: "curtain-logo-on", train: "curtain-train-on", rail: "curtain-rail-on", led: "curtain-led-on" } as const;
/** Intro: the crossing and the board follow the logo's settle by this much (from the first paint). */
const LEAVE = "curtain-leave";
/** gsap "expo.inOut" */
export const EXPO_IN_OUT = "cubic-bezier(0.87, 0, 0.13, 1)";
export const CLIP = { below: "inset(100% 0 0 0)", covered: "inset(0% 0 0 0)", lifted: "inset(0% 0 100% 0)" } as const;

/**
 * The cocoa platform curtain shared by the route transition and the first-load intro:
 * stacked white logo over a full-width track that one train crosses left to right.
 * `covered` renders it closed with the board already running by CSS (server-side, for the
 * intro, so nothing waits for JS); `led` adds the departure-board line.
 * Everything animates by CSS / the Web Animations API, so a busy main thread (hero 3D init,
 * a new route's first render) can delay a frame but never skips the motion.
 */
export function Curtain({ ref, covered, led }: { ref: Ref<HTMLDivElement>; covered?: boolean; led?: boolean }) {
  return (
    <div
      ref={ref}
      aria-hidden
      data-intro={covered ? "" : undefined}
      className={cn("fixed inset-0 z-transition flex flex-col items-center justify-center overflow-hidden gradient-cocoa text-cream-50", covered ? "pointer-events-auto" : "pointer-events-none")}
      style={{ clipPath: covered ? CLIP.covered : CLIP.below }}
    >
      <div className="absolute inset-0 map-grid-dark opacity-70" />
      <div data-curtain-logo className={cn("relative opacity-0", covered && ANIM.logo)}>
        <Logo variant="stacked-white" href={null} priority className="h-24 sm:h-28" />
      </div>
      <div className="relative mt-10 h-16 w-full sm:mt-12 sm:h-20">
        <div className="absolute inset-x-0 bottom-0 border-t-2 border-dotted border-cream-50/30" />
        <div data-curtain-rail className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold-400", covered && [ANIM.rail, LEAVE])} />
        <div data-curtain-train className={cn("absolute -bottom-1.5 left-0 opacity-0", covered && [ANIM.train, LEAVE])}>
          <TrainIcon className="h-12 w-auto sm:h-14" />
        </div>
      </div>
      {led && (
        <div data-curtain-led className={cn("led-panel relative mt-8 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-0 sm:text-base", covered && [ANIM.led, LEAVE])}>
          <SplitFlap text="PLATFORM 1" trigger="mount" delay={150} speed={36} stagger={20} />
          <span className="led">·</span>
          <SplitFlap text="BOARDING" trigger="mount" delay={300} speed={36} stagger={20} />
        </div>
      )}
    </div>
  );
}

/**
 * Route transition: intercepts internal link clicks, wipes the curtain up from the bottom
 * (0.45s), pushes the route once covered while the train crosses, and lifts it to the top once
 * the new pathname has rendered and the crossing is done. Reduced motion: plain navigation.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  /** performance.now() of the covering click; 0 while idle */
  const coverAt = useRef(0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined) return;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) return;
      if (prefersReducedMotion() || coverAt.current) return;
      const el = ref.current;
      if (!el) return;
      e.preventDefault();
      coverAt.current = performance.now();
      el.style.pointerEvents = "auto";
      el.getAnimations().forEach((a) => a.cancel());
      // Reset the board; its animations are re-added on cue below (a later frame, so they restart).
      const part = (k: keyof typeof ANIM) => el.querySelector(`[data-curtain-${k}]`);
      for (const k of Object.keys(ANIM) as (keyof typeof ANIM)[]) part(k)?.classList.remove(ANIM[k]);
      el.animate([{ clipPath: CLIP.below }, { clipPath: CLIP.covered }], { duration: 450, easing: EXPO_IN_OUT, fill: "forwards" }).onfinish = () => router.push(href);
      window.setTimeout(() => part("logo")?.classList.add(ANIM.logo), 150);
      window.setTimeout(() => [part("train")?.classList.add(ANIM.train), part("rail")?.classList.add(ANIM.rail)], 400);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    const el = ref.current;
    if (!coverAt.current || !el) return;
    const delay = Math.max(0, MIN_COVER_MS - (performance.now() - coverAt.current));
    // Two frames in: the new page has painted once before the lift starts.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const lift = el.animate([{ clipPath: CLIP.covered }, { clipPath: CLIP.lifted }], { duration: 450, delay, easing: EXPO_IN_OUT, fill: "forwards" });
        lift.onfinish = () => {
          coverAt.current = 0;
          el.style.pointerEvents = "none";
        };
      }),
    );
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return <Curtain ref={ref} />;
}
