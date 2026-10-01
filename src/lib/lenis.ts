"use client";

import Lenis from "lenis";

// A single Lenis instance shared by the whole app. Modals call stop()/start(),
// anchors call scrollTo(), and SmoothScrollProvider owns the lifecycle.
let instance: Lenis | null = null;

export function getLenis() {
  return instance;
}

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function lockScroll() {
  instance?.stop();
  document.documentElement.classList.add("lenis-stopped");
}

export function unlockScroll() {
  instance?.start();
  document.documentElement.classList.remove("lenis-stopped");
}

export function scrollToTarget(target: string | HTMLElement | number, offset = -96) {
  if (instance) {
    instance.scrollTo(target, { offset, duration: 1.1 });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (typeof el === "number") window.scrollTo({ top: el, behavior: "smooth" });
  else el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
