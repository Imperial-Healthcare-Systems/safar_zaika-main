"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { NetworkMap, Ping, SignLabel, layoutLabels, projectRoute, signWidth, toScreen } from "@/components/journey/NetworkMap";
import { TrainMarker, pathFractions, placeTrain } from "@/components/journey/TrainMarker";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { smoothPath } from "@/lib/svgPath";
import type { EligibleStation, Journey, ServiceError, ServiceErrorCode } from "@/types";

const MESSAGES = ["CONTACTING RAILWAY", "READING PNR", "MAPPING YOUR ROUTE", "FINDING KITCHENS ON THE WAY"];
const ERROR_LED: Partial<Record<ServiceErrorCode, string>> = {
  INVALID_PNR: "INVALID PNR",
  NOT_FOUND: "PNR NOT FOUND",
  TRAIN_NOT_FOUND: "TRAIN NOT FOUND",
  SERVICE_UNAVAILABLE: "RAILWAY NOT RESPONDING",
};
const TRAIN = 1.2; // marker px per glyph unit
const TRAIL = 150; // glowing trail behind the loco, screen px

export interface PnrFound {
  journey: Journey;
  stops: EligibleStation[];
}

export interface PnrLoadingProps {
  /** set when the service resolved: the camera flies to the route and the stamp lands */
  found?: PnrFound | null;
  /** set when the service failed: red flash, then `onError` */
  error?: ServiceError | null;
  /** the stamp has been held long enough; navigate */
  onComplete?: () => void;
  /** the error flash is over; close the overlay */
  onError?: () => void;
  /** the digits being read; defaults to the PNR field on the page */
  pnr?: string;
}

// ponytail: reads the field until PnrModule passes `pnr`; train mode has no PNR, so the ticket stays hidden there.
const pnrOnPage = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>("#pnr-input"))
    .map((i) => i.value)
    .find((v) => /^\d{10}$/.test(v)) ?? "";

/**
 * Fullscreen PNR discovery sequence: a tilted, slowly turning rail network is
 * scanned (sweeping line, pulses from the centre, the PNR read onto a ticket)
 * while the railway is contacted; when the journey resolves the camera flies
 * to the route, stations ping and get their boards, the train rides the line
 * with a glowing trail and a ticket stamp lands. Rendered in a top-layer
 * <dialog> via a portal so it sits above any modal that hosted the form.
 */
export function PnrLoading({ found, error, onComplete, onError, pnr }: PnrLoadingProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const trailRef = useRef<SVGGElement>(null);
  const [msg, setMsg] = useState(0);
  const [read, setRead] = useState("");
  const [stamped, setStamped] = useState(false);
  const callbacks = useRef({ onComplete, onError });
  useEffect(() => {
    callbacks.current = { onComplete, onError };
  }, [onComplete, onError]);

  const route = useMemo(() => (found ? projectRoute(found.stops.map((s) => s.station)) : undefined), [found]);
  const routeD = useMemo(() => (route ? smoothPath(route) : ""), [route]);
  const phase: "search" | "route" | "stamp" | "error" = error ? "error" : found ? (stamped || reduced ? "stamp" : "route") : "search";

  // Top layer: above any <dialog> that hosts the form (welcome popup, etc.).
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (!d.open) d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);

  useEffect(() => {
    if (phase !== "search") return;
    const t = setInterval(() => setMsg((n) => (n + 1) % MESSAGES.length), 650);
    return () => clearInterval(t);
  }, [phase]);

  // The PNR is read digit by digit onto the ticket.
  useEffect(() => {
    const full = pnr ?? pnrOnPage();
    if (!full) return;
    let n = 0;
    const t = setInterval(() => {
      n += reduced ? full.length : 1;
      setRead(full.slice(0, n));
      if (n >= full.length) clearInterval(t);
    }, 150);
    return () => clearInterval(t);
  }, [pnr, reduced]);

  // (a) fade in from above with the tilt; scan line and pulses while we search.
  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(tableRef.current, { autoAlpha: 0, rotateX: 72, scale: 1.1 }, { autoAlpha: 1, rotateX: 55, scale: 1, duration: 0.7, ease: "power2.out" });
      gsap.fromTo(scanRef.current, { yPercent: -100 }, { yPercent: 0, duration: 2.2, repeat: -1, ease: "none" });
      gsap.fromTo("[data-pulse]", { scale: 0.05, opacity: 0.7 }, { scale: 1, opacity: 0, duration: 2.6, ease: "power1.out", stagger: { each: 0.85, repeat: -1 } });
    },
    { scope: rootRef },
  );

  // (b)-(d) the camera fly lives in NetworkMap (fit changed); here: un-tilt, boards, the ride, stamp.
  useGSAP(
    () => {
      if (!found || !route || reduced) return;
      const fr = pathFractions(route);
      const prog = { p: fr[found.journey.boardingIndex] ?? 0 };
      const end = fr[found.journey.destinationIndex] ?? 1;
      const ride = () => {
        const path = pathRef.current;
        placeTrain(path, trainRef.current, prog.p, TRAIN);
        if (!path || !trailRef.current) return;
        // dash = the stretch of route just behind the loco (world units: the trail stroke does not use non-scaling-stroke)
        const len = path.getTotalLength();
        const ctm = path.getCTM();
        const t = Math.min(len, TRAIL * (ctm ? 1 / Math.hypot(ctm.a, ctm.b) : 1));
        trailRef.current.setAttribute("stroke-dasharray", `${t} ${len}`);
        trailRef.current.setAttribute("stroke-dashoffset", String(t - prog.p * len));
      };
      const tl = gsap.timeline();
      tl.to(tableRef.current, { rotateX: 20, duration: 1, ease: "power3.inOut" }, 0);
      tl.to(fxRef.current, { autoAlpha: 0, duration: 0.5 }, 0.3);
      tl.fromTo("[data-sign]", { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, 0.8);
      // the draw-in (0.55s + 1.1s, power2.out) is past the boarding halt well before the train pulls out
      tl.call(ride, [], 0.9);
      tl.to([trainRef.current, trailRef.current], { autoAlpha: 1, duration: 0.25 }, 0.9);
      tl.to(prog, { p: end, duration: 1.05, ease: "power2.inOut", onUpdate: ride }, 0.95);
      tl.to(trailRef.current, { autoAlpha: 0, duration: 0.35 }, 2);
      tl.call(() => setStamped(true), [], 1.9);
    },
    { scope: rootRef, dependencies: [found, route] },
  );

  useGSAP(
    () => {
      if (phase !== "stamp" || reduced) return;
      gsap.fromTo(stampRef.current, { scale: 1.4, autoAlpha: 0, rotation: -6 }, { scale: 1, autoAlpha: 1, rotation: -6, duration: 0.45, ease: "back.out(2.5)" });
      gsap.fromTo(tableRef.current, { scale: 1 }, { scale: 0.985, duration: 0.12, yoyo: true, repeat: 1, delay: 0.1 });
    },
    { scope: rootRef, dependencies: [phase] },
  );

  useEffect(() => {
    if (phase !== "stamp") return;
    const t = setTimeout(() => callbacks.current.onComplete?.(), 800);
    return () => clearTimeout(t);
  }, [phase]);

  // (e) errors: flash chili, shake, hand back to the card.
  useGSAP(
    () => {
      if (!error) return;
      if (reduced) {
        const t = setTimeout(() => callbacks.current.onError?.(), 500);
        return () => clearTimeout(t);
      }
      const tl = gsap.timeline({ onComplete: () => callbacks.current.onError?.() });
      tl.fromTo(flashRef.current, { autoAlpha: 0 }, { autoAlpha: 0.5, duration: 0.1, yoyo: true, repeat: 3 }, 0);
      tl.fromTo(rootRef.current, { x: -14 }, { x: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" }, 0);
      tl.to({}, { duration: 0.3 });
    },
    { scope: rootRef, dependencies: [error] },
  );

  if (typeof document === "undefined") return null;

  const led = error ? (ERROR_LED[error.code] ?? "SOMETHING WENT WRONG") : phase === "search" ? MESSAGES[msg] : phase === "route" ? "ROUTE LOCKED" : "JOURNEY FOUND";
  const boarding = found?.stops[found.journey.boardingIndex];
  const boardingTime = boarding?.stop.departure ?? boarding?.stop.arrival ?? "";

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label="Checking your journey"
      onCancel={(e) => e.preventDefault()}
      data-lenis-prevent
      className="fixed inset-0 z-transition m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-cocoa-950 p-0 text-cream-50 backdrop:bg-transparent"
    >
      <div ref={rootRef} className="relative h-full w-full" style={{ perspective: "1400px" }}>
        <div ref={tableRef} className="absolute inset-0 will-change-transform">
          {/* search effects, tilted with the table: pulses from the network centre and a scan line */}
          <div ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2">
              {[0, 1, 2].map((i) => (
                <div key={i} data-pulse className="absolute inset-0 rounded-full border-2 border-copper-300 opacity-0 shadow-[0_0_18px_rgba(255,171,104,0.35)]" />
              ))}
            </div>
            <div
              ref={scanRef}
              className="absolute inset-x-0 top-0 h-full border-b border-copper-300 shadow-[0_1px_14px_rgba(255,171,104,0.6)] will-change-transform"
              style={{ background: "linear-gradient(to bottom, transparent 72%, rgba(246,130,42,0.18) 100%)" }}
            />
          </div>
          <NetworkMap className="absolute inset-0 overflow-visible bg-transparent" fit={route} route={route} fitPad={route ? 0.16 : -0.2} spin={!route} draw drawDelay={0.55} flyDuration={1} routePathRef={pathRef}>
            {({ view, size, k }) => {
              if (!route || !found) return null;
              const labels = layoutLabels(
                route.map((p) => toScreen(view, size, p)),
                found.stops.map((s) => signWidth(s.station.name)),
                size,
                14,
              );
              return (
                <>
                  {route.map((p, i) => {
                    const s = found.stops[i];
                    const { right, dy } = labels[i];
                    return (
                      <g key={s.station.code}>
                        <Ping x={p.x} y={p.y} k={k} delay={0.75 + i * 0.07} />
                        <g transform={`translate(${p.x} ${p.y}) scale(${k})`}>
                          <circle r="5" className="fill-cocoa-950 stroke-copper-300" strokeWidth="2" />
                          <g data-sign style={{ opacity: 0 }}>
                            <SignLabel text={s.station.name} x={right ? 14 : -14} y={dy - 14} anchor={right ? "start" : "end"} />
                          </g>
                        </g>
                      </g>
                    );
                  })}
                  {/* glowing trail: the same path, dashed to the stretch behind the loco by `ride` */}
                  <g ref={trailRef} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0 }}>
                    <path d={routeD} className="stroke-gold-300/35" strokeWidth={11 * k} />
                    <path d={routeD} className="stroke-gold-200/90" strokeWidth={3.5 * k} />
                  </g>
                  {/* cars are positioned by placeTrain once the ride starts */}
                  <g ref={trainRef} style={{ opacity: 0 }}>
                    <TrainMarker scale={k * TRAIN} />
                  </g>
                </>
              );
            }}
          </NetworkMap>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_45%,rgba(7,22,52,0.9)_100%)]" />
        <div ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 bg-chili-500 opacity-0" />

        {phase === "stamp" && found && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div ref={stampRef} className="w-full max-w-md drop-shadow-[0_30px_40px_rgba(0,0,0,0.65)]" style={{ transform: "rotate(-6deg)" }}>
              <div className="ticket-edge bg-cream-50 px-7 py-7 text-cocoa-900 max-sm:px-5 sm:px-9">
                <SplitFlap text="JOURNEY FOUND" trigger="mount" className="text-xl sm:text-2xl" />
                <p className="mt-5 font-display text-2xl uppercase leading-none">
                  {found.journey.trainNumber} {found.journey.trainName}
                </p>
                <p className="mt-3 font-condensed text-sm font-semibold uppercase tracking-[0.18em] text-cocoa-600">
                  Boarding {found.journey.from} {boardingTime}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* the PNR being read, on a small ticket above the status line */}
        {read && phase !== "stamp" && (
          <div aria-hidden className="absolute inset-x-0 bottom-24 flex justify-center px-4">
            <div className="ticket-edge flex items-center gap-3 bg-cream-50 px-6 py-2.5 text-cocoa-900 shadow-[0_20px_40px_rgba(0,0,0,0.5)]" style={{ "--n": "7px" } as CSSProperties}>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cocoa-500">PNR</span>
              <SplitFlap text={read} length={10} trigger="mount" className="text-base sm:text-lg" />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-8 flex justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div role="status" aria-live="polite" className="led-panel rounded-md px-4 py-2">
            <span className="led text-sm sm:text-base">{led}</span>
            <span aria-hidden className="led ml-1 animate-blink text-sm sm:text-base">
              _
            </span>
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
