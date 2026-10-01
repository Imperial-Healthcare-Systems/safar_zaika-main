"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once, on the client only. Every component imports gsap from here
// so plugins are guaranteed to be available and nobody re-registers them.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, SplitText, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
  // limitCallbacks: enter/leave callbacks only fire on a real toggle, never for a trigger the scroll jumped past in one tick.
  ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
}

/** Shared motion vocabulary — keep every animation on the same clock. */
export const motion = {
  fast: 0.25,
  base: 0.5,
  slow: 0.9,
  stagger: 0.06,
  ease: "power3.out",
  easeIn: "power2.in",
  easeInOut: "power2.inOut",
  expo: "expo.out",
  spring: "back.out(1.6)",
} as const;

export { gsap, ScrollTrigger, MotionPathPlugin, SplitText, useGSAP };
