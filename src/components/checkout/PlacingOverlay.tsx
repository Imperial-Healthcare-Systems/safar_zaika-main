"use client";

import { useEffect, useRef, useState } from "react";
import { RouteLine } from "@/components/animations/RouteLine";
import { Logo } from "@/components/ui";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";

const steps = ["Confirming with the kitchen…", "Reserving your delivery slot…", "Locking your seat delivery…"];

/** Full-screen branded wait state while the (mock) order is created. */
export function PlacingOverlay() {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(ref.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo("[data-pop]", { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, delay: 0.1, ease: "expo.out" });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} role="status" aria-live="polite" className="fixed inset-0 z-modal flex flex-col items-center justify-center gradient-cocoa px-6 text-center text-cream-50">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-40" />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <div data-pop>
          <Logo variant="badge" href={null} className="h-20" />
        </div>
        <RouteLine dark labels={false} duration={2.4} stations={[{ label: "" }, { label: "" }, { label: "" }, { label: "" }]} className="mt-8" />
        <p data-pop className="mt-4 font-display text-3xl">
          Placing your order
        </p>
        <p data-pop className="mt-2 min-h-5 text-sm text-cream-50/70">
          {steps[i]}
        </p>
      </div>
    </div>
  );
}
