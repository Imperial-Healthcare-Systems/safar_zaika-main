import { cn } from "@/lib/utils";

/**
 * Side-view express glyph used by the route lines, loaders and the 404:
 * a locomotive with a raked nose and pantograph pulling three coaches, each
 * on two bogies with two wheels, couplings between the cars, continuous
 * window strips with mullions and door seams.
 * Centred on (0,0), 128 wide x 22 tall, nose pointing right; wheels touch
 * y = 9.2. `fill-current` colours the body, `windowClass` the glass.
 */
const CAR_W = 24;
const GAP = 3;
const COACHES = [-64, -64 + CAR_W + GAP, -64 + 2 * (CAR_W + GAP)]; // left x of each coach
const LOCO_X = -64 + 3 * (CAR_W + GAP); // 17

export function TrainGlyph({ bodyClass, windowClass }: { bodyClass?: string; windowClass?: string }) {
  const body = cn("fill-current", bodyClass);
  const glass = cn("fill-cream-50", windowClass);
  const bogie = (cx: number) => (
    <g key={cx}>
      <rect x={cx - 4.6} y="4.2" width="9.2" height="1.8" rx="0.6" className={body} />
      <circle cx={cx - 2.6} cy="7" r="2.2" className={body} />
      <circle cx={cx + 2.6} cy="7" r="2.2" className={body} />
    </g>
  );
  return (
    <>
      {COACHES.map((x) => (
        <g key={x}>
          {/* roof strip, body, door seams */}
          <rect x={x + 1.5} y="-10" width={CAR_W - 3} height="2.4" rx="1" className={body} />
          <rect x={x} y="-8" width={CAR_W} height="12.5" rx="1.6" className={body} />
          <rect x={x + 2} y="-5.5" width={CAR_W - 4} height="3.6" rx="0.6" className={glass} />
          {[x + 6.5, x + 11, x + 15.5].map((m) => (
            <rect key={m} x={m} y="-5.5" width="1" height="3.6" className={body} />
          ))}
          <rect x={x + 3.2} y="-2" width="0.8" height="6" className={glass} opacity="0.35" />
          <rect x={x + CAR_W - 4} y="-2" width="0.8" height="6" className={glass} opacity="0.35" />
          {/* coupling to the next car */}
          <rect x={x + CAR_W} y="-1" width={GAP} height="2" className={body} />
          {bogie(x + 6)}
          {bogie(x + CAR_W - 6)}
        </g>
      ))}

      {/* locomotive: raised roof, pantograph, long window strip, raked nose with windscreen */}
      <rect x={LOCO_X + 2} y="-10" width="26" height="2.5" rx="1" className={body} />
      <path d={`M${LOCO_X + 12} -10 l4 -3.5 l5 0 l3 3.5`} fill="none" strokeWidth="0.9" strokeLinecap="round" className="stroke-current" />
      <rect x={LOCO_X + 16} y="-14.2" width="6" height="1.1" rx="0.5" className={body} />
      <path d={`M${LOCO_X} -8 H${LOCO_X + 30} C${LOCO_X + 38} -8 ${LOCO_X + 43.5} -5.2 ${LOCO_X + 47} 1.5 V4.5 H${LOCO_X} Z`} className={body} />
      <rect x={LOCO_X + 3} y="-5.5" width="24" height="4" rx="0.6" className={glass} />
      {[LOCO_X + 8, LOCO_X + 13, LOCO_X + 18, LOCO_X + 23].map((m) => (
        <rect key={m} x={m} y="-5.5" width="1" height="4" className={body} />
      ))}
      <path d={`M${LOCO_X + 31} -6 H${LOCO_X + 33.5} C${LOCO_X + 38} -6 ${LOCO_X + 41.2} -3.8 ${LOCO_X + 43.5} -0.4 H${LOCO_X + 31} Z`} className={glass} />
      <circle cx={LOCO_X + 45.3} cy="2.1" r="1.25" className="fill-gold-300" />
      {bogie(LOCO_X + 7)}
      {bogie(LOCO_X + 36)}
    </>
  );
}

export function TrainIcon({ className, title = "Train" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="-66 -16 132 27" className={cn("h-8 w-auto", className)} role="img" aria-label={title}>
      <TrainGlyph />
    </svg>
  );
}
