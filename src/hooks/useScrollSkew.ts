"use client";

import { useEffect, type RefObject } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { clamp, prefersReducedMotion } from "@/lib/utils";

/** Lenis velocity (px per frame) that maps to the full skew. */
const FULL_SKEW_VELOCITY = 40;
const IDLE_AFTER_INTERACTION_MS = 6000;

/**
 * Skews an element with the page's scroll velocity and eases it back to 0, so carousel
 * tracks "lean" into a fast scroll. Reads velocity from the shared Lenis instance; without
 * Lenis it derives velocity from window scroll deltas. No-op for reduced motion.
 */
export function useScrollSkew(ref: RefObject<HTMLElement | null>, { max = 6 }: { max?: number } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    // force3D: the track keeps its own compositor layer between scroll bursts, so a skew is a composite, not a re-raster of every card.
    const skewTo = gsap.quickTo(el, "skewX", { duration: 0.4, ease: "power3", force3D: true });
    const apply = (velocity: number) => skewTo(clamp((velocity / FULL_SKEW_VELOCITY) * max, -max, max));
    const reset = () => {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: "transform" });
    };

    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ velocity }: { velocity: number }) => apply(velocity);
      lenis.on("scroll", onScroll);
      return () => {
        lenis.off("scroll", onScroll);
        reset();
      };
    }

    // ponytail: fallback only matters when Lenis is absent at mount; velocity = px per scroll event, settles after 80ms.
    let last = window.scrollY;
    let settle = 0;
    const onWindowScroll = () => {
      const y = window.scrollY;
      apply(y - last);
      last = y;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => apply(0), 80);
    };
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onWindowScroll);
      window.clearTimeout(settle);
      reset();
    };
  }, [ref, max]);
}

/**
 * Scrubs a heading block from (+x, +y) to (-x, -y) across its section's scroll, so it sits on a
 * different plane than the cards. Give neighbouring sections different directions.
 */
export function useHeadingParallax(ref: RefObject<HTMLElement | null>, { x = 0, y = 24 }: { x?: number; y?: number } = {}) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { x, y },
        { x: -x, y: -y, ease: "none", force3D: true, scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true } },
      );
    },
    { scope: ref },
  );
}

/**
 * Endless slow crawl for a loop-mode Swiper. A gsap.ticker nudges the track through Swiper's own
 * translate API (the same calls its free-mode mousewheel path makes), so hover pauses it instantly
 * and arrows / wheel / keys get their normal 650ms moves; it rests for 6s after any interaction and
 * never runs off-screen. (Swiper's Autoplay with delay 0 + a long linear transition was the first
 * attempt: hover-pause lags a whole transition and every interaction fights it.)
 * `swiperRef` must be filled by the Swiper's `onSwiper` before this effect runs (child effects run first).
 */
export function useCarouselCrawl(swiperRef: RefObject<SwiperClass | null>, { enabled = true, pxPerSec = 40 }: { enabled?: boolean; pxPerSec?: number } = {}) {
  useEffect(() => {
    const s = swiperRef.current;
    if (!enabled || !s || s.destroyed) return;
    const el = s.el;
    let hovered = false;
    let held = false;
    let idleUntil = 0;
    const rest = () => {
      idleUntil = performance.now() + IDLE_AFTER_INTERACTION_MS;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovered = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovered = false;
    };
    const onHold = () => {
      held = true;
    };
    const onRelease = () => {
      held = false;
      rest();
    };
    const view = ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top" });
    let index = s.activeIndex;
    const tick = (_time: number, dt: number) => {
      if (!view.isActive || hovered || held || s.animating || performance.now() < idleUntil) return;
      if (s.wrapperEl.style.transitionDuration !== "0ms") s.setTransition(0);
      s.setTranslate(s.translate - (pxPerSec * Math.min(dt, 50)) / 1000);
      s.updateActiveIndex();
      // Swiper's loopFix re-measures every slide (updateSlides: inline margins + a forced layout), so it runs only
      // when a slide boundary is crossed, which is also the only time the active/prev/next classes can change.
      if (s.activeIndex !== index) {
        s.updateSlidesClasses();
        s.loopFix({ direction: "next", byMousewheel: true });
        index = s.activeIndex;
      }
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    s.on("touchStart", onHold);
    s.on("touchEnd", onRelease);
    s.on("scroll", rest);
    s.on("keyPress", rest);
    s.on("navigationNext", rest);
    s.on("navigationPrev", rest);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      view.kill();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      s.off("touchStart", onHold);
      s.off("touchEnd", onRelease);
      s.off("scroll", rest);
      s.off("keyPress", rest);
      s.off("navigationNext", rest);
      s.off("navigationPrev", rest);
    };
  }, [swiperRef, enabled, pxPerSec]);
}
