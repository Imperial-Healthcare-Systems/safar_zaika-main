"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Clock3, Leaf, MapPin, PauseCircle, ShieldCheck, Store, TrainFront } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, FreeMode, Keyboard, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { scrollToTarget } from "@/lib/lenis";
import { cn, formatClock } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { Badge, Button, Chip, Rating, Skeleton } from "@/components/ui";
import { PnrModule } from "@/components/pnr/PnrModule";
import { FoodCard } from "./FoodCard";
import { availabilityLabel } from "@/components/restaurant/RestaurantCard";
import { getMenu, getRestaurantAvailability, type RestaurantMenu } from "@/services";
import { getStation } from "@/data/stations";
import { selectSelectedStation, useJourneyStore } from "@/stores";
import { useDeliveryMoment } from "@/stores/journeyStore";

export function RestaurantMenuView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const [menu, setMenu] = useState<{ id: string; data: RestaurantMenu | null } | null>(null);
  const [active, setActive] = useState<string>("");
  const [vegOnly, setVegOnly] = useState(false);
  const [jainOnly, setJainOnly] = useState(false);
  const isMobile = useIsMobile();
  const sectionsRef = useRef<HTMLDivElement>(null);
  const journey = useJourneyStore((s) => s.journey);
  const selected = useJourneyStore(selectSelectedStation);
  const eligible = useJourneyStore((s) => s.eligible);
  const selectStation = useJourneyStore((s) => s.selectStation);

  const loading = menu?.id !== id;

  useEffect(() => {
    let alive = true;
    getMenu(id).then((res) => {
      if (alive) setMenu({ id, data: res.ok ? res.data : null });
    });
    return () => {
      alive = false;
    };
  }, [id]);

  // Scroll-spy for the sticky category nav.
  useEffect(() => {
    const root = sectionsRef.current;
    if (!root || loading) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-menu-section]"));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("sec-", ""));
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [loading, vegOnly, jainOnly]);

  const data = !loading ? menu?.data : null;
  const restaurant = data?.restaurant;
  const station = restaurant ? getStation(restaurant.stationCode) : undefined;
  const moment = useDeliveryMoment(restaurant?.stationCode);
  const avail = restaurant && moment ? getRestaurantAvailability(restaurant, moment) : null;
  const blocked = avail ? !avail.open : false;
  const blockReason = restaurant && !restaurant.live ? "Kitchen paused today" : moment?.source === "arrival" ? "Kitchen closed at your arrival" : "Kitchen closed right now";

  const filteredSections = useMemo(() => {
    if (!data) return [];
    return data.sections
      .map((s) => ({ ...s, dishes: s.dishes.filter((d) => (!vegOnly || d.veg === "veg") && (!jainOnly || d.jain)) }))
      .filter((s) => s.dishes.length > 0);
  }, [data, vegOnly, jainOnly]);

  const routeMatch = hydrated && restaurant ? eligible.find((e) => e.station.code === restaurant.stationCode) : undefined;
  const deliveringHere = hydrated && selected?.station.code === restaurant?.stationCode ? selected : null;

  if (!loading && !restaurant) {
    return (
      <section className="container-x pt-40 pb-24 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-cream-200 text-copper-600">
          <Store className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold">We couldn&apos;t find that restaurant.</h1>
        <p className="mt-2 text-muted">It may have moved stations or gone offline for the day.</p>
        <Button href="/restaurants" className="mt-6" rightIcon={<ArrowRight className="size-4" />}>
          Browse kitchens
        </Button>
      </section>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden bg-cocoa-900 pt-28 text-cream-50 sm:pt-32">
        <div className="absolute inset-0">
          {restaurant ? <Image src={restaurant.image} alt="" fill priority sizes="100vw" className={cn("object-cover opacity-50", blocked && "grayscale")} /> : <div className="absolute inset-0 skeleton" />}
          <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950 via-cocoa-950/70 to-cocoa-950/30" />
        </div>
        <div className="container-x relative pb-8 pt-16 max-sm:pt-8 sm:pb-10 sm:pt-24">
          {restaurant ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {restaurant.pureVeg && <Badge tone="leaf">Pure veg</Badge>}
                  {restaurant.featured && <Badge tone="gold">Top pick</Badge>}
                  <Badge tone="glass">
                    <MapPin className="size-3" /> {station?.name ?? restaurant.stationCode} · {restaurant.distanceKm} km from platform
                  </Badge>
                </div>
                <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">{restaurant.name}</h1>
                <p className="mt-2 text-cream-50/70">{restaurant.cuisines.join(" · ")}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <Rating light value={restaurant.rating} count={restaurant.ratingCount} />
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-4 text-gold-400" /> {restaurant.prepTimeMin} min prep
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-gold-400" /> {restaurant.deliveryConfidence}% on-time
                  </span>
                  <span className="text-cream-50/70">₹{restaurant.priceForTwo} for two · {restaurant.openHours}</span>
                </div>
              </div>

              <div className="w-full rounded-2xl glass p-4 lg:w-80">
                {deliveringHere ? (
                  <>
                    <p className="text-sm font-semibold text-gold-400">Delivering to your seat</p>
                    <p className="mt-1.5 flex items-center gap-2 font-semibold">
                      <TrainFront className="size-4 text-gold-400" /> {journey?.trainNumber} · {deliveringHere.station.name}
                    </p>
                    <p className="mt-1 text-sm text-cream-50/70">
                      Arrives {formatClock(deliveringHere.stop.arrival)} · departs {formatClock(deliveringHere.stop.departure)} · {deliveringHere.stop.halt} min halt
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-leaf-500/20 px-2.5 py-1 text-[12px] font-semibold text-leaf-300">
                      <ShieldCheck className="size-3.5" /> Order by {leadTime(deliveringHere.stop.arrival)} for this halt
                    </p>
                  </>
                ) : routeMatch && routeMatch.availability === "available" ? (
                  <>
                    <p className="text-sm font-semibold text-gold-400">On your route</p>
                    <p className="mt-1.5 text-sm text-cream-50/80">
                      Your train halts here at {formatClock(routeMatch.stop.arrival)}. Deliver this order to {routeMatch.station.name}?
                    </p>
                    <Button size="sm" variant="light" className="mt-3" onClick={() => selectStation(routeMatch.station.code)}>
                      Deliver here
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gold-400">Delivery station</p>
                    <p className="mt-1.5 text-sm text-cream-50/80">
                      {hydrated && journey ? `${station?.name ?? restaurant.stationCode} isn't on your current route. You can still browse the menu.` : `Check your PNR to see when your train reaches ${station?.name ?? restaurant.stationCode}.`}
                    </p>
                    {!(hydrated && journey) && (
                      <Button size="sm" variant="light" className="mt-3" href="/order">
                        Check my journey
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40 bg-cream-50/10" />
              <Skeleton className="h-14 w-2/3 bg-cream-50/10" />
              <Skeleton className="h-5 w-1/3 bg-cream-50/10" />
            </div>
          )}
        </div>
      </section>

      {/* Vendor availability banner */}
      {restaurant && avail && moment && !avail.open && (
        <div role="status" className={cn("border-b", restaurant.live ? "border-line bg-cream-200 text-cocoa-800" : "border-chili-100 bg-chili-50 text-chili-600")}>
          <div className="container-x flex items-start gap-3 py-3 text-sm">
            {restaurant.live ? <Clock3 className="mt-0.5 size-4 shrink-0" /> : <PauseCircle className="mt-0.5 size-4 shrink-0" />}
            <p>
              <span className="font-semibold">{availabilityLabel(restaurant, avail, moment)}.</span>{" "}
              {restaurant.live
                ? `${restaurant.name} isn't cooking for that time, so ordering is off. Browse the menu, or pick another halt on your route.`
                : `${restaurant.pausedReason ?? "The kitchen switched itself off"} — ordering is off until they switch back on. Browse the menu, or pick another kitchen.`}
            </p>
          </div>
        </div>
      )}

      {/* Sticky category nav */}
      <div className="sticky top-16 z-sticky border-b border-line bg-cream-50/92 backdrop-blur">
        <div className="container-x flex items-center gap-3 py-2.5">
          <div className="no-scrollbar flex flex-1 snap-x gap-2 overflow-x-auto">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)
              : filteredSections.map((s) => (
                  <Chip key={s.id} active={active === s.id} onClick={() => scrollToTarget(`#sec-${s.id}`, -150)}>
                    {s.label}
                  </Chip>
                ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <Chip active={vegOnly} onClick={() => setVegOnly((v) => !v)} icon={<Leaf className="size-3.5" />}>
              Veg
            </Chip>
            <Chip active={jainOnly} onClick={() => setJainOnly((v) => !v)}>
              Jain
            </Chip>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div ref={sectionsRef} className="container-x space-y-14 pb-32 pt-10">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-line bg-white">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-semibold">No dishes match those filters.</h2>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setVegOnly(false);
                setJainOnly(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filteredSections.map((section) => (
            <section key={section.id} id={`sec-${section.id}`} data-menu-section className="scroll-mt-40" aria-labelledby={`h-${section.id}`}>
              <div className="flex items-end justify-between">
                <h2 id={`h-${section.id}`} className="font-display text-2xl font-semibold text-cocoa-900 sm:text-3xl">
                  {section.label}
                </h2>
                <span className="text-sm text-muted">
                  {section.dishes.length} item{section.dishes.length === 1 ? "" : "s"}
                </span>
              </div>
              {section.id === "popular" && isMobile ? (
                <div className="-mx-4 mt-5 pl-4">
                  <Swiper modules={[FreeMode, Mousewheel, Keyboard, A11y]} freeMode mousewheel={{ forceToAxis: true }} keyboard={{ enabled: true }} slidesPerView="auto" spaceBetween={14} className="!overflow-visible">
                    {section.dishes.map((d) => (
                      <SwiperSlide key={d.id} className="!h-auto !w-[260px]">
                        <FoodCard dish={d} restaurant={restaurant!} disabled={blocked} disabledReason={blockReason} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className={cn("mt-5 grid gap-4", section.id === "popular" ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
                  {section.dishes.map((d) => (
                    <FoodCard key={d.id} dish={d} restaurant={restaurant!} variant={section.id === "popular" ? "vertical" : "row"} disabled={blocked} disabledReason={blockReason} />
                  ))}
                </div>
              )}
            </section>
          ))
        )}

        {!loading && !(hydrated && journey) && (
          <section className="grid items-center gap-8 rounded-[2.5rem] bg-cocoa-900 p-8 text-cream-50 sm:p-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold">Add your journey so we can time the kitchen.</h2>
              <p className="mt-3 text-cream-50/70">You can fill the cart now — we&apos;ll ask for the train at checkout if you skip this.</p>
              <Link href="/stations" className="mt-4 inline-block text-sm font-semibold text-gold-300 hover:underline">
                Browse other stations →
              </Link>
            </div>
            <PnrModule dark bare />
          </section>
        )}
      </div>
    </>
  );
}

function leadTime(arrival: string | null) {
  if (!arrival) return "—";
  const [h, m] = arrival.split(":").map(Number);
  const total = (h * 60 + m - 45 + 1440) % 1440;
  return formatClock(`${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`);
}
