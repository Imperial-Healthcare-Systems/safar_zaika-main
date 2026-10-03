"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { NetworkMap, Ping, StationLabel, labelWidth, layoutLabels, projectRoute, toScreen } from "@/components/journey/NetworkMap";
import { TrainMarker, pathFractions, placeTrain } from "@/components/journey/TrainMarker";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { smoothPath } from "@/lib/svgPath";
import { cn, formatClock } from "@/lib/utils";
import type { EligibleStation, Journey, ServiceError, ServiceErrorCode } from "@/types";

const MESSAGES = ["Contacting the railway", "Reading your PNR", "Mapping your route", "Finding kitchens on the way"];
const ERROR_TEXT: Partial<Record<ServiceErrorCode, string>> = {
  INVALID_PNR: "That PNR is not valid",
  NOT_FOUND: "PNR not found",
  TRAIN_NOT_FOUND: "Train not found",
  SERVICE_UNAVAILABLE: "The railway is not responding",
};
const PNR_LENGTH = 10;
const LABEL = 13; // station label text size, px (the tilted table shrinks it a little)
const TRAIN = 1.2; // marker px per glyph unit
const TRAIL = 150; // glowing trail behind the loco, screen px

export interface PnrFound {
  journey: Journey;
  stops: EligibleStation[];
}

export interface PnrLoadingProps {
  /** set when the service resolved: the camera flies to the route and the result card lands */
  found?: PnrFound | null;
  /** set when the service failed: red flash, then `onError` */
  error?: ServiceError | null;
  /** the result card has been held long enough; navigate */
  onComplete?: () => void;
  /** the error flash is over; close the overlay */
  onError?: () => void;
  /** the digits being read; defaults to the PNR field on the page */
  pnr?: string;
}

// ponytail: reads the field until PnrModule passes `pnr`; train mode has no PNR, so the PNR card stays hidden there.
const pnrOnPage = () =>
  Array.from(document.querySelectorAll<HTMLInputElement>("#pnr-input"))
    .map((i) => i.value)
    .find((v) => /^\d{10}$/.test(v)) ?? "";

/**
 * Fullscreen PNR discovery sequence: a tilted, slowly turning rail network is
 * scanned (a soft sweep, pulses from the centre, the PNR filling in on a card)
 * while the railway is contacted; when the journey resolves the camera flies
 * to the route, stations ping and get their names, the train rides the line
 * with a glowing trail and a result card scales in. Rendered in a top-layer
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
  const resultRef = useRef<HTMLDivElement>(null);
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

  // The PNR is read digit by digit onto its card.
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

  // (a) fade in from above with the tilt; a soft sweep and pulses while we search.
  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(tableRef.current, { autoAlpha: 0, rotateX: 72, scale: 1.1 }, { autoAlpha: 1, rotateX: 55, scale: 1, duration: 0.7, ease: "power2.out" });
      gsap.fromTo(scanRef.current, { yPercent: -100 }, { yPercent: 0, duration: 2.2, repeat: -1, ease: "none" });
      gsap.fromTo("[data-pulse]", { scale: 0.05, opacity: 0.6 }, { scale: 1, opacity: 0, duration: 2.6, ease: "power1.out", stagger: { each: 0.85, repeat: -1 } });
    },
    { scope: rootRef },
  );

  // (b)-(d) the camera fly lives in NetworkMap (fit changed); here: un-tilt, station names, the ride, the result.
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
      tl.fromTo("[data-label]", { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.07, ease: "power3.out" }, 0.8);
      // the draw-in (0.55s + 1.1s, power2.out) is past the boarding halt well before the train pulls out
      tl.call(ride, [], 0.9);
      tl.to([trainRef.current, trailRef.current], { autoAlpha: 1, duration: 0.25 }, 0.9);
      tl.to(prog, { p: end, duration: 1.05, ease: "power2.inOut", onUpdate: ride }, 0.95);
      tl.to(trailRef.current, { autoAlpha: 0, duration: 0.35 }, 2);
      tl.call(() => setStamped(true), [], 1.9);
    },
    { scope: rootRef, dependencies: [found, route] },
  );

  // The result card scales in softly.
  useGSAP(
    () => {
      if (phase !== "stamp" || reduced) return;
      gsap.fromTo(resultRef.current, { scale: 0.94, y: 14, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" });
    },
    { scope: rootRef, dependencies: [phase] },
  );

  useEffect(() => {
    if (phase !== "stamp") return;
    const t = setTimeout(() => callbacks.current.onComplete?.(), 800);
    return () => clearTimeout(t);
  }, [phase]);

  // (e) errors: a brief red wash and a small shake, then hand back to the card.
  useGSAP(
    () => {
      if (!error) return;
      if (reduced) {
        const t = setTimeout(() => callbacks.current.onError?.(), 500);
        return () => clearTimeout(t);
      }
      const tl = gsap.timeline({ onComplete: () => callbacks.current.onError?.() });
      tl.fromTo(flashRef.current, { autoAlpha: 0 }, { autoAlpha: 0.35, duration: 0.1, yoyo: true, repeat: 3 }, 0);
      tl.fromTo(rootRef.current, { x: -14 }, { x: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" }, 0);
      tl.to({}, { duration: 0.3 });
    },
    { scope: rootRef, dependencies: [error] },
  );

  if (typeof document === "undefined") return null;

  // train and station lookups have no PNR to read, so that line is skipped there
  const messages = read ? MESSAGES : MESSAGES.filter((m) => m !== "Reading your PNR");
  const statusText = error ? (ERROR_TEXT[error.code] ?? "Something went wrong") : phase === "search" ? messages[msg % messages.length] : phase === "route" ? "Route found" : "Taking you to your stations";
  const boarding = found?.stops[found.journey.boardingIndex];
  const boardingTime = boarding?.stop.departure ?? boarding?.stop.arrival ?? null;

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
          {/* search effects, tilted with the table: pulses from the network centre and a soft sweep */}
          <div ref={fxRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2">
              {[0, 1, 2].map((i) => (
                <div key={i} data-pulse className="absolute inset-0 rounded-full border border-rail-300/70 opacity-0" />
              ))}
            </div>
            <div ref={scanRef} className="absolute inset-x-0 top-0 h-full border-b border-rail-300/50 will-change-transform" style={{ background: "linear-gradient(to bottom, transparent 72%, rgba(91,143,240,0.14) 100%)" }} />
          </div>
          <NetworkMap className="absolute inset-0 overflow-visible bg-transparent" fit={route} route={route} fitPad={route ? 0.16 : -0.2} spin={!route} draw drawDelay={0.55} flyDuration={1} routePathRef={pathRef}>
            {({ view, size, k }) => {
              if (!route || !found) return null;
              const labels = layoutLabels(
                route.map((p) => toScreen(view, size, p)),
                found.stops.map((s) => labelWidth(s.station.name, LABEL)),
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
                          <g data-label style={{ opacity: 0 }}>
                            <StationLabel text={s.station.name} size={LABEL} x={right ? 14 : -14} y={dy - 14} anchor={right ? "start" : "end"} />
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
            <div ref={resultRef} className="w-full max-w-sm rounded-3xl bg-white px-6 py-7 text-center text-cocoa-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)] sm:px-8 sm:py-8">
              <span aria-hidden className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
                <Check className="size-7" strokeWidth={3} />
              </span>
              <p className="mt-4 font-display text-3xl">Journey found</p>
              <p className="mt-3 text-lg font-bold leading-snug">
                {found.journey.trainNumber} {found.journey.trainName}
              </p>
              <p className="mt-1 text-sm text-muted">
                Boarding at {boarding?.station.name ?? found.journey.from}
                {boardingTime && ` · ${formatClock(boardingTime)}`}
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* the PNR being read, on a small card above the status row; it steps aside once the route takes the stage */}
          {read && (phase === "search" || phase === "error") && (
            <div aria-hidden className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-cocoa-900 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
              <span className="text-xs font-semibold text-muted">PNR</span>
              <span className="font-display text-xl tabular-nums sm:text-2xl">
                {Array.from({ length: Math.max(PNR_LENGTH, read.length) }, (_, i) => (
                  <span key={i} className={cn("inline-block w-[0.85em] text-center", i >= read.length && "text-cocoa-300")}>
                    {read[i] ?? "•"}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div role="status" aria-live="polite" className="inline-flex items-center gap-2.5 rounded-full border border-cream-50/15 bg-cocoa-900/90 px-4 py-2.5 text-sm font-semibold sm:text-[15px]">
            {error ? (
              <AlertCircle className="size-4 shrink-0 text-chili-500" aria-hidden />
            ) : phase === "stamp" ? (
              <Check className="size-4 shrink-0 text-leaf-300" strokeWidth={3} aria-hidden />
            ) : (
              <Loader2 className="size-4 shrink-0 animate-spin text-copper-400" aria-hidden />
            )}
            {phase === "stamp" && <span className="sr-only">Journey found.</span>}
            {statusText}
          </div>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
