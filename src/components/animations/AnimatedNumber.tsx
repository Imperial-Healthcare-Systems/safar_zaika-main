"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
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
