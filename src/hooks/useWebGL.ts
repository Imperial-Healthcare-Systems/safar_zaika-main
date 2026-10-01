"use client";

import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

function detect() {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    cached = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    cached = false;
  }
  return cached;
}

/** false on the server and on devices without WebGL; the hero falls back to the SVG route. */
export function useWebGL() {
  return useSyncExternalStore(
    () => () => {},
    detect,
    () => false,
  );
}
