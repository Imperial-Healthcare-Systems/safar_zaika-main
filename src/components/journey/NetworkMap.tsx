"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { corridors, networkPoints } from "@/data/network";
import { projectLatLng, smoothPath, type LatLngBounds, type Point } from "@/lib/svgPath";
import { clamp, cn, prefersReducedMotion } from "@/lib/utils";

/* ------------------------------------------------------------------
   World space: the whole network is projected once into a fixed
   1000x1000 box, so every map (overlay, mini, journey) shares the same
   coordinates and only the camera differs.
------------------------------------------------------------------- */
const WORLD = 1000;

const bounds: LatLngBounds = networkPoints.reduce(
  (b, p) => ({ minLat: Math.min(b.minLat, p.lat), maxLat: Math.max(b.maxLat, p.lat), minLng: Math.min(b.minLng, p.lng), maxLng: Math.max(b.maxLng, p.lng) }),
  { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 },
);

/** lat/lng → world coordinates (same projection as the background network). */
export const projectRoute = (list: { lat: number; lng: number }[]): Point[] => projectLatLng(list, WORLD, WORLD, 40, bounds);

const worldPoints = projectRoute(networkPoints);
const worldById: Record<string, Point> = Object.fromEntries(networkPoints.map((p, i) => [p.id, worldPoints[i]]));
const corridorPath = corridors
  .filter(([a, b]) => worldById[a] && worldById[b])
  .map(([a, b]) => `M${worldById[a].x} ${worldById[a].y}L${worldById[b].x} ${worldById[b].y}`)
  .join("");
// Three interleaved dot paths so they can twinkle out of phase. Zero-length
// subpaths with round caps render as dots whose size ignores the camera zoom.
const dotPaths = [0, 1, 2].map((k) => worldPoints.filter((_, i) => i % 3 === k).map((p) => `M${p.x} ${p.y}h0.01`).join(""));

export interface View {
  cx: number;
  cy: number;
  s: number;
}
export interface Size {
  w: number;
  h: number;
}

/** Camera that frames `points` inside `size`, with `pad` as a fraction of each side (negative = overscan). */
export function fitView(points: Point[], size: Size, pad = 0.12): View {
  const pts = points.length ? points : worldPoints;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const s = clamp(Math.min((size.w * (1 - 2 * pad)) / Math.max(1, maxX - minX), (size.h * (1 - 2 * pad)) / Math.max(1, maxY - minY)), 0.08, 4.5);
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, s };
}

/** World → screen (svg px) for a camera with no rotation. */
export const toScreen = (v: View, size: Size, p: Point): Point => ({ x: size.w / 2 + (p.x - v.cx) * v.s, y: size.h / 2 + (p.y - v.cy) * v.s });

interface Cam extends View {
  /** rotateZ drift in degrees while searching */
  drift: number;
  w: number;
  h: number;
  /** scale the camera is heading to (equals `s` unless mid-flight) */
  ts: number;
}

const camTransform = (c: Cam) => `translate(${c.w / 2} ${c.h / 2}) rotate(${c.drift}) scale(${c.s}) translate(${-c.cx} ${-c.cy})`;
const applyCam = (el: SVGGElement | null, c: Cam) => el?.setAttribute("transform", camTransform(c));

export interface NetworkMapProps {
  mode?: "full" | "mini";
  /** world points to frame; omitted = the whole network */
  fit?: Point[];
  /** padding as a fraction of the box; negative overscans (used under the 3D tilt) */
  fitPad?: number;
  /** world points of the route to draw */
  route?: Point[];
  routePathRef?: RefObject<SVGPathElement | null>;
  /** draw the route in when it appears */
  draw?: boolean;
  drawDelay?: number;
  /** marching dashes along the route */
  flow?: boolean;
  /** slow rotation drift + twinkling dots while searching */
  spin?: boolean;
  flyDuration?: number;
  onFlyComplete?: () => void;
  /** accessible name; omitted = decorative (aria-hidden) */
  label?: string;
  className?: string;
  /** extra world-space content; scale by `k` to keep things screen-sized */
  children?: (ctx: { view: View; size: Size; k: number }) => ReactNode;
}

/**
 * Night-mode rail network: dot grid, radar rings, corridor lines, station
 * dots and an optional glowing route, all under one GSAP-driven camera.
 * No political outline is drawn, on purpose.
 */
export function NetworkMap({ mode = "full", fit, fitPad, route, routePathRef, draw, drawDelay = 0, flow, spin, flyDuration = 1.1, onFlyComplete, label, className, children }: NetworkMapProps) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const dotsRef = useRef<SVGGElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const flowRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState<Size>({ w: 800, h: 600 });
  const target = useMemo(() => fitView(fit ?? worldPoints, size, fitPad ?? (fit ? 0.14 : 0.06)), [fit, fitPad, size]);
  const cam = useRef<Cam>({ ...target, drift: 0, w: size.w, h: size.h, ts: target.s });
  const [initialTransform] = useState(() => camTransform({ ...target, drift: 0, w: size.w, h: size.h, ts: target.s }));
  const prevSize = useRef<Size | null>(null);
  const onDone = useRef(onFlyComplete);
  useEffect(() => {
    onDone.current = onFlyComplete;
  }, [onFlyComplete]);

  // Measure the container: the viewBox is in CSS px so text stays legible at any size.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setSize((s) => (s.w === Math.round(width) && s.h === Math.round(height) ? s : { w: Math.round(width), h: Math.round(height) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rotation drift + twinkle while searching.
  useEffect(() => {
    if (!spin || prefersReducedMotion()) return;
    const c = cam.current;
    const dots = dotsRef.current ? Array.from(dotsRef.current.children) : [];
    const drift = gsap.to(c, { drift: "+=360", duration: 60, repeat: -1, ease: "none", onUpdate: () => applyCam(worldRef.current, c) });
    const twinkle = gsap.to(dots, { opacity: 0.45, duration: 0.8, repeat: -1, yoyo: true, stagger: 0.27, ease: "sine.inOut" });
    return () => {
      drift.kill();
      twinkle.kill();
      gsap.set(dots, { opacity: 1 });
    };
  }, [spin]);

  // Camera: jump on mount/resize, fly when the framing changes.
  useLayoutEffect(() => {
    const c = cam.current;
    const prev = prevSize.current;
    const first = prev === null;
    const resized = prev !== null && (prev.w !== size.w || prev.h !== size.h);
    prevSize.current = size;
    c.w = size.w;
    c.h = size.h;
    c.ts = target.s;
    const to = { cx: target.cx, cy: target.cy, s: target.s, ...(spin ? {} : { drift: Math.round(c.drift / 360) * 360 }) };
    if (first || resized || prefersReducedMotion()) {
      Object.assign(c, to);
      applyCam(worldRef.current, c);
      if (!first && !resized) onDone.current?.();
      return;
    }
    applyCam(worldRef.current, c);
    const fly = gsap.to(c, { ...to, duration: flyDuration, ease: "power3.inOut", onUpdate: () => applyCam(worldRef.current, c), onComplete: () => onDone.current?.() });
    return () => {
      fly.kill();
    };
  }, [target, size, spin, flyDuration]);

  // Route draw-in (dash lengths are screen px because the stroke ignores the camera zoom).
  useEffect(() => {
    const path = routeRef.current;
    if (!draw || !route || !path || prefersReducedMotion()) return;
    const len = path.getTotalLength() * cam.current.ts;
    const els = [path, glowRef.current].filter(Boolean);
    const tween = gsap.fromTo(els, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, delay: drawDelay, ease: "power2.out", clearProps: "strokeDasharray,strokeDashoffset" });
    return () => {
      tween.kill();
    };
  }, [draw, drawDelay, route]);

  // Marching dashes.
  useEffect(() => {
    const el = flowRef.current;
    if (!flow || !route || !el || prefersReducedMotion()) return;
    const fade = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: drawDelay + 0.9 });
    const march = gsap.to(el, { strokeDashoffset: -20, duration: 0.9, repeat: -1, ease: "none" });
    return () => {
      fade.kill();
      march.kill();
    };
  }, [flow, drawDelay, route]);

  const d = useMemo(() => (route ? smoothPath(route) : ""), [route]);
  const { w, h } = size;
  const ringR = Math.hypot(w, h) / 2;
  const mini = mode === "mini";

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden bg-cocoa-950", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full overflow-visible" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        <defs>
          <pattern id={`${id}grid`} width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" className="fill-cream-50/10" />
          </pattern>
        </defs>
        <rect x={-w} y={-h} width={w * 3} height={h * 3} fill={`url(#${id}grid)`} />
        <g fill="none" className="stroke-cream-50/6" strokeWidth="1">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <circle key={f} cx={w / 2} cy={h / 2} r={ringR * f} />
          ))}
        </g>
        <g ref={worldRef} transform={initialTransform}>
          <path d={corridorPath} fill="none" className={mini ? "stroke-cream-50/15" : "stroke-cream-50/25"} strokeWidth="1" strokeDasharray="1 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <g ref={dotsRef} fill="none" className={cn("stroke-cream-50 transition-opacity duration-700", route && "opacity-40")} strokeLinecap="round" strokeWidth={mini ? 2.5 : 5}>
            {dotPaths.map((p, i) => (
              <path key={i} d={p} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          {route && (
            <>
              <path ref={glowRef} d={d} fill="none" className="stroke-copper-500/30" strokeWidth={mini ? 8 : 12} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path
                ref={(el) => {
                  routeRef.current = el;
                  if (routePathRef) routePathRef.current = el;
                }}
                d={d}
                fill="none"
                className="stroke-copper-400"
                strokeWidth={mini ? 2 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {flow && <path ref={flowRef} d={d} fill="none" className="stroke-gold-200/70" strokeWidth="2" strokeDasharray="4 16" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ opacity: 0 }} />}
            </>
          )}
          {children?.({ view: target, size, k: 1 / target.s })}
        </g>
      </svg>
    </div>
  );
}

/** Estimated pixel width of a SignLabel. */
// ponytail: per-character estimate for Barlow Condensed Bold; measure with getComputedTextLength if boards ever get long free text.
export const signWidth = (text: string, size = 11) => Math.round(text.length * size * 0.56 + size * 1.4);

/**
 * Side and vertical nudge for each station board: alternate sides along the
 * route, flip a board that would clip the edge, and push boards that would
 * stack on a same-side neighbour down a row.
 */
export function layoutLabels(scr: Point[], widths: number[], size: Size, gap = 16): { right: boolean; dy: number }[] {
  const out: { right: boolean; dy: number }[] = [];
  scr.forEach((p, i) => {
    let right = i % 2 === 0;
    if (right && p.x + gap + widths[i] > size.w - 4) right = false;
    else if (!right && p.x - gap - widths[i] < 4) right = true;
    let dy = 0;
    for (let j = 0; j < i; j++) {
      if (out[j].right === right && Math.abs(p.x - scr[j].x) < 160 && Math.abs(p.y + dy - (scr[j].y + out[j].dy)) < 36) dy += 36;
    }
    out.push({ right, dy });
  });
  return out;
}

/** Station name board drawn in SVG (same look as the `signboard` utility). Width is estimated from the text. */
export function SignLabel({ text, x = 0, y = 0, anchor = "start", size = 11, className }: { text: string; x?: number; y?: number; anchor?: "start" | "middle" | "end"; size?: number; className?: string }) {
  const t = text.toUpperCase();
  const w = signWidth(t, size);
  const h = Math.round(size * 1.9);
  const left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
  return (
    <g transform={`translate(${left} ${y - h / 2})`} className={className}>
      <rect width={w} height={h} rx="3" className="fill-sign-500" stroke="#1a1208" strokeWidth="2" />
      <rect x="3" y="3" width={w - 6} height={h - 6} rx="1" fill="none" stroke="#1a1208" strokeWidth="1" />
      <text x={w / 2} y={h / 2 + 0.5} textAnchor="middle" dominantBaseline="central" className="font-condensed font-bold" fill="#1a1208" fontSize={size} letterSpacing="0.1em">
        {t}
      </text>
    </g>
  );
}

/** One expanding ring at a world point; re-key it to ping again. */
export function Ping({ x, y, k, delay = 0, className }: { x: number; y: number; k: number; delay?: number; className?: string }) {
  const ref = useRef<SVGCircleElement>(null);
  useGSAP(() => {
    if (!ref.current || prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { scale: 0.3, opacity: 0.9, transformOrigin: "50% 50%" }, { scale: 3.4, opacity: 0, duration: 1, delay, ease: "power2.out" });
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`} className="pointer-events-none">
      <circle ref={ref} r="9" className={cn("fill-copper-400/35 stroke-copper-300", className)} strokeWidth="1.5" style={{ opacity: 0 }} />
    </g>
  );
}
