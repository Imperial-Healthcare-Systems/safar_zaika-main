import { useId } from "react";
import type { Point } from "@/lib/svgPath";
import { clamp } from "@/lib/utils";

/** Fraction of a polyline's length at each point (close enough to the smoothed path). */
export function pathFractions(points: Point[]) {
  let total = 0;
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cum.push(total);
  }
  return cum.map((c) => (total ? c / total : 0));
}

/** signed angle difference wrapped to (-180, 180] */
const wrap = (deg: number) => ((deg + 540) % 360) - 180;
const LEAN = 7;

/**
 * Ride a TrainMarker along a path: the loco sits at fraction `p`, every
 * `[data-car]` behind it is sampled `data-car` glyph units further back along
 * the arc, so the set bends through curves. Each car faces its own tangent
 * (mirrored when heading left so the roof stays up) with a slight lean into
 * the bend ahead. `size` is the marker's screen px per glyph unit; the path's
 * CTM converts it to path units, so this works under any camera. Beyond the
 * path ends the cars continue straight along the end tangent.
 */
export function placeTrain(path: SVGPathElement | null, root: SVGGElement | null, p: number, size = 1) {
  if (!path || !root) return;
  const len = path.getTotalLength();
  const ctm = path.getCTM();
  const unit = size * (ctm ? 1 / Math.hypot(ctm.a, ctm.b) : 1);
  const sample = (at: number): Point => {
    if (at >= 0 && at <= len) return path.getPointAtLength(at);
    const edge = at < 0 ? 0 : len;
    const e = path.getPointAtLength(edge);
    const n = path.getPointAtLength(at < 0 ? Math.min(len, 2) : Math.max(0, len - 2));
    const d = Math.hypot(e.x - n.x, e.y - n.y) || 1;
    const over = at < 0 ? -at : at - len;
    return { x: e.x + ((e.x - n.x) / d) * over, y: e.y + ((e.y - n.y) / d) * over };
  };
  const heading = (at: number) => {
    const a = sample(at + 2);
    const b = sample(at - 2);
    return (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI;
  };
  const head = clamp(p, 0, 1) * len;
  root.querySelectorAll<SVGGElement>("[data-car]").forEach((car) => {
    const at = head - Number(car.dataset.car) * unit;
    const pt = sample(at);
    const tangent = heading(at);
    let angle = wrap(tangent + clamp(wrap(heading(at + 16 * unit) - tangent) * 0.4, -LEAN, LEAN));
    const flip = Math.abs(angle) > 90;
    if (flip) angle = angle > 0 ? angle - 180 : angle + 180;
    car.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${angle}) scale(${flip ? -1 : 1} 1)`);
  });
}

const H = 11; // body height
const DX = 4; // depth vector (oblique projection, up-right)
const DY = -2.6;

function bogie(cx: number) {
  return (
    <g key={cx}>
      <rect x={cx - 4} y={0} width={8} height={2.2} rx="0.6" className="fill-cocoa-950" />
      <circle cx={cx - 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
      <circle cx={cx + 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
    </g>
  );
}

/** One carriage centred on x=0: shaded side, lit top, copper end face, window strip, stripe and two bogies. */
function Coach({ x0 = -11, x1 = 11 }: { x0?: number; x1?: number }) {
  return (
    <>
      <ellipse cx="0" cy="3" rx={x1 - x0 + 3} ry="3" className="fill-black/30" />
      {[x0 + 4.5, x1 - 4.5].map(bogie)}
      <path d={`M${x1} 0 L${x1 + DX} ${DY} V${-H + DY} L${x1} ${-H} Z`} className="fill-copper-500" />
      <path d={`M${x0} 0 H${x1} V${-H} H${x0} Z`} className="fill-cocoa-700 stroke-cream-50/15" strokeWidth="0.5" />
      <path d={`M${x0} ${-H} H${x1} L${x1 + DX} ${-H + DY} H${x0 + DX} Z`} className="fill-copper-300" />
      <rect x={x0 + 2} y={-8.5} width={x1 - x0 - 4} height={3} rx="0.6" className="fill-gold-200" />
      <rect x={x0} y={-3.2} width={x1 - x0} height={1.3} className="fill-copper-400" />
    </>
  );
}

/**
 * Isometric express for the journey map: a locomotive and two coaches, each
 * its own `[data-car]` group (value = glyph units behind the loco) so
 * `placeTrain` can thread them along a path. `scale` is screen px per glyph
 * unit times the map's `k`. The trailing coach carries a motion streak that
 * shows while the nearest `group/train` ancestor has `data-moving="true"`.
 */
export function TrainMarker({ scale = 1, className }: { scale?: number; className?: string }) {
  const id = useId();
  const streak = "opacity-0 transition-opacity duration-500 group-data-[moving=true]/train:opacity-100";
  return (
    <g className={className}>
      <defs>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb457" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffb457" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}streak`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb457" stopOpacity="0" />
          <stop offset="1" stopColor="#ffb457" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <g data-car="52">
        <g transform={`scale(${scale})`}>
          <rect x="-46" y="-9" width="34" height="7" fill={`url(#${id}streak)`} className={streak} />
          <Coach />
        </g>
      </g>
      <g data-car="26">
        <g transform={`scale(${scale})`}>
          <Coach />
        </g>
      </g>
      <g data-car="0">
        <g transform={`scale(${scale})`}>
          <ellipse cx="0" cy="3" rx="16" ry="3" className="fill-black/30" />
          <path d="M13 -4 L43 -15 L43 7 Z" fill={`url(#${id}beam)`} />
          {[-8.5, 5.5].map(bogie)}
          {/* locomotive with a bevelled nose */}
          <path d={`M-13 0 H10 L13 -5 L10 ${-H} H-13 Z`} className="fill-copper-600 stroke-cream-50/15" strokeWidth="0.5" />
          <path d={`M-13 ${-H} H10 L${10 + DX} ${-H + DY} H${-13 + DX} Z`} className="fill-copper-200" />
          <path d={`M10 0 L13 -5 L${13 + DX} ${-5 + DY} L${10 + DX} ${DY} Z`} className="fill-copper-500" />
          <path d={`M13 -5 L10 ${-H} L${10 + DX} ${-H + DY} L${13 + DX} ${-5 + DY} Z`} className="fill-gold-300" />
          <rect x="-11" y="-8.5" width="9" height="3" rx="0.6" className="fill-gold-200" />
          <rect x="1" y="-8.5" width="6" height="3" rx="0.6" className="fill-gold-200" />
          <rect x="-13" y="-3.2" width="23" height="1.3" className="fill-copper-400" />
          <circle cx="12" cy="-3" r="1.3" className="fill-gold-200" />
        </g>
      </g>
    </g>
  );
}
