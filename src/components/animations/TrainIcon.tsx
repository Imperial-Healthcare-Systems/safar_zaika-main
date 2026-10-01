import { cn } from "@/lib/utils";

/**
 * Side-view express glyph used across loaders, the route line and the footer:
 * streamlined loco nose, one coach with a window strip, four-wheel bogies,
 * headlight and roof line. Render inside an <svg> or a <g>.
 * Geometry is centred on (0,0) and ~48 wide x 24 tall; the nose points right.
 */
export function TrainGlyph({ bodyClass, windowClass }: { bodyClass?: string; windowClass?: string }) {
  const body = cn("fill-current", bodyClass);
  const glass = cn("fill-cream-50", windowClass);
  const bogie = (cx: number) => (
    <g key={cx}>
      <rect x={cx - 4} y="5" width="8" height="2" rx="0.8" className={body} />
      <circle cx={cx - 2.3} cy="8.6" r="2.1" className={body} />
      <circle cx={cx + 2.3} cy="8.6" r="2.1" className={body} />
    </g>
  );
  return (
    <>
      {/* roof line */}
      <rect x="-22" y="-11" width="32" height="2.2" rx="1.1" className={body} />
      {/* coach */}
      <rect x="-24" y="-9" width="19" height="14" rx="2" className={body} />
      <rect x="-22" y="-6" width="15" height="4" rx="1" className={glass} />
      {/* coupling */}
      <rect x="-5.5" y="-1" width="3" height="2" className={body} />
      {/* locomotive with a streamlined nose */}
      <path d="M-3 -9 H11 C18 -9 22 -6 24 1 V5 H-3 Z" className={body} />
      <rect x="-1" y="-6" width="7" height="4" rx="1" className={glass} />
      <path d="M10 -7 H14 C17 -7 19 -5 20 -2 H10 Z" className={glass} />
      <circle cx="21.5" cy="2.5" r="1.4" className="fill-gold-300" />
      {/* bogies */}
      {[-19, -10, 1, 17].map(bogie)}
    </>
  );
}

export function TrainIcon({ className, title = "Train" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="-26 -16 52 30" className={cn("size-8", className)} role="img" aria-label={title}>
      <TrainGlyph />
    </svg>
  );
}
