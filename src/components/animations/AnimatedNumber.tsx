"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";

/** Tweens between values so totals never "jump". Writes straight to the DOM — no re-renders per frame. */
export function AnimatedNumber({ value, format = (n) => String(Math.round(n)), className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const obj = useRef({ v: value });
  const fmt = useRef(format);

  useEffect(() => {
    fmt.current = format;
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      obj.current.v = value;
      el.textContent = fmt.current(value);
      return;
    }
    const tween = gsap.to(obj.current, {
      v: value,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = fmt.current(obj.current.v);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={className} aria-live="polite">
      {format(value)}
    </span>
  );
}

/**
 * Counts up to `value` the first time it scrolls into view, then stays put. For figures taken from the
 * data (network size, policy numbers) — never for live metrics we don't have.
 * The markup carries the final number, so it reads correctly without JavaScript and to screen readers.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const n = { v: 0 };
      const write = () => {
        el.textContent = `${prefix}${Math.round(n.v)}${suffix}`;
      };
      write(); // start from zero, even if the figure is still below the fold
      gsap.to(n, { v: value, duration, ease: "power2.out", onUpdate: write, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    },
    { dependencies: [value, prefix, suffix, duration] },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}
