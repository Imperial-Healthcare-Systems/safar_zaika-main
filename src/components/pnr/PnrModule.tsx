"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Hash, MapPin, Ticket } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Button, Input, Select, Tabs } from "@/components/ui";
import { computeEligibleStations, getJourneyByTrain, getPNRJourney, PNR_REGEX, searchTrains } from "@/services";
import { useJourneyStore } from "@/stores";
import { getStation, stations } from "@/data/stations";
import { NetworkMap, Ping, projectRoute } from "@/components/journey/NetworkMap";
import type { ServiceError, Station, Train } from "@/types";
import { PnrLoading, type PnrFound } from "./PnrLoading";

type Mode = "pnr" | "train" | "station";
type Status = "idle" | "loading" | "error" | "success";

const DEMO_PNR = "1234567890";

/** `search`: tab label on the wide search card; `short` / `long`: the pill tabs of the compact card (with heading / bare). */
const TABS = [
  { value: "pnr", icon: Ticket, search: "PNR", short: "PNR", long: "Order with PNR" },
  { value: "train", icon: Hash, search: "Train no. / name", short: "Train", long: "Order by train" },
  { value: "station", icon: MapPin, search: "Station", short: "Station", long: "By station" },
] as const;

const routeOf = (train: Train) =>
  projectRoute(
    train.stops.flatMap((s) => {
      const st = getStation(s.stationCode);
      return st ? [st] : [];
    }),
  );

/** Stations whose name, city or code contains the query (an exact code match leads); the featured stations when it is empty. */
function matchStations(query: string): Station[] {
  const q = query.trim().toLowerCase();
  if (!q) return stations.filter((s) => s.popular);
  return stations
    .filter((s) => [s.name, s.city, s.code].some((v) => v.toLowerCase().includes(q)))
    .sort((a, b) => Number(b.code.toLowerCase() === q) - Number(a.code.toLowerCase() === q));
}

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
  /**
   * "search": the wide white search card (hero, /order): PNR / train / station tabs across the top, the main field with
   * the submit inline on its right from sm up, one reassurance line. Always light; `dark` and `bare` do not apply.
   * "card" (default): the compact card used by the welcome popup, the CTA band and the side panels.
   */
  variant?: "card" | "search";
}

export function PnrModule({ dark: darkProp, defaultMode = "pnr", className, bare, variant = "card" }: PnrModuleProps) {
  const router = useRouter();
  const search = variant === "search";
  const dark = darkProp && !search;
  // The compact card keeps its two tabs; the station tab belongs to the search card (or to a caller that starts there).
  const tabs = search || defaultMode === "station" ? TABS : TABS.slice(0, 2);
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
  const [stationQuery, setStationQuery] = useState("");
  const [station, setStation] = useState<Station | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
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
  const matches = useMemo(() => (station ? [] : matchStations(stationQuery)), [station, stationQuery]);

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

  const pickStation = (s: Station) => {
    setStation(s);
    setStationQuery(`${s.name} (${s.code})`);
    setListOpen(false);
    if (status === "error") setStatus("idle");
  };

  // A typed name that was never picked from the list still goes to its best match.
  const submitStation = () => {
    setError(null);
    const typed = stationQuery.trim();
    const target = station ?? (typed ? matches[0] : undefined);
    if (!target) return fail(typed ? "No station matches that. Try the city or the station code." : "Type a station name, city or code and pick it from the list.");
    setListOpen(false);
    setStatus("loading");
    router.push(`/restaurants?station=${target.code}`);
  };

  const onStationKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setListOpen(false);
    if (!matches.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = listOpen ? (active + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length : 0;
      setListOpen(true);
      setActive(next);
      document.getElementById(`${listId}-${matches[next].code}`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && listOpen) {
      e.preventDefault();
      pickStation(matches[Math.min(active, matches.length - 1)]);
    }
  };

  const boardingOptions = train ? train.stops.slice(0, -1).map((s) => ({ value: s.stationCode, label: `${getStation(s.stationCode)?.name ?? s.stationCode} (${s.stationCode})` })) : [];
  const switchMode = (m: Mode) => {
    setMode(m);
    setStatus("idle");
    setError(null);
  };

  /* Pieces shared by the three forms. On the search card each form is a two-column grid from sm up: the main field and
     the submit share the first row (the submit stays last in the DOM, so on phones and for the keyboard it follows
     every field) and everything else spans both columns underneath. */
  const formClass = search ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" : "space-y-4";
  const fieldClass = cn("relative", search && "min-w-0 sm:col-start-1 sm:row-start-1");
  const labelClass = search ? "sr-only" : cn("text-[13px] font-semibold", dark ? "text-cream-50/80" : "text-cocoa-800");
  const noteClass = cn("text-[13px]", search ? "text-muted sm:col-span-2" : cn("text-center", dark ? "text-cream-50/60" : "text-muted"));
  const linkClass = cn("font-semibold max-lg:inline-flex max-lg:min-h-11 max-lg:items-center", dark ? "text-cream-50" : "text-cocoa-900");
  const searchField = "h-14 rounded-2xl border-2 border-cream-300 bg-cream-100";
  const darkField = "border-cream-50/15 bg-cream-50/8 text-cream-50 placeholder:text-cream-50/35 focus:border-gold-400 focus:ring-gold-400/15";
  const submit = (label: string) => (
    <Button
      type="submit"
      full={!search}
      size="xl"
      loading={status === "loading"}
      className={cn("uppercase tracking-[0.1em]", search && "max-sm:w-full sm:col-start-2 sm:row-start-1")}
      rightIcon={<ArrowRight className="size-4" />}
    >
      {label}
    </Button>
  );
  const errorBox = status === "error" && error && (
    <div role="alert" className={cn("flex items-start gap-2 rounded-xl border border-chili-500/30 bg-chili-50 px-3 py-2.5 text-[13px] font-medium text-chili-600", search && "sm:col-span-2")}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {error}
    </div>
  );
  const usePnrNote = (
    <p className={noteClass}>
      Have a PNR?{" "}
      <button type="button" onClick={() => switchMode("pnr")} className={linkClass}>
        Use it for seat delivery
      </button>
    </p>
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-3xl max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base",
        // The search card never clips: its suggestion lists drop below the card's bottom edge.
        search
          ? "bg-white text-cocoa-900 shadow-lift"
          : cn("overflow-hidden p-5 sm:p-6", dark ? "glass text-cream-50 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]" : "border border-line bg-white text-cocoa-900 shadow-card"),
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
        {search ? (
          <div
            role="tablist"
            aria-label="Search by"
            className="no-scrollbar flex overflow-x-auto border-b border-line px-2 sm:px-3"
            onKeyDown={(e) => {
              const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (!step) return;
              const next = TABS[(TABS.findIndex((t) => t.value === mode) + step + TABS.length) % TABS.length].value;
              switchMode(next);
              e.currentTarget.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
            }}
          >
            {TABS.map((t) => {
              const selected = t.value === mode;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  data-tab={t.value}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => switchMode(t.value)}
                  className={cn(
                    "relative flex h-12 shrink-0 items-center gap-2 px-3 text-[13px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:-outline-offset-2 sm:h-13 sm:px-4 sm:text-sm",
                    "after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-copper-500 after:transition-transform after:duration-300 sm:after:inset-x-4",
                    selected ? "text-cocoa-900 after:scale-x-100" : "text-muted after:scale-x-0 hover:text-cocoa-800",
                  )}
                >
                  {/* Phones: no icons and the short train label, so all three tabs fit without scrolling. */}
                  <t.icon className="size-4 max-sm:hidden" aria-hidden />
                  <span className="sm:hidden">{t.short}</span>
                  <span className="max-sm:hidden">{t.search}</span>
                  {t.value === "pnr" && (
                    <span className="rounded-full border border-leaf-300 bg-leaf-50 px-1.5 py-0.5 text-[10px] font-bold normal-case leading-none tracking-normal text-leaf-700">Recommended</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={cn("mb-5", !bare && "flex items-start justify-between gap-3")}>
            {!bare && <h2 className="font-display text-2xl tracking-tight sm:text-3xl">Where&apos;s your train headed?</h2>}
            <Tabs<Mode>
              dark={dark}
              full={bare}
              value={mode}
              onChange={switchMode}
              items={tabs.map((t) => ({ value: t.value, label: bare ? t.long : t.short, icon: <t.icon className="size-3.5" /> }))}
            />
          </div>
        )}

        <div className={search ? "p-4 sm:p-5" : undefined}>
          {status === "success" && (
            <div className="flex flex-col items-center py-6 text-center" role="status">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
                <CheckCircle2 className="size-7" />
              </span>
              <p className="mt-4 font-display text-xl">Journey found</p>
              <p className={cn("mt-1 text-sm", dark ? "text-cream-50/70" : "text-muted")}>{foundLabel}</p>
              <p className={cn("mt-3 text-xs", dark ? "text-cream-50/50" : "text-muted")}>Opening your route&hellip;</p>
            </div>
          )}

          {status !== "success" && mode === "pnr" && (
            <form
              className={formClass}
              onSubmit={(e) => {
                e.preventDefault();
                void submitPnr();
              }}
            >
              <div className={fieldClass}>
                <label htmlFor="pnr-input" className={labelClass}>
                  10-digit PNR number
                </label>
                {search && <Ticket className="pointer-events-none absolute left-4 top-5 size-4 text-cocoa-400" aria-hidden />}
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
                  placeholder={search ? "Enter your 10-digit PNR" : "e.g. 1234567890"}
                  aria-describedby="pnr-help"
                  aria-invalid={status === "error"}
                  className={cn(
                    "h-14 w-full rounded-2xl border px-4 font-display text-2xl tracking-[0.18em] outline-none transition-[border-color,box-shadow] placeholder:tracking-normal placeholder:text-base placeholder:font-sans placeholder:font-normal focus:ring-4",
                    dark
                      ? "border-cream-50/15 bg-cream-50/8 text-cream-50 placeholder:text-cream-50/35 focus:border-gold-400 focus:ring-gold-400/15"
                      : "border-line bg-cream-50 text-cocoa-900 placeholder:text-cocoa-400 focus:border-copper-500 focus:ring-copper-500/15",
                    search ? "border-2 border-cream-300 bg-cream-100 pl-11" : "mt-2",
                    status === "error" && "border-chili-500",
                  )}
                />
                <div className={search ? "mt-2" : "mt-2.5"}>
                  <DigitTicks filled={pnr.length} dark={dark} />
                </div>
                {!search && (
                  <div id="pnr-help" className="mt-2 flex items-center justify-between text-xs">
                    <span className={dark ? "text-cream-50/55" : "text-muted"}>Found on your ticket, top-left.</span>
                    <button type="button" onClick={() => setPnr(DEMO_PNR)} className={cn("font-semibold underline-offset-2 hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center", dark ? "text-gold-300" : "text-copper-700")}>
                      Try demo PNR
                    </button>
                  </div>
                )}
              </div>

              {errorBox}
              {submit("Check journey")}
              {search ? (
                <div id="pnr-help" className={cn(noteClass, "flex items-center justify-between gap-3")}>
                  <span>Coach and berth come from your ticket, so the food reaches your seat.</span>
                  <button type="button" onClick={() => setPnr(DEMO_PNR)} className="shrink-0 font-semibold text-copper-700 underline-offset-2 hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center">
                    Try demo PNR
                  </button>
                </div>
              ) : (
                <p className={noteClass}>
                  Don&apos;t have your PNR?{" "}
                  <button type="button" onClick={() => switchMode("train")} className={linkClass}>
                    Order by train number
                  </button>
                </p>
              )}
            </form>
          )}

          {status !== "success" && mode === "train" && (
            <form
              className={formClass}
              onSubmit={(e) => {
                e.preventDefault();
                void submitTrain();
              }}
            >
              <div className={fieldClass}>
                <Input
                  label={search ? undefined : "Train number or name"}
                  aria-label={search ? "Train number or name" : undefined}
                  placeholder={search ? "Train no. or name, e.g. 12951" : "e.g. 12951 or Rajdhani"}
                  value={trainQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    setTrainQuery(e.target.value);
                    setTrain(null);
                    setBoarding("");
                    if (status === "error") setStatus("idle");
                  }}
                  leftIcon={<Hash className="size-4" />}
                  inputClassName={cn(search && searchField, dark && darkField)}
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
                            <span className="font-semibold">{t.number}</span> &middot; {t.name}
                          </span>
                          <span className="text-xs text-muted">
                            {t.from} &rarr; {t.to}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={search ? "grid gap-3 sm:col-span-2 sm:grid-cols-2" : "space-y-4"}>
                {/* The network finds the train as you type; picking one flies to its route. */}
                <div aria-hidden className={cn("relative overflow-hidden rounded-2xl border border-cocoa-800", search ? "h-36 sm:h-full sm:min-h-40" : "h-44")}>
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
                      {train.number} &middot; {train.from} &ndash; {train.to}
                    </span>
                  )}
                </div>

                <div className={search ? "grid content-start gap-3" : "grid gap-4 sm:grid-cols-2"}>
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
              </div>
              {errorBox}
              {submit("Find stations")}
              {search ? <p className={noteClass}>No PNR needed. We list every halt on the route where a kitchen can meet your train.</p> : usePnrNote}
            </form>
          )}

          {status !== "success" && mode === "station" && (
            <form
              className={formClass}
              onSubmit={(e) => {
                e.preventDefault();
                submitStation();
              }}
            >
              <div className={fieldClass}>
                <Input
                  id="station-input"
                  role="combobox"
                  aria-expanded={listOpen && matches.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={listOpen && matches[active] ? `${listId}-${matches[active].code}` : undefined}
                  label={search ? undefined : "Station name, city or code"}
                  aria-label={search ? "Station name, city or code" : undefined}
                  placeholder={search ? "Station, city or code, e.g. BRC" : "e.g. Vadodara or BRC"}
                  value={stationQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    setStationQuery(e.target.value);
                    setStation(null);
                    setActive(0);
                    setListOpen(true);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setListOpen(true)}
                  onBlur={() => setListOpen(false)}
                  onKeyDown={onStationKey}
                  leftIcon={<MapPin className="size-4" />}
                  inputClassName={cn(search && searchField, dark && darkField)}
                  className={cn(dark && "[&_label]:text-cream-50/80")}
                />
                {listOpen && !station && (
                  <ul id={listId} role="listbox" aria-label="Stations" data-lenis-prevent className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-white py-1 text-left text-cocoa-900 shadow-lift">
                    {matches.map((s, i) => (
                      <li
                        key={s.code}
                        id={`${listId}-${s.code}`}
                        role="option"
                        aria-selected={i === active}
                        // mousedown would blur the input (closing the list) before the click lands
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => pickStation(s)}
                        className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm", i === active && "bg-cream-100")}
                      >
                        <span className="min-w-0 truncate">
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-muted"> &middot; {s.city}</span>
                        </span>
                        <span className="signboard shrink-0 text-[10px]">{s.code}</span>
                      </li>
                    ))}
                    {matches.length === 0 && <li className="px-4 py-3 text-sm text-muted">No station matches. Try the city or the station code.</li>}
                  </ul>
                )}
              </div>
              {errorBox}
              {submit("Find food")}
              {search ? <p className={noteClass}>See the kitchens that serve this station and what they are cooking.</p> : usePnrNote}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
