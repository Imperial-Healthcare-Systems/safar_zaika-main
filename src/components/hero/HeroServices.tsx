"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Radio, Search, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { PnrModule } from "@/components/pnr/PnrModule";
import { TrainSearch } from "@/components/tools/ToolParts";
import { toast } from "@/stores";

type Service = "food" | "status" | "hotels";

const services: { id: Service; label: string; Icon: typeof Utensils; soon?: boolean }[] = [
  { id: "food", label: "Order food", Icon: Utensils },
  { id: "status", label: "Train status", Icon: Radio },
  { id: "hotels", label: "Hotels", Icon: BedDouble, soon: true },
];

/**
 * The hero's service switcher: food ordering (the three-tab search card), train status
 * (hands off to the live-status tool) and hotels (a labelled preview; bookings are not open).
 */
export function HeroServices() {
  const router = useRouter();
  const [service, setService] = useState<Service>("food");

  return (
    <>
      <div role="group" aria-label="What would you like to do?" className="mb-3 flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {services.map(({ id, label, Icon, soon }) => {
          const active = id === service;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setService(id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-200 sm:gap-2 sm:px-4 sm:text-sm",
                active ? "bg-white text-cocoa-900 shadow-card" : "bg-cocoa-950/55 text-cream-50/90 ring-1 ring-cream-50/15 hover:bg-cocoa-950/75",
              )}
            >
              <Icon className={cn("hidden size-4 min-[400px]:block", active ? "text-copper-600" : "text-gold-400")} aria-hidden />
              {label}
              {soon && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]", active ? "bg-sign-500 text-cocoa-950" : "bg-sign-500/90 text-cocoa-950")}>Soon</span>}
            </button>
          );
        })}
      </div>

      {service === "food" && <PnrModule variant="search" />}

      {service === "status" && (
        <TrainSearch
          action="Track train"
          note="Position is simulated from the timetable until live running data connects."
          onSearch={(q) => router.push(`/train-tools?tool=live-status&train=${encodeURIComponent(q)}`)}
        />
      )}

      {service === "hotels" && (
        <form
          className="rounded-3xl bg-white p-4 text-cocoa-900 shadow-lift sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            toast({ title: "Hotel booking is coming soon", description: "Rooms near major stations will open here. Nothing has been booked." });
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl sm:text-2xl">Hotels near your station</h2>
            <span className="signboard">Coming soon</span>
          </div>
          <p className="mt-1 text-sm text-muted">A preview of what is on the way: rooms near major stations, booked alongside your journey. Bookings are not open yet.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1.5fr_1fr_1fr_0.9fr]">
            <Input className="col-span-2 sm:col-span-1" label="City or station" placeholder="e.g. Vadodara" autoComplete="off" />
            <Input label="Check-in" type="date" />
            <Input label="Check-out" type="date" />
            <Input className="col-span-2 sm:col-span-1" label="Guests" placeholder="2 adults" autoComplete="off" />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit" size="lg" leftIcon={<Search className="size-4" />}>
              Search hotels
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
