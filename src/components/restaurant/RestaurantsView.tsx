"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Leaf, MapPin, Search, SlidersHorizontal, Store, X } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, formatClock, prefersReducedMotion } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Chip, Input, Modal, Select, SkeletonGrid } from "@/components/ui";
import { RestaurantCard } from "./RestaurantCard";
import { MEALS, getRestaurantAvailability, getRestaurants, type RestaurantFilters } from "@/services";
import { getStation, stations } from "@/data/stations";
import { selectSelectedStation, useCartStore, useJourneyStore } from "@/stores";
import { useDeliveryMoment } from "@/stores/journeyStore";
import type { Restaurant } from "@/types";

const categoryChips = [
  { id: "all", label: "All" },
  { id: "thali", label: "Thali" },
  { id: "biryani", label: "Biryani" },
  { id: "north-indian", label: "North Indian" },
  { id: "south-indian", label: "South Indian" },
  { id: "snacks", label: "Snacks" },
  { id: "breakfast", label: "Breakfast" },
  { id: "jain", label: "Jain" },
  { id: "chinese", label: "Chinese" },
  { id: "beverages", label: "Beverages" },
  { id: "desserts", label: "Desserts" },
];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "prep", label: "Fastest prep" },
  { value: "price", label: "Price: low to high" },
];

const switchClass =
  "relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-cream-300 transition-colors before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:duration-200 checked:bg-leaf-600 checked:before:translate-x-5";

export function RestaurantsView() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const stationParam = params.get("station");
  const categoryParam = params.get("category") ?? "all";
  const mealParam = params.get("meal");
  const meal = MEALS.find((m) => m.id === mealParam);
  const mealId = meal?.id;
  /** Same page with some params changed (null removes one), so station and meal survive each other. */
  const withParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) if (v === null) next.delete(k);
    else next.set(k, v);
    return `/restaurants?${next}`;
  };
  const journey = useJourneyStore((s) => s.journey);
  const journeyStation = useJourneyStore(selectSelectedStation);
  const cartStation = useCartStore((s) => s.stationCode);
  const stationCode = stationParam ?? (hydrated ? (journeyStation?.station.code ?? cartStation ?? null) : null);
  const moment = useDeliveryMoment(stationCode);

  const [category, setCategory] = useState(categoryParam === "veg" ? "all" : categoryParam);
  const [pureVeg, setPureVeg] = useState(categoryParam === "veg");
  const [sort, setSort] = useState<NonNullable<RestaurantFilters["sort"]>>("recommended");
  const [query, setQuery] = useState("");
  // null = untouched: on when a journey exists, off otherwise.
  const [openOnly, setOpenOnly] = useState<boolean | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [result, setResult] = useState<{ key: string; list: Restaurant[] } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const key = `${stationCode}|${category}|${pureVeg}|${sort}|${query}|${mealId}`;
  const loading = Boolean(stationCode) && result?.key !== key;

  useEffect(() => {
    if (!stationCode) return;
    let alive = true;
    getRestaurants(stationCode, { category, pureVeg, sort, query, meal: mealId }).then((res) => {
      if (alive && res.ok) setResult({ key, list: res.data });
    });
    return () => {
      alive = false;
    };
  }, [stationCode, category, pureVeg, sort, query, mealId, key]);

  useGSAP(
    () => {
      if (loading || !gridRef.current || prefersReducedMotion()) return;
      gsap.from(gridRef.current.children, { autoAlpha: 0, y: 24, stagger: 0.05, duration: 0.7, ease: "expo.out", clearProps: "all" });
    },
    { scope: gridRef, dependencies: [result?.key, openOnly] },
  );

  if (!hydrated) return <PageHeader compact title="Finding kitchens…" />;

  if (!stationCode) {
    const popular = stations.filter((s) => s.popular);
    return (
      <>
        <PageHeader
          compact
          title="Which station are you eating at?"
          description="Pick a station to see its kitchens, or check your PNR to see only the stations on your route."
          actions={
            <Button href="/order" rightIcon={<ArrowRight className="size-4" />}>
              Check my PNR
            </Button>
          }
        />
        <section className="container-x pb-20 pt-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {popular.map((s) => (
              <Link key={s.code} href={withParams({ station: s.code })} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-card">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-cocoa-900 text-cream-50">
                  <MapPin className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-cocoa-900">{s.name}</span>
                  <span className="block text-xs text-muted">{s.code}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Looking for another station? <Link href="/stations" className="font-semibold text-copper-700 hover:underline">Browse all stations</Link>.
          </p>
        </section>
      </>
    );
  }

  const station = getStation(stationCode);
  const onRoute = journeyStation?.station.code === stationCode ? journeyStation : null;
  const list = result?.key === key ? result.list : [];
  const showOpenOnly = openOnly ?? Boolean(journey);
  const whenLabel = moment?.source === "arrival" ? `at your ${formatClock(moment.hhmm)} arrival` : "now";

  // Open-first, then the service order; the toggle hides closed and paused kitchens.
  const evaluated = list.map((r) => ({ r, open: moment ? getRestaurantAvailability(r, moment).open : true }));
  const sorted = [...evaluated].sort((a, b) => Number(b.open) - Number(a.open));
  const shown = showOpenOnly ? sorted.filter((x) => x.open) : sorted;
  const openCount = evaluated.filter((x) => x.open).length;
  const filtersOn = category !== "all" || pureVeg || query || meal;

  return (
    <>
      <PageHeader
        compact
        title={`${meal ? `${meal.label} kitchens` : "Kitchens"} at ${station?.name ?? stationCode}`}
        description={
          onRoute
            ? `Your train arrives at ${formatClock(onRoute.stop.arrival)} with a ${onRoute.stop.halt}-minute halt. Every kitchen here is 2-3 km from the platform and cooks to that time.`
            : station?.tagline
              ? `${station.tagline}. Partner kitchens 2-3 km from the platform, timed to your halt.`
              : "Partner kitchens 2-3 km from the platform, timed to your halt."
        }
        actions={
          <Select
            aria-label="Change station"
            value={stationCode}
            onChange={(e) => router.push(withParams({ station: e.target.value }))}
            options={stations.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))}
            className="w-64 max-lg:[&_select]:text-base"
          />
        }
      />

      <section className="container-x pb-24 pt-6">
        <div className="sticky top-[60px] z-sticky -mx-4 lg:top-16 bg-cream-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="flex items-center gap-3">
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[13px] font-semibold text-cocoa-800">
              <input type="checkbox" role="switch" checked={showOpenOnly} onChange={(e) => setOpenOnly(e.target.checked)} className={switchClass} />
              {moment?.source === "arrival" ? "Open at arrival" : "Open now"}
            </label>
            <span aria-hidden className="h-6 w-px shrink-0 bg-line" />
            <div className="no-scrollbar flex flex-1 snap-x gap-2 overflow-x-auto">
              {meal && (
                <Chip active onClick={() => router.push(withParams({ meal: null }))}>
                  {meal.label}
                  <X className="size-3.5" aria-hidden />
                  <span className="sr-only">, clear</span>
                </Chip>
              )}
              <Chip active={pureVeg} onClick={() => setPureVeg((v) => !v)} icon={<Leaf className="size-3.5" />}>
                Pure veg
              </Chip>
              {categoryChips.map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search kitchens" leftIcon={<Search className="size-4" />} aria-label="Search kitchens" inputClassName="h-9 w-48 rounded-full text-sm" />
              <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} options={sortOptions} className="w-44 [&_select]:h-9 [&_select]:rounded-full [&_select]:text-sm" />
            </div>
            {/* phones and tablets: search + sort in a bottom sheet */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Search and sort kitchens"
              className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-cocoa-700 lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              {(query || sort !== "recommended") && <span aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-copper-500" />}
            </button>
          </div>
        </div>

        <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} variant="sheet" title="Search and sort">
          <div className="space-y-4 px-6 pb-6 pt-4 max-lg:[&_input]:text-base max-lg:[&_select]:text-base">
            <Input label="Search kitchens" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, cuisine or dish" leftIcon={<Search className="size-4" />} />
            <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} options={sortOptions} />
            <Button full size="lg" onClick={() => setFiltersOpen(false)}>
              Show {shown.length} kitchen{shown.length === 1 ? "" : "s"}
            </Button>
          </div>
        </Modal>

        <div className="mt-6">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <span className="inline-flex size-16 items-center justify-center rounded-full bg-cream-200 text-copper-700">
                <Store className="size-7" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-cocoa-900">
                {list.length > 0 ? `No kitchen is open ${whenLabel}.` : "Nothing available at this station yet."}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                {list.length > 0 ? `${list.length} kitchen${list.length === 1 ? " is" : "s are"} listed here but closed or paused for that time. ` : filtersOn ? "Try clearing a filter, or " : "We're onboarding kitchens here. Meanwhile, "}
                {list.length > 0 ? "Browse them anyway, or pick another halt." : "pick another station on your route."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {list.length > 0 && (
                  <Button variant="outline" onClick={() => setOpenOnly(false)}>
                    Show closed kitchens
                  </Button>
                )}
                {filtersOn && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategory("all");
                      setPureVeg(false);
                      setQuery("");
                      if (meal) router.push(withParams({ meal: null }));
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                <Button href="/journey" rightIcon={<ArrowRight className="size-4" />}>
                  Back to my route
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {moment ? `${openCount} of ${list.length}` : list.length} kitchen{list.length === 1 ? "" : "s"} {meal ? `serving ${meal.label.toLowerCase()} ` : ""}{pureVeg ? "serving pure veg " : ""}
                {moment ? `open ${whenLabel}` : `at ${station?.name}`}
                {showOpenOnly && openCount < list.length ? ` · ${list.length - openCount} hidden` : ""}
              </p>
              <div ref={gridRef} className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3")}>
                {shown.map(({ r }) => (
                  <RestaurantCard key={r.id} restaurant={r} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
