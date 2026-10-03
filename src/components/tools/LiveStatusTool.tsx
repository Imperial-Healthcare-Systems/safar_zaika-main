"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { RouteLine } from "@/components/animations/RouteLine";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { getLiveStatus } from "@/services";
import { cn, formatClock, formatMinutes } from "@/lib/utils";
import type { LiveStatus } from "@/types";
import { DemoNote, IdleHint, StatusPill, ToolError, TrainSearch } from "./ToolParts";

type State = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "done"; data: LiveStatus };

/** Minutes since midnight in IST (the timetable's timezone). Reads the clock: call it from handlers only, never in render. */
const istMinutes = () => Math.floor(Date.now() / 60000 + 330) % 1440;

export function LiveStatusTool() {
  // `?train=12951` (the hero's "Train status" hand-off) opens straight on that train's status.
  const initial = useSearchParams().get("train");
  const [state, setState] = useState<State>(() => (initial ? { status: "loading" } : { status: "idle" }));
  const [busy, setBusy] = useState(Boolean(initial));
  const req = useRef(0);

  useEffect(() => {
    if (!initial) return;
    const mine = ++req.current;
    void getLiveStatus(initial, istMinutes()).then((res) => {
      if (mine !== req.current) return;
      setBusy(false);
      setState(res.ok ? { status: "done", data: res.data } : { status: "error", message: res.error.message });
    });
  }, [initial]);

  /** `keep`: a refresh leaves the card up and only updates the readouts. */
  const load = async (query: string, keep = false) => {
    const mine = ++req.current;
    setBusy(true);
    if (!keep) setState({ status: "loading" });
    const res = await getLiveStatus(query, istMinutes());
    if (mine !== req.current) return;
    setBusy(false);
    setState(res.ok ? { status: "done", data: res.data } : { status: "error", message: res.error.message });
  };

  return (
    <div className="space-y-6">
      <TrainSearch action="Show status" loading={busy} onSearch={(q) => void load(q)} note="Demo data: the position is simulated from a sample timetable, not from live running information." />
      <div aria-live="polite">
        {state.status === "idle" && <IdleHint icon={<Radio className="size-5" />}>Search a train to see where its timetable puts it right now: last station, next station and expected time.</IdleHint>}
        {state.status === "loading" && (
          <div role="status" aria-label="Working out the position" className="space-y-3">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </div>
        )}
        {state.status === "error" && <ToolError message={state.message} />}
        {state.status === "done" && <StatusCard status={state.data} busy={busy} onRefresh={() => void load(state.data.train.number, true)} />}
      </div>
    </div>
  );
}

function StatusCard({ status: s, busy, onRefresh }: { status: LiveStatus; busy: boolean; onRefresh: () => void }) {
  const isMobile = useIsMobile();
  const { train } = s;
  const wait = formatMinutes(s.minutesToNext);
  const pill =
    s.state === "not-started"
      ? ({ tone: "cream", text: "Yet to start" } as const)
      : s.state === "arrived"
        ? ({ tone: "leaf", text: "Reached the last stop" } as const)
        : s.delayMinutes
          ? ({ tone: "copper", text: `Running late by ${s.delayMinutes} min` } as const)
          : ({ tone: "leaf", text: "Running to timetable" } as const);

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7" aria-label={`${s.simulated ? "Simulated status" : "Status"} of ${train.number} ${train.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl text-cocoa-900 sm:text-3xl">
            {train.number} {train.name}
          </h2>
          <p className="mt-2 text-[13px] text-muted">
            {s.simulated ? "Simulated" : "Live"} &middot; as of {formatClock(s.asOf)} IST
          </p>
        </div>
        <StatusPill tone={pill.tone}>{pill.text}</StatusPill>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Readout label={s.state === "at-station" ? "Standing at" : "Last station passed"} value={s.lastStation?.name ?? "Yet to start"} code={s.lastStation?.code} />
        <Readout label={s.state === "not-started" ? "Starts from" : "Next station"} value={s.nextStation?.name ?? "Journey ended"} code={s.nextStation?.code} />
        <Readout
          label={s.state === "not-started" ? "Expected departure" : "Expected arrival"}
          value={s.eta ? formatClock(s.eta) : "Arrived"}
          sub={s.state === "arrived" ? "Reached the last stop" : `In ${wait}`}
        />
        <Readout label="Delay" value={s.delayMinutes ? `${s.delayMinutes} min late` : "On time"} valueClassName={s.delayMinutes ? "text-copper-700" : "text-leaf-600"} />
      </dl>

      <div className="mt-6 rounded-2xl bg-cream-100 px-2 py-3 sm:px-4">
        <RouteLine key={train.number} stations={train.stops.map((st) => ({ label: st.stationCode }))} progress={s.progress} labelSize={isMobile ? 34 : 20} />
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {/* The service flags its own data: once the backend sends real running status, the note goes away. */}
        {s.simulated ? <DemoNote>Simulated from the timetable. Live running data connects with the backend.</DemoNote> : <span />}
        <Button variant="outline" loading={busy} onClick={onRefresh} leftIcon={<RefreshCw className="size-4" aria-hidden />} className="shrink-0">
          Refresh
        </Button>
      </div>
    </section>
  );
}

/** One plain readout: small label, bold value, the station code as a tag when there is one. */
function Readout({ label, value, code, sub, valueClassName }: { label: string; value: string; code?: string; sub?: string; valueClassName?: string }) {
  return (
    <div className="rounded-2xl bg-cream-100 p-4">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd data-readout className={cn("mt-1 text-lg font-bold leading-snug text-cocoa-900", valueClassName)}>
        {value}
      </dd>
      {code && (
        <dd className="mt-1.5">
          <span className="tag bg-white">{code}</span>
        </dd>
      )}
      {sub && <dd className="mt-1 text-[13px] text-muted">{sub}</dd>}
    </div>
  );
}
