"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

const SLOP_PX = 8;

/**
 * Spread the returned handlers on a carousel wrapper. A click that ends a
 * drag (pointer travelled more than a few px since pointerdown) is swallowed
 * in the capture phase, before any link or button inside the slides sees it.
 * Swiper re-arms its own click guard on a 0ms timer, which a click dispatched
 * in a later task can slip past; this guard keys off pointer travel instead.
 */
export function useDragGuard() {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  return {
    onPointerDownCapture: (e: PointerEvent<HTMLElement>) => {
      start.current = { x: e.clientX, y: e.clientY };
      moved.current = false;
    },
    onPointerMoveCapture: (e: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (s && !moved.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) > SLOP_PX) moved.current = true;
    },
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (moved.current) {
        e.preventDefault();
        e.stopPropagation();
      }
      moved.current = false;
      start.current = null;
    },
  };
}
