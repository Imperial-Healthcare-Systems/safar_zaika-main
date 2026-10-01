"use client";

import { useEffect, useRef } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";

/** Character drum of a split-flap (Solari) board. Order matters: cells spin forward through it. */
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-'&/+";
const MAX_SPIN = 12;

export interface SplitFlapProps {
  text: string;
  /** fixed number of cells; defaults to text length. Longer text is cut, shorter is padded */
  length?: number;
  /** ms per character step */
  speed?: number;
  /** ms before the first cell starts */
  delay?: number;
  /** ms between neighbouring cells starting */
  stagger?: number;
  /** "view": spin when scrolled into view (default). "mount": spin immediately. */
  trigger?: "view" | "mount";
  align?: "left" | "right";
  className?: string;
  cellClassName?: string;
}

/**
 * Railway departure-board text. Each cell spins through the drum until it
 * lands on its character, staggered left to right. Updates to `text` spin
 * again from what the board last showed, like a real board changing a row.
 * Cells render a constant blank child, so React never rewrites them; every
 * character is written to the DOM by the ticker below.
 */
export function SplitFlap({ text, length, speed = 48, delay = 0, stagger = 26, trigger = "view", align = "left", className, cellClassName }: SplitFlapProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const armed = useRef(trigger === "mount");
  /** what the board last settled on; null until the first spin (blank drum) */
  const shown = useRef<string[] | null>(null);
  const n = length ?? text.length;
  const upper = text.toUpperCase();
  const target = (align === "right" ? upper.slice(-n).padStart(n, " ") : upper.slice(0, n).padEnd(n, " ")).split("");

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-cell]"));
    const stop = () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
      cells.forEach((c) => (c.dataset.flapping = "false"));
    };
    const settle = () => {
      stop();
      cells.forEach((c, i) => (c.textContent = target[i] ?? " "));
      shown.current = target;
    };

    const spin = () => {
      stop();
      if (prefersReducedMotion()) {
        settle();
        return;
      }
      const prev = shown.current;
      shown.current = target;
      const start = performance.now() + delay;
      const plans = cells.map((c, i) => {
        const to = Math.max(0, DRUM.indexOf(target[i] ?? " "));
        const from = Math.max(0, DRUM.indexOf(prev?.[i] ?? " "));
        let steps = (to - from + DRUM.length) % DRUM.length;
        if (steps > MAX_SPIN) steps = MAX_SPIN;
        // Show the previous face until this cell's turn; a blank drum on the first spin.
        c.textContent = prev?.[i] ?? " ";
        return { pos: (to - steps + DRUM.length) % DRUM.length, steps, at: start + i * stagger, done: steps === 0 };
      });
      plans.forEach((p, i) => {
        if (p.done) cells[i].textContent = target[i] ?? " ";
      });
      if (plans.every((p) => p.done)) return;
      timer.current = window.setInterval(() => {
        const now = performance.now();
        let pending = false;
        plans.forEach((p, i) => {
          if (p.done) return;
          pending = true;
          if (now < p.at) return;
          const cell = cells[i];
          p.pos = (p.pos + 1) % DRUM.length;
          p.steps -= 1;
          cell.textContent = DRUM[p.pos];
          cell.dataset.flapping = "true";
          if (p.steps === 0) {
            p.done = true;
            cell.textContent = target[i] ?? " ";
            cell.dataset.flapping = "false";
          }
        });
        if (!pending) stop();
      }, speed);
    };

    if (armed.current) {
      spin();
      return stop;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          armed.current = true;
          io.disconnect();
          spin();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      stop();
    };
    // `target` is derived from text/length/align, which are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upper, n, align, speed, delay, stagger]);

  return (
    <span ref={ref} role="img" aria-label={text} className={cn("inline-flex gap-[0.08em] whitespace-nowrap align-middle", className)}>
      {target.map((_, i) => (
        <span key={i} data-cell data-flapping="false" aria-hidden className={cn("flap-cell", cellClassName)}>
          {" "}
        </span>
      ))}
    </span>
  );
}
