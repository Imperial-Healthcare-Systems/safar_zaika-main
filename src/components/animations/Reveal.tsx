"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * rise: fade up · slide-left / slide-right: enters from that side · zoom: scale up · flip: rotateX
 * from -18deg · tilt: rise with a rotateY that settles · clip / clip-right / clip-up: clip-path wipe
 * from the left / right / bottom · letters: SplitText chars stagger on the heading, the rest rises.
 */
export type RevealVariant = "rise" | "slide-left" | "slide-right" | "zoom" | "flip" | "tilt" | "clip" | "clip-right" | "clip-up" | "letters";

/** Everything an entrance writes inline; cleared on complete so the final state is the natural layout. */
const CLEAR = "opacity,visibility,transform,transformOrigin,clipPath";
const CLIPS: Partial<Record<RevealVariant, string>> = { clip: "0% 100% 0% 0%", "clip-right": "0% 0% 0% 100%", "clip-up": "100% 0% 0% 0%" };
const FROM: Record<Exclude<RevealVariant, "letters" | "clip" | "clip-right" | "clip-up">, (y: number, scale: number) => gsap.TweenVars> = {
  rise: (y) => ({ autoAlpha: 0, y }),
  "slide-left": () => ({ autoAlpha: 0, x: -56 }),
  "slide-right": () => ({ autoAlpha: 0, x: 56 }),
  zoom: (_, scale) => ({ autoAlpha: 0, scale }),
  flip: (y) => ({ autoAlpha: 0, y: y / 2, rotateX: -18, transformPerspective: 900, transformOrigin: "50% 0%" }),
  tilt: (y) => ({ autoAlpha: 0, y, rotateY: 12, transformPerspective: 900 }),
};
const radius = (el: Element) => getComputedStyle(el).borderRadius || "0px";
const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.right > 0 && r.left < window.innerWidth;
};

/**
 * Staggered entrance tween. Items parked off-screen sideways (loop carousels keep slides there) snap to
 * their final state instead, so the visible ones lead the stagger.
 */
export function staggerIn(targets: Element[], vars: gsap.TweenVars, stagger = 0) {
  const seen = targets.filter(onScreen);
  const parked = targets.filter((t) => !seen.includes(t));
  if (parked.length) gsap.set(parked, { clearProps: CLEAR }); // gsap warns on an empty target list
  return gsap.to(seen.length ? seen : targets, { duration: 1, ease: "expo.out", ...vars, stagger, clearProps: CLEAR });
}

type Build = (el: HTMLElement) => (() => gsap.core.Animation) | undefined;

/**
 * One scroll trigger for every entrance choreography: `build` runs once at mount (set the hidden
 * state there) and returns a `play` that creates the animation when the element enters. Skipped
 * entirely under reduced motion, so nothing is ever hidden; an element already past the start on
 * load plays at once; `once: false` reverses it on the way back up.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, build: Build, { start = "top 88%", once = true } = {}) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const play = build(el);
      if (!play) return;
      let anim: gsap.core.Animation | undefined;
      const enter = () => (anim ? anim.play() : (anim = play()));
      const st = ScrollTrigger.create({ trigger: el, start, once, onEnter: enter, onEnterBack: enter, onLeaveBack: once ? undefined : () => anim?.reverse() });
      if (st.progress > 0) enter();
    },
    { scope: ref },
  );
}

/** Heading chars stagger up; its siblings (description, actions) rise behind them. The split is reverted on complete. */
function letters(el: HTMLElement, each: number, delay: number, ease: string): ReturnType<Build> {
  const h = el.querySelector<HTMLElement>("h1,h2,h3") ?? el;
  const rest: Element[] = [];
  for (let n: Element = h; n !== el && n.parentElement; n = n.parentElement) rest.push(...Array.from(n.parentElement.children).filter((c) => c !== n));
  gsap.set(h, { autoAlpha: 0 });
  if (rest.length) gsap.set(rest, { autoAlpha: 0, y: 24 });
  return () => {
    const split = SplitText.create(h, { type: "words,chars" });
    gsap.set(split.chars, { autoAlpha: 0, yPercent: 60 });
    gsap.set(h, { clearProps: "opacity,visibility" });
    const tl = gsap.timeline({ delay, onComplete: () => split.revert() }).to(split.chars, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease, stagger: each });
    if (rest.length) tl.to(rest, { autoAlpha: 1, y: 0, duration: 1, ease, clearProps: CLEAR }, 0.3);
    return tl;
  };
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  /** seconds between items: direct children, or `selector` matches; for "letters" the per-char stagger (default 0.02) */
  stagger?: number;
  /** stagger targets inside the wrapper (e.g. ".swiper-slide"); defaults to direct children */
  selector?: string;
  delay?: number;
  /** rise distance (negative drops from above); flip / tilt use it too */
  y?: number;
  /** zoom start scale */
  scale?: number;
  ease?: string;
  once?: boolean;
  start?: string;
}

/** Scroll-triggered entrance. Below-the-fold content only (hero has its own timeline). */
export function Reveal({ children, className, variant = "rise", stagger, selector, delay = 0, y = 32, scale = 0.9, ease = "expo.out", once = true, start = "top 88%" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(
    ref,
    (el) => {
      if (variant === "letters") return letters(el, stagger ?? 0.02, delay, ease);
      const targets = selector ? Array.from(el.querySelectorAll(selector)) : stagger !== undefined ? Array.from(el.children) : [el];
      const clip = CLIPS[variant];
      if (clip) {
        gsap.set(targets, { clipPath: (_: number, t: Element) => `inset(${clip} round ${radius(t)})` });
        return () => staggerIn(targets, { clipPath: (_: number, t: Element) => `inset(0% 0% 0% 0% round ${radius(t)})`, ease, delay }, stagger);
      }
      gsap.set(targets, FROM[variant as keyof typeof FROM](y, scale));
      return () => staggerIn(targets, { autoAlpha: 1, x: 0, y: 0, scale: 1, rotateX: 0, rotateY: 0, ease, delay }, stagger);
    },
    { start, once },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
