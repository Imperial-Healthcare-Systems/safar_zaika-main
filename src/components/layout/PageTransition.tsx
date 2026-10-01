"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";
import { TrainIcon } from "@/components/animations/TrainIcon";

/**
 * Brand-coloured wipe between routes (≈ 320ms out + 420ms in).
 * Intercepts internal link clicks, plays the cover, then navigates;
 * reveals once the new pathname has rendered. Honors reduced motion.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const trainRef = useRef<HTMLDivElement>(null);
  const covering = useRef(false);

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
      if (prefersReducedMotion() || covering.current) return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      e.preventDefault();
      covering.current = true;
      overlay.style.pointerEvents = "auto";
      gsap.killTweensOf([overlay, lineRef.current, trainRef.current]);
      const tl = gsap.timeline({ onComplete: () => router.push(href) });
      tl.fromTo(overlay, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.32, ease: "power3.inOut" });
      tl.fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, "-=0.1");
      tl.fromTo(trainRef.current, { xPercent: -40, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, "<");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    if (!covering.current) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const tl = gsap.timeline({
      delay: 0.05,
      onComplete: () => {
        covering.current = false;
        overlay.style.pointerEvents = "none";
      },
    });
    tl.to(trainRef.current, { xPercent: 60, opacity: 0, duration: 0.3, ease: "power2.in" });
    tl.to(overlay, { clipPath: "inset(0 0 100% 0)", duration: 0.42, ease: "power3.inOut" }, "-=0.15");
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-transition flex items-center justify-center gradient-cocoa"
      style={{ clipPath: "inset(100% 0 0 0)" }}
    >
      <div className="relative w-[min(60vw,420px)]">
        <div ref={lineRef} className="h-0.5 w-full origin-left bg-gold-400/70" />
        <div ref={trainRef} className="absolute -top-5 left-1/2 -translate-x-1/2 text-cream-50">
          <TrainIcon className="size-10" />
        </div>
      </div>
    </div>
  );
}
