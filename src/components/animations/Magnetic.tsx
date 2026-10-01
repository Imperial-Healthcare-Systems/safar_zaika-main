"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";

/** Pulls the child toward the cursor on hover. Pointer devices only. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) return;
      const xTo = gsap.quickTo(child, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(child, "y", { duration: 0.6, ease: "power3" });
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => {
        gsap.to(child, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className} style={{ display: "inline-block", padding: 12, margin: -12 }}>
      {children}
    </div>
  );
}
