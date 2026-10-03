"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Ticket as TicketIcon, UserRound } from "lucide-react";
import { Badge, Button, Skeleton } from "@/components/ui";
import { getPnrStatus, PNR_REGEX } from "@/services";
import { useJourneyStore } from "@/stores";
import { cn, formatClock, formatDate } from "@/lib/utils";
import type { PnrStatus } from "@/types";
import { DemoNote, IdleHint, StatusPill, ToolError } from "./ToolParts";

const DEMO_PNR = "1234567890";
const STATUS_TONE = { CNF: "leaf", RAC: "gold", WL: "chili" } as const;
const STATUS_TEXT = { CNF: "Confirmed", RAC: "Reservation against cancellation", WL: "Waiting list" } as const;

type State = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "done"; data: PnrStatus };

export function PnrStatusTool() {
  const id = useId();
  const router = useRouter();
  const [pnr, setPnr] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });
  const req = useRef(0);

  const submit = async () => {
    if (!PNR_REGEX.test(pnr)) return setInvalid(true);
    const mine = ++req.current;
    setState({ status: "loading" });
    const res = await getPnrStatus(pnr);
    if (mine !== req.current) return;
    setState(res.ok ? { status: "done", data: res.data } : { status: "error", message: res.error.message });
  };

  return (
    <div className="space-y-6">
      <form
        noValidate
        className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={id} className="text-[13px] font-semibold text-cocoa-800">
          10-digit PNR number
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={10}
            value={pnr}
            onChange={(e) => {
              setPnr(e.target.value.replace(/\D/g, "").slice(0, 10));
              setInvalid(false);
            }}
            placeholder="e.g. 1234567890"
            aria-invalid={invalid}
            aria-describedby={`${id}-help`}
            className={cn(
              "h-14 w-full min-w-0 shrink-0 sm:shrink sm:flex-1 rounded-2xl border border-line bg-cream-50 px-4 font-display text-2xl tracking-[0.18em] text-cocoa-900 outline-none transition-[border-color,box-shadow] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-cocoa-400 focus:border-copper-500 focus:ring-4 focus:ring-copper-500/15",
              invalid && "border-chili-500 focus:border-chili-500 focus:ring-chili-500/15",
            )}
          />
          <Button type="submit" size="xl" loading={state.status === "loading"} className="sm:min-w-44">
            Check PNR status
          </Button>
        </div>
        <div id={`${id}-help`} className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {invalid ? (
            <p role="alert" className="text-[13px] font-medium text-chili-600">
              A PNR is exactly 10 digits. You have entered {pnr.length}.
            </p>
          ) : (
            <DemoNote>Demo data: sample journeys only, not a real railway record.</DemoNote>
          )}
          <button
            type="button"
            onClick={() => {
              setPnr(DEMO_PNR);
              setInvalid(false);
            }}
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-copper-700 underline-offset-2 hover:underline lg:min-h-0"
          >
            Try demo PNR
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {state.status === "idle" && <IdleHint icon={<TicketIcon className="size-5" />}>Enter a PNR to see the train, the chart status and each passenger with coach and berth.</IdleHint>}
        {state.status === "loading" && <TicketSkeleton />}
        {state.status === "error" && <ToolError message={state.message} />}
        {state.status === "done" && (
          <Ticket
            data={state.data}
            onOrder={() => {
              // Same hand-off as the PNR form on the home page: the journey store, then the journey page.
              useJourneyStore.getState().setJourney(state.data.journey);
              router.push("/journey");
            }}
          />
        )}
      </div>
    </div>
  );
}

function TicketSkeleton() {
  return (
    <div role="status" aria-label="Checking PNR status" className="rounded-3xl border border-line bg-white p-6 sm:p-8">
      <Skeleton className="h-8 w-3/5 max-w-sm" />
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-16" />
      </div>
      <Skeleton className="mt-6 h-14" />
      <Skeleton className="mt-3 h-14" />
    </div>
  );
}

/** Ticket-shaped result on navy, like the journey card: train and chart status, the two ends with their times, the ticket facts, then the passengers. */
function Ticket({ data, onOrder }: { data: PnrStatus; onOrder: () => void }) {
  const { journey, train, passengers, boardingStation, destinationStation, chartPrepared } = data;
  const pnr = journey.pnr ?? "";
  const days = train.stops[journey.destinationIndex].day - train.stops[journey.boardingIndex].day;
  return (
    <article className="ticket-edge relative overflow-hidden rounded-3xl bg-cocoa-900 text-cream-50" aria-label={`PNR status: ${train.number} ${train.name}`}>
      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:gap-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <h2 className="font-display text-2xl sm:text-3xl">
              {train.number} {train.name}
            </h2>
            <StatusPill tone={chartPrepared ? "leaf" : "cream"}>{chartPrepared ? "Chart prepared" : "Chart not prepared"}</StatusPill>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div>
              <p className="whitespace-nowrap font-display text-[1.75rem] tabular-nums sm:text-[2.5rem]">{formatClock(data.departure)}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                <span className="tag-dark">{boardingStation.code}</span>
                {boardingStation.name}
              </p>
            </div>
            <div className="flex items-center gap-1 px-1 pt-3 sm:px-3 sm:pt-5" aria-hidden>
              <span className="size-1.5 rounded-full bg-cream-50/60" />
              <span className="h-px w-8 bg-cream-50/30 sm:w-24" />
              <ArrowRight className="size-4 text-cream-50/60" />
            </div>
            <div className="text-right">
              <p className="whitespace-nowrap font-display text-[1.75rem] tabular-nums sm:text-[2.5rem]">{formatClock(data.arrival)}</p>
              <p className="mt-2 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-sm font-semibold">
                {destinationStation.name}
                <span className="tag-dark">{destinationStation.code}</span>
              </p>
              {days > 0 && <p className="mt-1 text-xs font-medium text-cream-50/65">+{days} day</p>}
            </div>
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-cream-50/10 pt-5">
            <Field label="PNR" value={`${pnr.slice(0, 3)} ••• ${pnr.slice(-3)}`} />
            <Field label="Date of journey" value={formatDate(journey.date)} />
            <Field label="Class" value={journey.travelClass} />
          </dl>
        </div>

        <div className="border-t border-dashed border-cream-50/20 pt-5 lg:min-w-80 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-sm font-semibold text-cream-50/65">Passengers</p>
          <ul className="mt-3 space-y-2">
            {passengers.map((p) => (
              <li key={p.coach + p.berth} className="panel-dark flex items-center gap-3 px-3 py-2.5">
                <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-50/10 text-cream-50/85">
                  <UserRound className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-cream-50/65">{p.berthType} berth</p>
                </div>
                <p className="text-base font-bold leading-tight tabular-nums">
                  <span className="sr-only">
                    Coach {p.coach}, berth {p.berth}
                  </span>
                  <span aria-hidden>
                    {p.coach} / {p.berth}
                  </span>
                </p>
                <Badge tone={STATUS_TONE[p.status]} title={STATUS_TEXT[p.status]}>
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-cream-50/65">Names are masked. Coach / berth as on the demo ticket.</p>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 border-t border-dashed border-cream-50/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <DemoNote dark>Demo result. Order for it and pick the station where your food should arrive.</DemoNote>
        <Button size="lg" onClick={onOrder} rightIcon={<ArrowRight className="size-4" />} className="shrink-0">
          Order food for this journey
        </Button>
      </div>
    </article>
  );
}

/** Small sentence-case label over its value. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-cream-50/65">{label}</dt>
      <dd className="mt-0.5 text-base font-bold leading-tight">{value}</dd>
    </div>
  );
}
