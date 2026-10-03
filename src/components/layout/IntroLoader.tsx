"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/utils";
import { useUIStore } from "@/stores";
import { CLIP, Curtain, EXPO_IN_OUT } from "./PageTransition";

/** The board runs by CSS from the first paint: logo 0-0.6s, crossing 0.35-1.35s; the curtain lifts here. */
const LIFT_AT_MS = 1500;

/**
 * First load of a browser session: the curtain is in the server HTML (no flash of content) with
 * the logo settling, the train crossing and the board reading PLATFORM 1 · BOARDING, all by CSS.
 * Once hydrated (and the crossing is done) the curtain lifts (0.6s) as the page soft-lands
 * (scale 1.02 -> 1, opacity 0.6 -> 1, 0.8s, nothing left behind). `setIntroDone()` fires at the
 * lift so the hero's own entrance starts as the curtain clears. It plays on every full page load
 * (client-side navigation uses the page curtain instead); reduced motion skips it entirely.
 */
export function IntroLoader() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const el = ref.current;
    const done = useUIStore.getState().setIntroDone;
    if (!el || prefersReducedMotion()) {
      done();
      const t = window.setTimeout(() => setShow(false), 0);
      return () => window.clearTimeout(t);
    }
    lockScroll();
    // ms since the first paint, read off the logo's CSS animation
    const logo = el.querySelector("[data-curtain-logo]")?.getAnimations()[0];
    const now = document.timeline.currentTime;
    const elapsed = typeof logo?.startTime === "number" && typeof now === "number" ? now - logo.startTime : LIFT_AT_MS;
    const t = window.setTimeout(
      () => {
        unlockScroll();
        done();
        el.animate([{ clipPath: CLIP.covered }, { clipPath: CLIP.lifted }], { duration: 600, easing: EXPO_IN_OUT, fill: "forwards" }).onfinish = () => setShow(false);
        const origin = `50% ${window.innerHeight / 2}px`;
        const wide = window.matchMedia("(min-width: 1024px)").matches;
        document
          .querySelector("main")
          ?.animate(
            wide
              ? [{ transform: "scale(1.02)", opacity: 0.6, transformOrigin: origin }, { transform: "none", opacity: 1, transformOrigin: origin }]
              : [{ opacity: 0.6 }, { opacity: 1 }],
            { duration: 800, easing: "cubic-bezier(0.33, 1, 0.68, 1)" },
          );
      },
      Math.max(0, LIFT_AT_MS - elapsed),
    );
    return () => {
      window.clearTimeout(t);
      unlockScroll();
    };
  }, []);

  if (!show) return null;
  return <Curtain ref={ref} covered led />;
}
