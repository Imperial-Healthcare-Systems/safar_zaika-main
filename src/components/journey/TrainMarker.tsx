import { useId } from "react";
import { clamp } from "@/lib/utils";

/**
 * Put a marker group at fraction `p` of a path: it faces the direction of
 * travel and leans into curves by the path tangent, clamped to +/-25deg so
 * the isometric drawing stays readable. Works in whichever coordinate space
 * the path lives in; scale the inner group yourself.
 */
export function placeTrain(path: SVGPathElement | null, train: SVGGElement | null, p: number) {
  if (!path || !train) return;
  const len = path.getTotalLength();
  const at = clamp(p, 0, 1) * len;
  const pt = path.getPointAtLength(at);
  const a = path.getPointAtLength(Math.min(len, at + 2));
  const b = path.getPointAtLength(Math.max(0, at - 2));
  let angle = (Math.atan2(a.y - b.y, a.x - b.x) * 180) / Math.PI;
  const flip = Math.abs(angle) > 90;
  if (flip) angle = angle > 0 ? angle - 180 : angle + 180;
  train.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${clamp(angle, -25, 25)}) scale(${flip ? -1 : 1} 1)`);
}

const H = 11; // body height
const DX = 4; // depth vector (oblique projection, up-right)
const DY = -2.6;

/** One carriage body: shaded side, lit top, copper end face, window strip, stripe and two bogies. */
function Coach({ x0, x1, side = "fill-cocoa-700", top = "fill-copper-300" }: { x0: number; x1: number; side?: string; top?: string }) {
  const bogie = (cx: number) => (
    <g key={cx}>
      <rect x={cx - 4} y={0} width={8} height={2.2} rx="0.6" className="fill-cocoa-950" />
      <circle cx={cx - 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
      <circle cx={cx + 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
    </g>
  );
  return (
    <>
      {[x0 + 4.5, x1 - 4.5].map(bogie)}
      <path d={`M${x1} 0 L${x1 + DX} ${DY} V${-H + DY} L${x1} ${-H} Z`} className="fill-copper-500" />
      <path d={`M${x0} 0 H${x1} V${-H} H${x0} Z`} className={`${side} stroke-cream-50/15`} strokeWidth="0.5" />
      <path d={`M${x0} ${-H} H${x1} L${x1 + DX} ${-H + DY} H${x0 + DX} Z`} className={top} />
      <rect x={x0 + 2} y={-8.5} width={x1 - x0 - 4} height={3} rx="0.6" className="fill-gold-200" />
      <rect x={x0} y={-3.2} width={x1 - x0} height={1.3} className="fill-copper-400" />
    </>
  );
}

/**
 * Isometric express for the journey map: locomotive + two coaches with a
 * soft shadow and a headlight cone. ~70x40 units centred near the wheel line;
 * place it inside a <g> and rotate/scale that group.
 */
export function TrainMarker({ className }: { className?: string }) {
  const id = useId();
  return (
    <g className={className}>
      <defs>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f0cf8e" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f0cf8e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="3" rx="40" ry="4.5" className="fill-black/30" />
      <ellipse cx="2" cy="2.6" rx="32" ry="2.8" className="fill-black/30" />
      <path d="M34 -4 L64 -15 L64 7 Z" fill={`url(#${id}beam)`} />
      <Coach x0={-36} x1={-16} />
      <Coach x0={-14} x1={6} />
      {/* locomotive with a bevelled nose */}
      {[12.5, 26.5].map((cx) => (
        <g key={cx}>
          <rect x={cx - 4} y={0} width={8} height={2.2} rx="0.6" className="fill-cocoa-950" />
          <circle cx={cx - 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
          <circle cx={cx + 2.2} cy={2.6} r="1.7" className="fill-cocoa-900 stroke-cream-50/25" strokeWidth="0.4" />
        </g>
      ))}
      <path d={`M8 0 H31 L34 -5 L31 ${-H} H8 Z`} className="fill-copper-600 stroke-cream-50/15" strokeWidth="0.5" />
      <path d={`M8 ${-H} H31 L${31 + DX} ${-H + DY} H${8 + DX} Z`} className="fill-copper-200" />
      <path d={`M31 0 L34 -5 L${34 + DX} ${-5 + DY} L${31 + DX} ${DY} Z`} className="fill-copper-500" />
      <path d={`M34 -5 L31 ${-H} L${31 + DX} ${-H + DY} L${34 + DX} ${-5 + DY} Z`} className="fill-gold-300" />
      <rect x="10" y="-8.5" width="9" height="3" rx="0.6" className="fill-gold-200" />
      <rect x="22" y="-8.5" width="6" height="3" rx="0.6" className="fill-gold-200" />
      <rect x="8" y="-3.2" width="23" height="1.3" className="fill-copper-400" />
      <circle cx="33" cy="-3" r="1.3" className="fill-gold-200" />
    </g>
  );
}
