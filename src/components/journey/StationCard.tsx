"use client";

import { Check, Clock3, Flag, Store, TrainFront, Utensils } from "lucide-react";
import { cn, formatClock, formatMinutes } from "@/lib/utils";
import type { EligibleStation } from "@/types";

export function StationCard({ item, selected, onSelect, className }: { item: EligibleStation; selected: boolean; onSelect?: () => void; className?: string }) {
  const { station, stop, availability, restaurantCount } = item;
  const selectable = availability === "available";

  const status = {
    available: { icon: Utensils, text: `${restaurantCount} kitchen${restaurantCount === 1 ? "" : "s"} nearby`, tone: "text-leaf-600" },
    "too-soon": { icon: Clock3, text: "Too soon for a safe delivery", tone: "text-muted" },
    "no-food": { icon: Store, text: "Nothing available at this station yet", tone: "text-muted" },
    passed: { icon: TrainFront, text: "Your boarding station", tone: "text-cocoa-700" },
    destination: { icon: Flag, text: "Journey ends here", tone: "text-cocoa-700" },
  }[availability];
  const Icon = status.icon;

  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative w-full rounded-2xl border bg-white p-4 text-left transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-out-quart)",
        selectable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card" : "cursor-default opacity-70",
        selected ? "border-copper-500 shadow-glow" : "border-line",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-cocoa-900">
            <span className="truncate">{station.name}</span>
            <span className="signboard shrink-0">{station.code}</span>
          </p>
          <p className={cn("mt-1 flex items-center gap-1.5 text-[13px] font-medium", status.tone)}>
            <Icon className="size-3.5" /> {status.text}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-copper-500 bg-copper-500 text-cream-50" : selectable ? "border-line text-transparent group-hover:border-copper-300" : "border-transparent text-transparent",
          )}
          aria-hidden
        >
          <Check className="size-4" />
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[12px]">
        <div>
          <dt className="text-muted">Arrives</dt>
          <dd className="font-semibold text-cocoa-900">{stop.arrival ? formatClock(stop.arrival) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Departs</dt>
          <dd className="font-semibold text-cocoa-900">{stop.departure ? formatClock(stop.departure) : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Halt</dt>
          <dd className="font-semibold text-cocoa-900">{stop.halt ? `${stop.halt} min` : "—"}</dd>
        </div>
      </dl>
      {availability !== "passed" && (
        <p className="mt-2 text-[11px] text-muted">
          {item.minutesFromBoarding > 0 ? `${formatMinutes(item.minutesFromBoarding)} after boarding` : ""}
          {stop.day > 1 ? ` · day ${stop.day}` : ""}
        </p>
      )}
    </button>
  );
}
