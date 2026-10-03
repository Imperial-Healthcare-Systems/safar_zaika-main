"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Radio, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { RouteLine } from "@/components/animations/RouteLine";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { getLiveStatus } from "@/services";
import { formatClock, formatMinutes } from "@/lib/utils";
import type { LiveStatus } from "@/types";
import { DemoNote, IdleHint, ToolError, TrainSearch } from "./ToolParts";

type State = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "done"; data: LiveStatus };

/** Minutes since midnight in IST (the timetable's timezone). Reads the clock: call it from handlers only, never in render. */
const istMinutes = () => Math.floor(Date.now() / 60000 + 330) % 1440;

export function LiveStatusTool() {
  // `?train=12951` (the hero's "Train status" hand-off) opens straight on that train's board.
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

  /** `keep`: a refresh leaves the board up and only flips the readouts. */
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
        {state.status === "done" && <Board status={state.data} busy={busy} onRefresh={() => void load(state.data.train.number, true)} />}
      </div>
    </div>
  );
}

function Board({ status: s, busy, onRefresh }: { status: LiveStatus; busy: boolean; onRefresh: () => void }) {
  const isMobile = useIsMobile();
  const { train } = s;
  const last = s.lastStation?.name ?? "Yet to start";
  const next = s.nextStation?.name ?? "Journey ended";
  const eta = s.eta ? formatClock(s.eta) : "Arrived";
  const delay = s.delayMinutes ? `Late ${s.delayMinutes} min` : "On time";
  const wait = formatMinutes(s.minutesToNext);
  const etaLabel = s.state === "arrived" ? "Reached the last stop" : s.state === "not-started" ? `Expected departure, in ${wait}` : `Expected arrival, in ${wait}`;

  return (
    <section className="rounded-3xl bg-cocoa-900 p-4 text-cream-50 sm:p-6" aria-label={`${s.simulated ? "Simulated status" : "Status"} of ${train.number} ${train.name}`}>
      <div className="led-panel rounded-2xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="led text-base tracking-[0.14em] sm:text-lg">
            {train.number} {train.name}
          </h2>
          <p className="led text-[11px] sm:text-xs">
            {s.simulated ? "Simulated" : "Live"} &middot; as of {formatClock(s.asOf)} IST
          </p>
        </div>

        <dl className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
          <Readout label={s.state === "at-station" ? "Standing at" : "Last station passed"} code={s.lastStation?.code}>
            <SplitFlap text={last} length={16} trigger="mount" className="text-[17px] lg:text-2xl" />
          </Readout>
          <Readout label={s.state === "not-started" ? "Starts from" : "Next station"} code={s.nextStation?.code}>
            <SplitFlap text={next} length={16} trigger="mount" delay={120} className="text-[17px] lg:text-2xl" />
          </Readout>
          <Readout label={etaLabel}>
            <SplitFlap text={eta} length={8} trigger="mount" delay={240} className="text-[17px] lg:text-2xl" />
          </Readout>
          <Readout label="Running status">
            <SplitFlap text={delay} length={11} trigger="mount" delay={360} className="text-[17px] lg:text-2xl" cellClassName={s.delayMinutes ? "text-gold-300" : "text-leaf-300"} />
          </Readout>
        </dl>
      </div>

      <div className="mt-5 px-1">
        <RouteLine key={train.number} dark stations={train.stops.map((st) => ({ label: st.stationCode }))} progress={s.progress} labelSize={isMobile ? 34 : 20} />
      </div>

      <div className="mt-4 flex flex-col gap-4 border-t border-dashed border-cream-50/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* The service flags its own data: once the backend sends real running status, the note goes away. */}
        {s.simulated ? <DemoNote dark>Simulated from the timetable. Live running data connects with the backend.</DemoNote> : <span />}
        <Button variant="glass" loading={busy} onClick={onRefresh} leftIcon={<RefreshCw className="size-4" aria-hidden />} className="shrink-0">
          Refresh
        </Button>
      </div>
    </section>
  );
}

/** A flap readout with its label (and station board) under it. */
function Readout({ label, code, children }: { label: string; code?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-2 flex items-center gap-2 text-xs text-cream-50/60">
        {code && <span className="signboard text-[10px]">{code}</span>}
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}
