"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import {
  RouteLine,
  type RouteStation,
} from "@/components/animations/RouteLine";
import { useIsMobile } from "@/hooks/useMediaQuery";

export interface JourneyStatusStep {
  headline: string;
  sub: string;
  /** 0..1 along the route */
  progress: number;
  tone?: "default" | "success";
}

/**
 * "Live" journey status card: a coloured dot and a plain headline, one supporting
 * line, a Live pill, and the train's position on the route below.
 * Drive it with `stepIndex` (tracking page) or let it auto-cycle (homepage demo).
 */
export function JourneyStatus({
  stations,
  steps,
  stepIndex,
  autoCycleMs,
  dark,
  live = true,
  className,
}: {
  stations: RouteStation[];
  steps: JourneyStatusStep[];
  stepIndex?: number;
  autoCycleMs?: number;
  dark?: boolean;
  /** show the Live pill; pass false once the order is delivered or cancelled */
  live?: boolean;
  className?: string;
}) {
  const [auto, setAuto] = useState(0);
  const isMobile = useIsMobile();
  const idx = stepIndex ?? auto;
  const step = steps[Math.min(idx, steps.length - 1)];
  const done = step.tone === "success";
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepIndex !== undefined || !autoCycleMs) return;
    const t = setInterval(
      () => setAuto((n) => (n + 1) % steps.length),
      autoCycleMs,
    );
    return () => clearInterval(t);
  }, [stepIndex, autoCycleMs, steps.length]);

  useEffect(() => {
    if (!textRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      textRef.current,
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" },
    );
  }, [idx]);

  return (
    <div
      className={cn(
        "rounded-3xl p-5 sm:p-6",
        dark
          ? "panel-dark text-cream-50"
          : "border border-line bg-white text-cocoa-900 shadow-card",
        className,
      )}
    >
      <div className="flex items-start gap-3" aria-live="polite">
        {/* Orange while the order is in progress, green once it is handed over. */}
        <span
          className={cn(
            "mt-2 size-2.5 shrink-0 rounded-full sm:mt-2.5",
            done ? (dark ? "bg-leaf-300" : "bg-leaf-500") : "bg-copper-500",
          )}
          aria-hidden
        />
        {/* Reserved for a two-line headline plus two lines of support on phones, so auto-cycling steps never move the page. */}
        <div
          ref={textRef}
          className="min-h-24 min-w-0 flex-1 sm:min-h-[4.75rem]"
        >
          <p className="font-display text-xl leading-tight sm:text-2xl">
            {step.headline}
          </p>
          <p
            className={cn(
              "mt-1.5 text-sm leading-snug",
              dark ? "text-cream-50/70" : "text-muted",
            )}
          >
            {step.sub}
          </p>
        </div>
        {live && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              dark ? "bg-cream-50/10" : "bg-leaf-50 text-leaf-700",
            )}
          >
            <span className="relative flex size-2" aria-hidden>
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                  dark ? "bg-leaf-300" : "bg-leaf-500",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  dark ? "bg-leaf-300" : "bg-leaf-500",
                )}
              />
            </span>
            Live
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-4 border-t pt-4",
          dark ? "border-cream-50/10" : "border-line",
        )}
      >
        <RouteLine
          dark={dark}
          stations={stations}
          progress={step.progress}
          labelSize={isMobile ? 34 : 22}
        />
      </div>
    </div>
  );
}
