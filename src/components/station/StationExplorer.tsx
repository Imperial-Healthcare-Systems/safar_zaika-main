"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Search, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Chip, Input, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";
import { PnrModule } from "@/components/pnr/PnrModule";
import { PLANNED_STATIONS, REGIONS, stations } from "@/data/stations";
import { restaurantsByStation } from "@/data/restaurants";
import { cn } from "@/lib/utils";
import type { Region, Station } from "@/types";

const regionCounts = Object.fromEntries(REGIONS.map((r) => [r.id, stations.filter((s) => s.region === r.id).length])) as Record<Region, number>;

function groupByState(list: Station[]) {
  const map = new Map<string, Station[]>();
  for (const s of list) map.set(s.state, [...(map.get(s.state) ?? []), s]);
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function StationExplorer() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<Region | "all">("all");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return stations.filter((st) => (region === "all" || st.region === region) && (!s || `${st.name} ${st.city} ${st.code} ${st.state}`.toLowerCase().includes(s)));
  }, [q, region]);
  const popular = filtered.filter((s) => s.popular);
  const grouped = useMemo(() => REGIONS.map((r) => ({ ...r, states: groupByState(filtered.filter((s) => s.region === r.id)) })).filter((g) => g.states.length > 0), [filtered]);

  return (
    <>
      <PageHeader
        title={`Food at ${PLANNED_STATIONS} stations, across four regions`}
        description="That's the network being built out: North, East, West and South, with two partner kitchens live per station at launch. The stations listed below are the demo subset; your PNR check is the source of truth for your route."
      >
        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by region">
          <Chip active={region === "all"} onClick={() => setRegion("all")}>
            All · {stations.length}
          </Chip>
          {REGIONS.map((r) => (
            <Chip key={r.id} active={region === r.id} onClick={() => setRegion(r.id)}>
              {r.id} · {regionCounts[r.id]}
            </Chip>
          ))}
        </div>
        <div className="mt-4 max-w-xl">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by station, city or code…" leftIcon={<Search className="size-4" />} aria-label="Search stations" inputClassName="h-14 rounded-2xl text-base" />
        </div>
      </PageHeader>

      <section className="container-x py-14" aria-labelledby="popular-title">
        <SectionHeading title={<span id="popular-title">Most ordered-at stations</span>} description="Tap a station to browse its kitchens." />
        {popular.length === 0 ? (
          <p className="mt-6 text-muted">No popular station matches {q ? `“${q}”` : "that region"}.</p>
        ) : (
          <Reveal stagger={0.05} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.map((s) => {
              const count = restaurantsByStation(s.code).length;
              return (
                <Link
                  key={s.code}
                  href={`/restaurants?station=${s.code}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-3xl border border-line bg-cocoa-900 p-5 text-cream-50 shadow-card transition-[transform,box-shadow] duration-400 ease-(--ease-out-quart) hover:-translate-y-1 hover:shadow-lift"
                >
                  {s.image ? (
                    <Image src={s.image} alt="" fill sizes="(max-width: 640px) 90vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div aria-hidden className="absolute inset-0 map-grid-dark">
                      <span className="absolute -right-4 -top-6 font-display text-[9rem] font-semibold leading-none text-cream-50/6">{s.code}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/90 via-cocoa-950/40 to-transparent" />
                  <div className="relative">
                    <span className="signboard">{s.code}</span>
                    <p className="mt-2 font-display text-2xl font-semibold leading-tight">{s.name}</p>
                    <p className="text-[13px] text-cream-50/70">{s.tagline ?? s.city}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-gold-300">
                      <Store className="size-3.5" /> {count} partner kitchen{count === 1 ? "" : "s"} · {s.region}
                      <ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
                </Link>
              );
            })}
          </Reveal>
        )}
      </section>

      <section className="container-x pb-14" aria-labelledby="all-title">
        <SectionHeading title={<span id="all-title">Every station in the demo, by region</span>} description="Grouped by region, then state. Kitchens shown are demo partners, not live coverage." />
        {grouped.length === 0 ? (
          <p className="mt-6 text-muted">No station matches “{q}”.</p>
        ) : (
          <div className="mt-8 space-y-12">
            {grouped.map((g) => (
              <div key={g.id}>
                <SectionHeading size="sm" as="h3" title={`${g.id} · ${g.states.reduce((n, [, list]) => n + list.length, 0)} of ${regionCounts[g.id]} demo stations`} description={`Planned coverage: ${REGIONS.find((r) => r.id === g.id)?.states.join(", ")}.`} />
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {g.states.map(([state, list]) => (
                    <div key={state} className="rounded-3xl border border-line bg-white p-5">
                      <h4 className="text-base font-semibold text-cocoa-900">{state}</h4>
                      <ul className="mt-3 divide-y divide-line">
                        {list.map((s) => {
                          const count = restaurantsByStation(s.code).length;
                          return (
                            <li key={s.code}>
                              <Link href={`/restaurants?station=${s.code}`} className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-copper-700">
                                <MapPin className={cn("size-4 shrink-0", count ? "text-copper-600" : "text-cocoa-300")} />
                                <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                                <span className="font-mono text-[11px] text-muted max-sm:text-xs">{s.code}</span>
                                <span className={cn("text-[11px] font-semibold max-sm:text-xs", count ? "text-leaf-600" : "text-muted")}>{count ? `${count} kitchens` : "Coming soon"}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="container-x pb-24">
        <div className="grid items-center gap-8 rounded-[2.5rem] bg-cocoa-900 p-8 text-cream-50 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Not sure which station? Let your PNR decide.</h2>
            <p className="mt-3 text-cream-50/70">We check every halt on your route and show only the stations where a kitchen can reach your coach in time.</p>
            <Button href="/how-it-works" variant="glass" className="mt-6" rightIcon={<ArrowRight className="size-4" />}>
              How it works
            </Button>
          </div>
          <PnrModule dark bare />
        </div>
      </section>
    </>
  );
}
