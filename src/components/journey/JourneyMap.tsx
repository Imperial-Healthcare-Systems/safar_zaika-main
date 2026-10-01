"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { clamp, cn, formatClock, prefersReducedMotion } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { EligibleStation } from "@/types";
import { NetworkMap, SignLabel, layoutLabels, projectRoute, signWidth, toScreen } from "./NetworkMap";
import { TrainMarker, pathFractions, placeTrain } from "./TrainMarker";

const availabilityLabel: Record<EligibleStation["availability"], string> = {
  available: "Food available",
  "too-soon": "Too soon to deliver",
  "no-food": "No kitchens yet",
  passed: "Boarding station",
  destination: "Destination",
};

const legend: [string, string][] = [
  ["bg-copper-400", "Delivery"],
  ["bg-leaf-300", "Selected"],
  ["bg-cream-50", "Boarding"],
  ["bg-cream-50/30", "No service"],
];

const TRAIN = 0.9; // marker px per glyph unit

/**
 * Night-mode route map: the shared NetworkMap zoomed to the journey, with
 * signboard station labels and an isometric train that rides the drawn route
 * to whichever station is selected. Mapbox/Google can replace the SVG later;
 * the data shape stays the same.
 */
export function JourneyMap({
  stops,
  boardingIndex,
  selectedCode,
  onSelect,
  className,
}: {
  stops: EligibleStation[];
  boardingIndex: number;
  selectedCode: string | null;
  onSelect?: (code: string) => void;
  className?: string;
}) {
  const points = useMemo(() => projectRoute(stops.map((s) => s.station)), [stops]);
  const pathRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const coarse = useMediaQuery("(pointer: coarse)");

  const fractions = useMemo(() => pathFractions(points), [points]);
  const state = useRef({ p: fractions[boardingIndex] ?? 0 });

  // Ride to the selected station: duration grows with the distance, eased in and out.
  useLayoutEffect(() => {
    const idx = selectedCode ? stops.findIndex((s) => s.station.code === selectedCode) : boardingIndex;
    const target = fractions[idx < 0 ? boardingIndex : idx] ?? 0;
    const st = state.current;
    const root = trainRef.current;
    const place = () => placeTrain(pathRef.current, root, st.p, TRAIN);
    gsap.killTweensOf(st);
    if (prefersReducedMotion() || st.p === target) {
      st.p = target;
      if (root) root.dataset.moving = "false";
      place();
      return;
    }
    if (root) root.dataset.moving = "true";
    const duration = clamp(1.2 + Math.abs(target - st.p) * 1.8, 1.2, 2.4);
    const tween = gsap.to(st, {
      p: target,
      duration,
      ease: "power1.inOut",
      onUpdate: place,
      onComplete: () => {
        if (root) root.dataset.moving = "false";
      },
    });
    return () => {
      tween.kill();
    };
  }, [selectedCode, boardingIndex, fractions, stops]);

  return (
    <div className={cn("relative", className)}>
      <NetworkMap className="absolute inset-0 rounded-3xl border border-cocoa-800" label="Route map" fit={points} route={points} routePathRef={pathRef} draw flow>
        {({ view, size, k }) => {
          const scr = points.map((p) => toScreen(view, size, p));
          const fs = size.w < 480 ? 10 : 11;
          const labels = layoutLabels(
            scr,
            stops.map((s) => signWidth(s.station.name, fs)),
            size,
          );
          const tip = hover !== null && stops[hover] ? { s: stops[hover], p: points[hover], at: scr[hover] } : null;
          return (
            <>
              {points.map((p, i) => {
                const s = stops[i];
                const selected = s.station.code === selectedCode;
                const selectable = s.availability === "available";
                const boarding = i === boardingIndex;
                const dim = !selectable && !boarding && !selected;
                const { right, dy } = labels[i];
                const lx = right ? 16 : -16;
                return (
                  <g
                    key={s.station.code}
                    transform={`translate(${p.x} ${p.y})`}
                    className={cn("group outline-none", selectable && "cursor-pointer", dim && "opacity-60")}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    onClick={() => selectable && onSelect?.(s.station.code)}
                    role={selectable ? "button" : undefined}
                    tabIndex={selectable ? 0 : -1}
                    aria-label={`${s.station.name}: ${availabilityLabel[s.availability]}`}
                    onKeyDown={(e) => {
                      if (selectable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onSelect?.(s.station.code);
                      }
                    }}
                  >
                    <g transform={`scale(${k})`}>
                      {/* fingers: a 44px hit disc around every orderable halt */}
                      {coarse && selectable && <circle r="22" fill="transparent" />}
                      {selected &&
                        [0, 0.6].map((delay) => (
                          <circle key={delay} r="16" className="animate-pulse-ring fill-leaf-500/25 stroke-leaf-300/70" strokeWidth="1" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: `${delay}s` }} />
                        ))}
                      {selectable && !selected && <circle r="15" fill="none" className="stroke-copper-300/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth="1.5" />}
                      <circle
                        r={selected ? 10 : boarding || selectable ? 8 : 5.5}
                        strokeWidth="2.5"
                        className={cn(
                          "transition-[r,fill] duration-300",
                          selected ? "fill-leaf-500 stroke-cream-50" : selectable ? "fill-cocoa-950 stroke-copper-400 group-hover:fill-copper-800" : boarding ? "fill-cream-50 stroke-cocoa-950" : "fill-cocoa-800 stroke-cream-50/40",
                        )}
                      />
                      {selectable && !selected && <circle r="3" className="fill-copper-400" />}
                      {boarding && !selected && <circle r="3" className="fill-cocoa-950" />}
                      {selected && <path d="M-4 0 l3 3 l6 -6" fill="none" className="stroke-cream-50" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
                      {/* invisible bridge between dot and board so the whole label is a target */}
                      <rect x={right ? 0 : -16} y="-12" width="16" height="24" fill="transparent" />
                      <SignLabel text={s.station.name} x={lx} y={dy - 6} size={fs} anchor={right ? "start" : "end"} className={cn(dim && "opacity-70")} />
                      {/* narrow maps keep only the boards; the station cards carry the timings */}
                      {size.w >= 480 && (
                        <text x={lx} y={dy + 15} textAnchor={right ? "start" : "end"} fontSize={fs - 1} letterSpacing="0.1em" className={cn("pointer-events-none font-condensed font-bold uppercase", selectable || selected ? "fill-gold-300" : "fill-cream-50/60")}>
                          {s.stop.arrival ? formatClock(s.stop.arrival) : "Boarding"} · {availabilityLabel[s.availability]}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* cars are positioned by placeTrain (layout effect), never by React */}
              <g ref={trainRef} className="group/train pointer-events-none" data-moving="false">
                <TrainMarker scale={k * TRAIN} />
              </g>

              {tip && (
                <g transform={`translate(${tip.p.x} ${tip.p.y})`} className="pointer-events-none hidden [@media(hover:hover)]:block" role="tooltip">
                  <g transform={`scale(${k}) translate(${clamp(tip.at.x, 112, size.w - 112) - tip.at.x - 104} ${tip.at.y > 136 ? -120 : 22})`}>
                    <rect width="208" height="96" rx="10" className="fill-cocoa-900 stroke-copper-500/60" strokeWidth="1" />
                    <text x="14" y="26" fontSize="13" className="font-sans font-bold fill-cream-50">
                      {tip.s.station.name} <tspan className="fill-cream-50/50">({tip.s.station.code})</tspan>
                    </text>
                    <text x="14" y="50" fontSize="11" letterSpacing="0.08em" className="font-condensed font-semibold uppercase fill-cream-50/65">
                      Arr {formatClock(tip.s.stop.arrival)} · Dep {formatClock(tip.s.stop.departure)} · Halt {tip.s.stop.halt ? `${tip.s.stop.halt} min` : "—"}
                    </text>
                    <text x="14" y="76" fontSize="12" className={cn("font-sans font-bold", tip.s.availability === "available" ? "fill-leaf-300" : "fill-cream-50/60")}>
                      {tip.s.availability === "available" ? `${tip.s.restaurantCount} kitchens ready` : availabilityLabel[tip.s.availability]}
                    </text>
                  </g>
                </g>
              )}
            </>
          );
        }}
      </NetworkMap>

      <div className="pointer-events-none absolute bottom-3 left-3 hidden flex-wrap gap-1.5 sm:flex">
        {legend.map(([dot, text]) => (
          <span key={text} className="led-panel led inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px]">
            <span className={cn("size-1.5 rounded-full", dot)} />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
