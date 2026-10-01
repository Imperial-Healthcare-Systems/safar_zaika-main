"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ArrowRight, BellRing, RefreshCcw, Utensils } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, formatClock, prefersReducedMotion } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, SectionHeading } from "@/components/ui";
import { PnrModule } from "@/components/pnr/PnrModule";
import { JourneyCard } from "./JourneyCard";
import { JourneyMap } from "./JourneyMap";
import { StationCard } from "./StationCard";
import { selectSelectedStation, toast, useJourneyStore } from "@/stores";

const switchClass =
  "relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-cream-300 transition-colors before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:duration-200 checked:bg-leaf-600 checked:before:translate-x-5";

export function JourneyView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const journey = useJourneyStore((s) => s.journey);
  const eligible = useJourneyStore((s) => s.eligible);
  const selectedCode = useJourneyStore((s) => s.selectedStationCode);
  const selected = useJourneyStore(selectSelectedStation);
  const selectStation = useJourneyStore((s) => s.selectStation);
  const reminders = useJourneyStore((s) => s.reminders);
  const setReminders = useJourneyStore((s) => s.setReminders);
  const clear = useJourneyStore((s) => s.clear);
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!journey || !listRef.current || prefersReducedMotion()) return;
      gsap.from(listRef.current.children, { autoAlpha: 0, y: 18, stagger: 0.06, duration: 0.7, ease: "expo.out", delay: 0.2 });
    },
    { scope: listRef, dependencies: [journey?.pnr, journey?.trainNumber] },
  );

  if (!hydrated) {
    return <PageHeader compact title="Loading your route…" description="One moment." />;
  }

  if (!journey) {
    return (
      <>
        <PageHeader compact title="Start with your PNR." description="We'll map your route and show every station where a hot meal can meet your train." />
        <section className="container-x -mt-4 max-w-2xl pb-20">
          <PnrModule />
        </section>
      </>
    );
  }

  const available = eligible.filter((e) => e.availability === "available").length;
  const go = () => {
    if (!selectedCode) return;
    router.push(`/restaurants?station=${selectedCode}`);
  };
  const toggleReminders = (on: boolean) => {
    setReminders(on);
    toast(
      on
        ? { title: "Reminders on", description: "We'll message you about 60 min before each halt. SMS/WhatsApp consent only; you can turn it off anytime.", tone: "success" }
        : { title: "Reminders off", description: "No nudges for this journey." },
    );
  };

  return (
    <>
      <PageHeader
        compact
        title="Pick where dinner meets the train"
        description={`${available} of ${Math.max(0, eligible.length - 2)} upcoming halts can take an order. Pick one and the train will show you the way.`}
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCcw className="size-4" />}
            onClick={() => {
              clear();
              router.push("/order");
            }}
          >
            Change journey
          </Button>
        }
      >
        <div className="mt-8">
          <JourneyCard journey={journey} />
        </div>
      </PageHeader>

      <section className="container-x pb-28 pt-10 lg:pb-20" aria-labelledby="pick-title">
        <SectionHeading title={<span id="pick-title">Where should we deliver?</span>} description="Tap a station on the map or in the list. Timings are the scheduled halt; kitchens need at least 45 minutes before arrival." />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <JourneyMap stops={eligible} boardingIndex={journey.boardingIndex} selectedCode={selectedCode} onSelect={selectStation} className="aspect-[4/3] lg:sticky lg:top-28 lg:aspect-auto lg:h-[600px] lg:self-start" />
          <div>
            <div ref={listRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {eligible.map((item) => (
                <StationCard key={item.station.code} item={item} selected={item.station.code === selectedCode} onSelect={() => selectStation(item.station.code)} />
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-line bg-white p-5">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold text-cocoa-900">
                    <BellRing className="size-4 text-copper-600" /> Remind me before the next halt where I can order
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">About 60 minutes before each halt with a live kitchen, by SMS or WhatsApp. Only with your consent; switch it off anytime.</span>
                </span>
                <input type="checkbox" role="switch" checked={reminders} onChange={(e) => toggleReminders(e.target.checked)} className={switchClass} aria-label="Remind me before the next halt where I can order" />
              </label>
            </div>

            <div className={cn("mt-6 hidden rounded-3xl border p-5 transition-colors lg:block", selected ? "border-copper-500 bg-copper-50" : "border-line bg-white")}>
              {selected ? (
                <>
                  <p className="text-sm font-semibold text-muted">Selected station</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-cocoa-900">{selected.station.name}</p>
                  <p className="text-sm text-muted">
                    Arrives {formatClock(selected.stop.arrival)} · {selected.stop.halt} min halt · {selected.restaurantCount} kitchens nearby
                  </p>
                  <Button full size="lg" className="mt-4 uppercase tracking-[0.08em]" onClick={go} rightIcon={<ArrowRight className="size-4" />} leftIcon={<Utensils className="size-4" />}>
                    See kitchens at {selected.station.code}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted">Select a station to see the kitchens that can deliver there.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className={cn("fixed inset-x-3 bottom-3 z-sticky transition-[transform,opacity] duration-500 ease-(--ease-out-expo) lg:hidden", selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0")} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <Button full size="xl" className="shadow-lift uppercase tracking-[0.08em]" onClick={go} rightIcon={<ArrowRight className="size-4" />}>
          Kitchens at {selected?.station.name ?? ""}
        </Button>
      </div>
    </>
  );
}
