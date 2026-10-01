"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { RouteLine, type RouteStation } from "@/components/animations/RouteLine";
import { useIsMobile } from "@/hooks/useMediaQuery";

export interface JourneyStatusStep {
  headline: string;
  sub: string;
  /** 0..1 along the route */
  progress: number;
  tone?: "default" | "success";
}

/**
 * "Live" journey status, read like a coach display board: LED headline on a
 * dark panel, the train's position on the route below.
 * Drive it with `stepIndex` (tracking page) or let it auto-cycle (homepage demo).
 */
export function JourneyStatus({
  stations,
  steps,
  stepIndex,
  autoCycleMs,
  dark,
  className,
}: {
  stations: RouteStation[];
  steps: JourneyStatusStep[];
  stepIndex?: number;
  autoCycleMs?: number;
  dark?: boolean;
  className?: string;
}) {
  const [auto, setAuto] = useState(0);
  const isMobile = useIsMobile();
  const idx = stepIndex ?? auto;
  const step = steps[Math.min(idx, steps.length - 1)];
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepIndex !== undefined || !autoCycleMs) return;
    const t = setInterval(() => setAuto((n) => (n + 1) % steps.length), autoCycleMs);
    return () => clearInterval(t);
  }, [stepIndex, autoCycleMs, steps.length]);

  useEffect(() => {
    if (!textRef.current || prefersReducedMotion()) return;
    gsap.fromTo(textRef.current, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" });
  }, [idx]);

  return (
    <div className={cn("rounded-3xl p-4 sm:p-5", dark ? "glass text-cream-50" : "border border-line bg-white shadow-card", className)}>
      <div className="led-panel relative rounded-2xl px-5 pb-5 pt-4 text-cream-50" aria-live="polite">
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-300 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-leaf-300" />
          </span>
          <span className="led text-[11px]">Live</span>
        </span>
        <div ref={textRef} className="min-h-16 pr-14">
          <p className={cn("led text-xl leading-tight sm:text-2xl", step.tone === "success" && "[color:#9fe870] [text-shadow:0_0_6px_rgb(120_220_80/0.8),0_0_16px_rgb(80_200_40/0.4)]")}>{step.headline}</p>
          <p className="mt-2 text-sm text-cream-50/70">{step.sub}</p>
        </div>
      </div>
      <div className="mt-4 px-1">
        <RouteLine dark={dark} stations={stations} progress={step.progress} labelSize={isMobile ? 34 : 22} />
      </div>
    </div>
  );
}
