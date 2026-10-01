"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "@/lib/gsap";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { NetworkMap, Ping, SignLabel, layoutLabels, projectRoute, signWidth, toScreen } from "@/components/journey/NetworkMap";
import { TrainMarker, placeTrain } from "@/components/journey/TrainMarker";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { EligibleStation, Journey, ServiceError, ServiceErrorCode } from "@/types";

const MESSAGES = ["CONTACTING RAILWAY", "MAPPING YOUR ROUTE", "FINDING KITCHENS ON THE WAY", "CHECKING DELIVERY WINDOWS"];
const ERROR_LED: Partial<Record<ServiceErrorCode, string>> = {
  INVALID_PNR: "INVALID PNR",
  NOT_FOUND: "PNR NOT FOUND",
  TRAIN_NOT_FOUND: "TRAIN NOT FOUND",
  SERVICE_UNAVAILABLE: "RAILWAY NOT RESPONDING",
};

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
}

/**
 * Fullscreen PNR discovery sequence: a tilted, slowly turning rail network
 * while the railway is contacted; when the journey resolves the camera flies
 * to the route, stations ping and get their boards, the train runs the line
 * and a ticket stamp lands. Rendered in a top-layer <dialog> via a portal so
 * it sits above any modal that hosted the form.
 */
export function PnrLoading({ found, error, onComplete, onError }: PnrLoadingProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const [msg, setMsg] = useState(0);
  const [stamped, setStamped] = useState(false);
  const callbacks = useRef({ onComplete, onError });
  useEffect(() => {
    callbacks.current = { onComplete, onError };
  }, [onComplete, onError]);

  const route = useMemo(() => (found ? projectRoute(found.stops.map((s) => s.station)) : undefined), [found]);
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

  // (a) fade in from above with the tilt; a radar sweep turns while we search.
  useGSAP(
    () => {
      if (reduced) return;
      gsap.fromTo(tableRef.current, { autoAlpha: 0, rotateX: 72, scale: 1.1 }, { autoAlpha: 1, rotateX: 55, scale: 1, duration: 0.7, ease: "power2.out" });
      gsap.to(sweepRef.current, { rotation: 360, duration: 2.6, repeat: -1, ease: "none" });
    },
    { scope: rootRef },
  );

  // (b)-(d) the camera fly lives in NetworkMap (fit changed); here: un-tilt, boards, train, stamp.
  useGSAP(
    () => {
      if (!found || reduced) return;
      const tl = gsap.timeline();
      tl.to(tableRef.current, { rotateX: 20, duration: 1, ease: "power3.inOut" }, 0);
      tl.to(sweepRef.current, { autoAlpha: 0, duration: 0.5 }, 0.3);
      tl.fromTo("[data-sign]", { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, ease: "back.out(2)" }, 0.8);
      const prog = { p: 0 };
      tl.to(prog, { p: 1, duration: 1, ease: "power2.inOut", onUpdate: () => placeTrain(pathRef.current, trainRef.current, prog.p) }, 0.9);
      tl.call(() => setStamped(true), [], 1.7);
    },
    { scope: rootRef, dependencies: [found] },
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
          <div
            ref={sweepRef}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-[170vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(227,180,97,0.16) 70deg, rgba(227,180,97,0.02) 90deg, transparent 91deg)" }}
          />
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
                  <g ref={trainRef} transform={`translate(${route[0].x} ${route[0].y})`}>
                    <g transform={`scale(${k * 1.2})`}>
                      <TrainMarker />
                    </g>
                  </g>
                </>
              );
            }}
          </NetworkMap>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_45%,rgba(22,10,3,0.9)_100%)]" />
        <div ref={flashRef} aria-hidden className="pointer-events-none absolute inset-0 bg-chili-500 opacity-0" />

        {phase === "stamp" && found && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div ref={stampRef} className="w-full max-w-md drop-shadow-[0_30px_40px_rgba(0,0,0,0.65)]" style={{ transform: "rotate(-6deg)" }}>
              <div className="ticket-edge bg-cream-50 px-7 py-7 text-cocoa-900 sm:px-9">
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
