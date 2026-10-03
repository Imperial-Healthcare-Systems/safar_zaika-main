"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Hash, Ticket } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Button, Input, Select, Tabs } from "@/components/ui";
import { computeEligibleStations, getJourneyByTrain, getPNRJourney, PNR_REGEX, searchTrains } from "@/services";
import { useJourneyStore } from "@/stores";
import { getStation } from "@/data/stations";
import { NetworkMap, Ping, projectRoute } from "@/components/journey/NetworkMap";
import type { ServiceError, Train } from "@/types";
import { PnrLoading, type PnrFound } from "./PnrLoading";

type Mode = "pnr" | "train";
type Status = "idle" | "loading" | "error" | "success";

const DEMO_PNR = "1234567890";

const routeOf = (train: Train) =>
  projectRoute(
    train.stops.flatMap((s) => {
      const st = getStation(s.stationCode);
      return st ? [st] : [];
    }),
  );

function DigitTicks({ filled, dark }: { filled: number; dark?: boolean }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-[background-color,transform] duration-300",
            i < filled ? "scale-y-125 bg-copper-500" : dark ? "bg-cream-50/15" : "bg-cocoa-900/10",
          )}
          style={{ transitionDelay: `${i * 20}ms` }}
        />
      ))}
    </div>
  );
}

export interface PnrModuleProps {
  dark?: boolean;
  defaultMode?: Mode;
  className?: string;
  /** hide the heading when the parent already provides one */
  bare?: boolean;
}

export function PnrModule({ dark, defaultMode = "pnr", className, bare }: PnrModuleProps) {
  const router = useRouter();
  const setJourney = useJourneyStore((s) => s.setJourney);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seq, setSeq] = useState<{ found?: PnrFound; error?: ServiceError } | null>(null);
  const [pnr, setPnr] = useState("");
  const [foundLabel, setFoundLabel] = useState("");
  const [trainQuery, setTrainQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Train[]>([]);
  const [train, setTrain] = useState<Train | null>(null);
  const [boarding, setBoarding] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastHeight = useRef<number | null>(null);

  // Mode/status switches change the card's height: tween it so the layout around the card never jumps.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const prev = lastHeight.current;
    const next = el.offsetHeight;
    lastHeight.current = next;
    if (prev === null || prev === next || prefersReducedMotion()) return;
    gsap.fromTo(
      el,
      { height: prev },
      {
        height: next,
        duration: 0.45,
        ease: "power3.out",
        overwrite: true,
        onStart: () => {
          el.style.overflow = "hidden";
        },
        onComplete: () => {
          el.style.overflow = "";
          el.style.height = "";
        },
      },
    );
  }, [mode, status, train]);

  useEffect(() => {
    if (train && trainQuery === `${train.number} ${train.name}`) return;
    let alive = true;
    const t = setTimeout(async () => {
      const list = await searchTrains(trainQuery);
      if (alive) setSuggestions(list);
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [trainQuery, train]);

  // Mini map: the picked train's route, or the first suggestion's stations while typing.
  const routePts = useMemo(() => (train ? routeOf(train) : undefined), [train]);
  const hintPts = useMemo(() => (!train && trainQuery && suggestions[0] ? routeOf(suggestions[0]) : []), [train, trainQuery, suggestions]);
  const boardingPt = useMemo(() => {
    const st = train && boarding ? getStation(boarding) : undefined;
    return st ? projectRoute([st])[0] : null;
  }, [train, boarding]);

  const shake = () => {
    if (prefersReducedMotion() || !cardRef.current) return;
    gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
  };

  const fail = (message: string, service?: ServiceError) => {
    setError(message);
    setStatus("error");
    if (service) setSeq({ error: service });
    else shake();
  };

  const succeed = (found: PnrFound) => {
    setJourney(found.journey);
    setFoundLabel(`${found.journey.trainNumber} ${found.journey.trainName}`);
    setStatus("success");
    setSeq({ found });
  };

  const submitPnr = async () => {
    setError(null);
    if (!PNR_REGEX.test(pnr)) return fail("That PNR doesn't look right. It should be exactly 10 digits.");
    setStatus("loading");
    setSeq({});
    const res = await getPNRJourney(pnr);
    if (!res.ok) return fail(res.error.message, res.error);
    succeed({ journey: res.data, stops: computeEligibleStations(res.data) });
  };

  const submitTrain = async () => {
    setError(null);
    if (!train) return fail("Pick a train from the suggestions.");
    if (!boarding) return fail("Choose your boarding station.");
    setStatus("loading");
    setSeq({});
    const res = await getJourneyByTrain({ trainNumber: train.number, date, boardingCode: boarding });
    if (!res.ok) return fail(res.error.message, res.error);
    succeed({ journey: res.data, stops: computeEligibleStations(res.data) });
  };

  const boardingOptions = train ? train.stops.slice(0, -1).map((s) => ({ value: s.stationCode, label: `${getStation(s.stationCode)?.name ?? s.stationCode} (${s.stationCode})` })) : [];
  const switchMode = (m: Mode) => {
    setMode(m);
    setStatus("idle");
    setError(null);
  };
  const errorBox = status === "error" && error && (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-chili-500/30 bg-chili-50 px-3 py-2.5 text-[13px] font-medium text-chili-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {error}
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 sm:p-6 max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base",
        dark ? "glass text-cream-50 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]" : "border border-line bg-white text-cocoa-900 shadow-card",
        className,
      )}
    >
      {seq && (
        <PnrLoading
          pnr={mode === "pnr" ? pnr : undefined}
          found={seq.found}
          error={seq.error}
          onComplete={() => router.push("/journey")}
          onError={() => {
            setSeq(null);
            shake();
          }}
        />
      )}
      <div ref={bodyRef}>

      {!bare && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Where&apos;s your train headed?</h2>
          <Tabs<Mode>
            dark={dark}
            value={mode}
            onChange={switchMode}
            items={[
              { value: "pnr", label: "PNR", icon: <Ticket className="size-3.5" /> },
              { value: "train", label: "Train", icon: <Hash className="size-3.5" /> },
            ]}
          />
        </div>
      )}
      {bare && (
        <Tabs<Mode>
          dark={dark}
          full
          className="mb-5"
          value={mode}
          onChange={switchMode}
          items={[
            { value: "pnr", label: "Order with PNR", icon: <Ticket className="size-3.5" /> },
            { value: "train", label: "Order by train", icon: <Hash className="size-3.5" /> },
          ]}
        />
      )}

      {status === "success" && (
        <div className="flex flex-col items-center py-6 text-center" role="status">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="mt-4 font-display text-xl">Journey found</p>
          <p className={cn("mt-1 text-sm", dark ? "text-cream-50/70" : "text-muted")}>{foundLabel}</p>
          <p className={cn("mt-3 text-xs", dark ? "text-cream-50/50" : "text-muted")}>Opening your route…</p>
        </div>
      )}

      {status !== "success" && mode === "pnr" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitPnr();
          }}
        >
          <div>
            <label htmlFor="pnr-input" className={cn("text-[13px] font-semibold", dark ? "text-cream-50/80" : "text-cocoa-800")}>
              10-digit PNR number
            </label>
            <input
              id="pnr-input"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              value={pnr}
              onChange={(e) => {
                setPnr(e.target.value.replace(/\D/g, "").slice(0, 10));
                if (status === "error") setStatus("idle");
              }}
              placeholder="e.g. 1234567890"
              aria-describedby="pnr-help"
              aria-invalid={status === "error"}
              className={cn(
                "mt-2 h-14 w-full rounded-2xl border px-4 font-display text-2xl tracking-[0.18em] outline-none transition-[border-color,box-shadow] placeholder:tracking-normal placeholder:text-base placeholder:font-sans placeholder:font-normal focus:ring-4",
                dark
                  ? "border-cream-50/15 bg-cream-50/8 text-cream-50 placeholder:text-cream-50/35 focus:border-gold-400 focus:ring-gold-400/15"
                  : "border-line bg-cream-50 text-cocoa-900 placeholder:text-cocoa-400 focus:border-copper-500 focus:ring-copper-500/15",
                status === "error" && "border-chili-500",
              )}
            />
            <div className="mt-2.5">
              <DigitTicks filled={pnr.length} dark={dark} />
            </div>
            <div id="pnr-help" className="mt-2 flex items-center justify-between text-xs">
              <span className={dark ? "text-cream-50/55" : "text-muted"}>Found on your ticket, top-left.</span>
              <button type="button" onClick={() => setPnr(DEMO_PNR)} className={cn("font-semibold underline-offset-2 hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center", dark ? "text-gold-300" : "text-copper-700")}>
                Try demo PNR
              </button>
            </div>
          </div>

          {errorBox}

          <Button type="submit" full size="xl" loading={status === "loading"} className="uppercase tracking-[0.1em]" rightIcon={<ArrowRight className="size-4" />}>
            Check journey
          </Button>
          <p className={cn("text-center text-[13px]", dark ? "text-cream-50/60" : "text-muted")}>
            Don&apos;t have your PNR?{" "}
            <button type="button" onClick={() => setMode("train")} className={cn("font-semibold max-lg:inline-flex max-lg:min-h-11 max-lg:items-center", dark ? "text-cream-50" : "text-cocoa-900")}>
              Order by train number
            </button>
          </p>
        </form>
      )}

      {status !== "success" && mode === "train" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submitTrain();
          }}
        >
          <div className="relative">
            <Input
              label="Train number or name"
              placeholder="e.g. 12951 or Rajdhani"
              value={trainQuery}
              autoComplete="off"
              onChange={(e) => {
                setTrainQuery(e.target.value);
                setTrain(null);
                setBoarding("");
                if (status === "error") setStatus("idle");
              }}
              leftIcon={<Hash className="size-4" />}
              inputClassName={cn(dark && "border-cream-50/15 bg-cream-50/8 text-cream-50 placeholder:text-cream-50/35 focus:border-gold-400 focus:ring-gold-400/15")}
              className={cn(dark && "[&_label]:text-cream-50/80")}
            />
            {!train && suggestions.length > 0 && trainQuery.length > 0 && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-white text-cocoa-900 shadow-lift" role="listbox">
                {suggestions.map((t) => (
                  <li key={t.number}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setTrain(t);
                        setTrainQuery(`${t.number} ${t.name}`);
                        setBoarding(t.stops[0].stationCode);
                        setSuggestions([]);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-cream-100"
                    >
                      <span>
                        <span className="font-semibold">{t.number}</span> · {t.name}
                      </span>
                      <span className="text-xs text-muted">
                        {t.from} → {t.to}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* The network finds the train as you type; picking one flies to its route. */}
          <div aria-hidden className="relative h-44 overflow-hidden rounded-2xl border border-cocoa-800">
            <NetworkMap mode="mini" className="absolute inset-0" fit={routePts} route={routePts} fitPad={routePts ? 0.18 : 0.03} spin={!routePts} draw drawDelay={0.5} flyDuration={0.9}>
              {({ k }) => (
                <>
                  {hintPts.map((p, i) => (
                    <g key={i} transform={`translate(${p.x} ${p.y}) scale(${k})`}>
                      <circle r="7" className="animate-pulse-ring fill-gold-400/40" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                      <circle r="2.5" className="fill-gold-300" />
                    </g>
                  ))}
                  {routePts?.map((p, i) => (
                    <g key={i} transform={`translate(${p.x} ${p.y}) scale(${k})`}>
                      <circle r="3" className="fill-cocoa-950 stroke-copper-300" strokeWidth="1.5" />
                    </g>
                  ))}
                  {boardingPt && <Ping key={boarding} x={boardingPt.x} y={boardingPt.y} k={k} delay={0.4} className="fill-gold-400/40 stroke-gold-300" />}
                </>
              )}
            </NetworkMap>
            {train && (
              <span className="signboard absolute left-2 top-2 text-[10px]">
                {train.number} · {train.from} – {train.to}
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Boarding station"
              placeholder={train ? "Choose station" : "Pick a train first"}
              value={boarding}
              disabled={!train}
              onChange={(e) => setBoarding(e.target.value)}
              options={boardingOptions}
              className={cn(dark && "[&_label]:text-cream-50/80")}
            />
            <Input
              label="Journey date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              leftIcon={<CalendarDays className="size-4" />}
              inputClassName={cn(dark && "border-cream-50/15 bg-cream-50/8 text-cream-50 focus:border-gold-400 focus:ring-gold-400/15 [color-scheme:dark]")}
              className={cn(dark && "[&_label]:text-cream-50/80")}
            />
          </div>
          {errorBox}
          <Button type="submit" full size="xl" loading={status === "loading"} className="uppercase tracking-[0.1em]" rightIcon={<ArrowRight className="size-4" />}>
            Find stations
          </Button>
          <p className={cn("text-center text-[13px]", dark ? "text-cream-50/60" : "text-muted")}>
            Have a PNR?{" "}
            <button type="button" onClick={() => setMode("pnr")} className={cn("font-semibold max-lg:inline-flex max-lg:min-h-11 max-lg:items-center", dark ? "text-cream-50" : "text-cocoa-900")}>
              Use it for seat delivery
            </button>
          </p>
        </form>
      )}
      </div>
    </div>
  );
}
