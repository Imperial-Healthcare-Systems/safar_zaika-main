"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { TrainGlyph } from "./TrainIcon";
import { smoothPath } from "@/lib/svgPath";

export interface RouteStation {
  label: string;
  sub?: string;
}

export interface RouteLineProps {
  stations: RouteStation[];
  /** 0..1 — controlled progress. Omit for autoplay. */
  progress?: number;
  autoplay?: boolean;
  /** seconds for one full pass in autoplay */
  duration?: number;
  loop?: boolean;
  curved?: boolean;
  labels?: boolean;
  dark?: boolean;
  className?: string;
  onStation?: (index: number) => void;
  /** which station the train should start at in autoplay */
  startIndex?: number;
  /** SVG units; raise it when the component renders narrow */
  labelSize?: number;
}

const W = 1000;
const H = 120;
const PAD = 56;

/**
 * THE SAFAR JOURNEY — the brand's signature interaction.
 * A train travels along a drawn route; stations light up as it passes.
 * Used by the hero fallback, PNR loader, how-it-works, tracking and footer.
 */
export function RouteLine({
  stations,
  progress,
  autoplay = progress === undefined,
  duration = 7,
  loop = true,
  curved = true,
  labels = true,
  dark,
  className,
  onStation,
  startIndex = 0,
  labelSize = 15,
}: RouteLineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const state = useRef({ p: 0, len: 1, lastStation: -1 });
  const onStationRef = useRef(onStation);
  useEffect(() => {
    onStationRef.current = onStation;
  }, [onStation]);

  const points = useMemo(() => {
    const n = Math.max(2, stations.length);
    return Array.from({ length: n }, (_, i) => ({
      x: PAD + (i * (W - PAD * 2)) / (n - 1),
      y: curved ? H / 2 + Math.sin(i * 1.7) * 18 : H / 2,
    }));
  }, [stations.length, curved]);
  const d = useMemo(() => smoothPath(points), [points]);
  const stationT = useMemo(() => points.map((p) => (p.x - PAD) / (W - PAD * 2)), [points]);

  // Apply progress p to DOM (train transform, progress stroke, station classes).
  const render = (p: number) => {
    const path = pathRef.current;
    const train = trainRef.current;
    const prog = progressRef.current;
    const svg = svgRef.current;
    if (!path || !train || !svg) return;
    const len = state.current.len;
    const pt = path.getPointAtLength(p * len);
    const ahead = path.getPointAtLength(Math.min(len, p * len + 2));
    const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
    train.setAttribute("transform", `translate(${pt.x} ${pt.y - 10}) rotate(${angle})`);
    if (prog) prog.style.strokeDashoffset = String(len * (1 - p));
    const dots = svg.querySelectorAll<SVGGElement>("[data-station]");
    let current = -1;
    dots.forEach((dot, i) => {
      const reached = p + 0.002 >= stationT[i];
      dot.dataset.reached = reached ? "true" : "false";
      if (reached) current = i;
    });
    if (current !== state.current.lastStation) {
      state.current.lastStation = current;
      if (current >= 0) onStationRef.current?.(current);
    }
  };

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return;
      state.current.len = path.getTotalLength();
      const prog = progressRef.current;
      if (prog) prog.style.strokeDasharray = String(state.current.len);
      const reduced = prefersReducedMotion();

      if (!autoplay) {
        const target = progress ?? 0;
        state.current.p = target;
        render(target);
        return;
      }
      if (reduced) {
        state.current.p = 1;
        render(1);
        return;
      }
      const seg = duration / Math.max(1, stations.length - 1);
      const tl = gsap.timeline({ repeat: loop ? -1 : 0, repeatDelay: 1.2, defaults: { ease: "power1.inOut" } });
      state.current.p = stationT[startIndex] ?? 0;
      state.current.lastStation = -1;
      render(state.current.p);
      for (let i = startIndex + 1; i < stationT.length; i++) {
        tl.to(state.current, { p: stationT[i], duration: seg, onUpdate: () => render(state.current.p) });
        tl.to({}, { duration: 0.55 });
      }
      if (loop) tl.set(state.current, { p: stationT[startIndex] ?? 0, onComplete: () => render(state.current.p) });
    },
    { scope: svgRef, dependencies: [autoplay, duration, loop, stations.length, startIndex] },
  );

  // Controlled progress updates
  useEffect(() => {
    if (autoplay || progress === undefined) return;
    const reduced = prefersReducedMotion();
    gsap.killTweensOf(state.current);
    if (reduced) {
      state.current.p = progress;
      render(progress);
      return;
    }
    gsap.to(state.current, { p: progress, duration: 1.4, ease: "power2.inOut", onUpdate: () => render(state.current.p) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, autoplay]);

  const stroke = dark ? "stroke-cream-50/20" : "stroke-cocoa-900/15";
  const strokeActive = dark ? "stroke-gold-400" : "stroke-copper-500";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 ${labels ? -4 : 10} ${W} ${labels ? H + 20 + labelSize * 2.4 : H - 20}`}
      className={cn("block w-full overflow-visible", className)}
      role="img"
      aria-label={`Route: ${stations.map((s) => s.label).join(" to ")}`}
    >
      <path ref={pathRef} d={d} fill="none" className={cn(stroke)} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
      <path ref={progressRef} d={d} fill="none" className={cn(strokeActive)} strokeWidth="3.5" strokeLinecap="round" style={{ strokeDashoffset: 9999 }} />
      {points.map((p, i) => (
        <g key={i} data-station data-reached="false" className="group/station" transform={`translate(${p.x} ${p.y})`}>
          <circle r="16" style={{ transformBox: "fill-box", transformOrigin: "center" }} className={cn("fill-copper-500/30 opacity-0 transition-opacity group-data-[reached=true]/station:animate-pulse-ring group-data-[reached=true]/station:opacity-100", dark && "fill-gold-400/30")} />
          <circle r="7" className={cn("transition-[fill,r] duration-500", dark ? "fill-cocoa-900 stroke-cream-50/40" : "fill-cream-50 stroke-cocoa-900/30", "group-data-[reached=true]/station:fill-copper-500 group-data-[reached=true]/station:stroke-copper-500", dark && "group-data-[reached=true]/station:fill-gold-400 group-data-[reached=true]/station:stroke-gold-400")} strokeWidth="2.5" />
          <circle r="2.5" className={cn("fill-cocoa-900/40 transition-colors group-data-[reached=true]/station:fill-cream-50", dark && "fill-cream-50/40 group-data-[reached=true]/station:fill-cocoa-900")} />
          {labels && (
            <>
              <text y={20 + labelSize} textAnchor="middle" style={{ fontSize: labelSize }} className={cn("font-sans font-semibold transition-colors", dark ? "fill-cream-50/70 group-data-[reached=true]/station:fill-cream-50" : "fill-cocoa-700 group-data-[reached=true]/station:fill-cocoa-900")}>
                {stations[i]?.label}
              </text>
              {stations[i]?.sub && (
                <text y={24 + labelSize * 2} textAnchor="middle" style={{ fontSize: labelSize * 0.8 }} className={cn("font-sans font-medium", dark ? "fill-cream-50/45" : "fill-cocoa-500/80")}>
                  {stations[i].sub}
                </text>
              )}
            </>
          )}
        </g>
      ))}
      <g ref={trainRef} className={cn(dark ? "text-cream-50" : "text-cocoa-900")} style={{ transformBox: "fill-box" }}>
        <TrainGlyph windowClass={dark ? "fill-cocoa-900" : "fill-cream-50"} />
      </g>
    </svg>
  );
}
