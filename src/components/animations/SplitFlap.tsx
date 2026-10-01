"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";

/** Character drum of a split-flap (Solari) board. Order matters: cells spin forward through it. */
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-'&/+";
const MAX_SPIN = 12;
/** ms between ticks of the one shared clock; a board's `speed` can only slow its cells down from this */
const TICK = 60;

/* One gsap.ticker callback drives every spinning board on the page (instead of a setInterval per board). */
type Step = (now: number) => boolean;
const spinning = new Set<Step>();
let lastTick = 0;
const tick = () => {
  const now = performance.now();
  if (now - lastTick < TICK) return;
  lastTick = now;
  spinning.forEach((step) => {
    if (!step(now)) spinning.delete(step);
  });
  if (!spinning.size) gsap.ticker.remove(tick);
};
const start = (step: Step) => {
  if (!spinning.size) gsap.ticker.add(tick);
  spinning.add(step);
};
const cancel = (step: Step) => {
  spinning.delete(step);
  if (!spinning.size) gsap.ticker.remove(tick);
};

export interface SplitFlapProps {
  text: string;
  /** fixed number of cells; defaults to text length. Longer text is cut, shorter is padded */
  length?: number;
  /** ms per character step (never faster than the shared 60ms tick) */
  speed?: number;
  /** ms before the first cell starts */
  delay?: number;
  /** ms between neighbouring cells starting */
  stagger?: number;
  /**
   * "view": blank until scrolled into view, then spins (default). "mount": spins at once when on screen,
   * otherwise just shows its text. "static": never spins. No board ever spins while it is off screen.
   */
  trigger?: "view" | "mount" | "static";
  align?: "left" | "right";
  className?: string;
  cellClassName?: string;
}

/**
 * Railway departure-board text. Each cell spins through the drum until it
 * lands on its character, staggered left to right. Updates to `text` spin
 * again from what the board last showed, like a real board changing a row;
 * off screen the new text is written at once instead. Cells render a constant
 * blank child, so React never rewrites them; every character is written to
 * the DOM by the shared ticker above.
 */
export function SplitFlap({ text, length, speed = 48, delay = 0, stagger = 26, trigger = "view", align = "left", className, cellClassName }: SplitFlapProps) {
  const ref = useRef<HTMLSpanElement>(null);
  /** what the cells show; null until the first reveal (blank drum) */
  const shown = useRef<string | null>(null);
  /** at least 35% on screen per the observer; null until it first reports */
  const visible = useRef<boolean | null>(null);
  /** the current text's actions, for the observer */
  const board = useRef<{ padded: string; reveal: () => void; settle: () => void; spinning: () => boolean } | null>(null);
  const n = length ?? text.length;
  const upper = text.toUpperCase();
  const padded = align === "right" ? upper.slice(-n).padStart(n, " ") : upper.slice(0, n).padEnd(n, " ");

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-cell]"));
    // Each cell renders one constant text node; writing its data changes the character without replacing the node
    // (textContent would remove + insert a node per step: a style recalc and layout each for hundreds of cells).
    const write = (cell: HTMLElement, ch: string) => {
      const t = cell.firstChild;
      if (t && t.nodeType === Node.TEXT_NODE) (t as Text).data = ch;
      else cell.textContent = ch;
    };
    let step: Step | null = null;
    const stop = () => {
      if (step) cancel(step);
      step = null;
      cells.forEach((c) => (c.dataset.flapping = "false"));
    };
    const settle = () => {
      stop();
      cells.forEach((c, i) => write(c, padded[i]));
      shown.current = padded;
    };
    const spin = () => {
      stop();
      if (prefersReducedMotion()) return settle();
      const prev = shown.current;
      shown.current = padded;
      const at0 = performance.now() + delay;
      const plans = cells.map((c, i) => {
        const to = Math.max(0, DRUM.indexOf(padded[i]));
        const from = Math.max(0, DRUM.indexOf(prev?.[i] ?? " "));
        const steps = Math.min(MAX_SPIN, (to - from + DRUM.length) % DRUM.length);
        // Show the previous face until this cell's turn; a blank drum on the first spin.
        write(c, steps ? (prev?.[i] ?? " ") : padded[i]);
        return { pos: (to - steps + DRUM.length) % DRUM.length, steps, at: at0 + i * stagger, done: steps === 0 };
      });
      if (plans.every((p) => p.done)) return;
      step = (now) => {
        let pending = false;
        plans.forEach((p, i) => {
          if (p.done) return;
          pending = true;
          if (now < p.at) return;
          p.at = now + speed;
          p.pos = (p.pos + 1) % DRUM.length;
          p.steps -= 1;
          const cell = cells[i];
          write(cell, DRUM[p.pos]);
          cell.dataset.flapping = "true";
          if (p.steps === 0) {
            p.done = true;
            write(cell, padded[i]);
            cell.dataset.flapping = "false";
          }
        });
        if (!pending) step = null;
        return pending;
      };
      start(step);
    };
    const b = { padded, reveal: trigger === "static" ? settle : spin, settle, spinning: () => step !== null };
    board.current = b;
    // Off screen nothing spins: a view board keeps its blank drum until it enters, any other board just shows the text.
    if (visible.current === true) b.reveal();
    else if (visible.current === false && (shown.current !== null || trigger !== "view")) settle();
    return stop;
  }, [padded, speed, delay, stagger, trigger]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        visible.current = e.isIntersecting;
        const b = board.current;
        if (!b) return;
        if (e.isIntersecting) {
          if (shown.current !== b.padded) b.reveal();
        } else if (b.spinning() || (shown.current === null && trigger !== "view")) {
          // left mid-spin: land at once; a mount/static board that starts off screen shows its text at once
          b.settle();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [trigger]);

  return (
    <span ref={ref} role="img" aria-label={text} className={cn("inline-flex gap-[0.08em] whitespace-nowrap align-middle", className)}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} data-cell data-flapping="false" aria-hidden className={cn("flap-cell", cellClassName)}>
          {" "}
        </span>
      ))}
    </span>
  );
}
