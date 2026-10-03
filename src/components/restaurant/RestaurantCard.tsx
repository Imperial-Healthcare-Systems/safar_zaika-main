"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import { Badge, Rating } from "@/components/ui";
import { getStation } from "@/data/stations";
import { cn, formatClock } from "@/lib/utils";
import { getRestaurantAvailability, type Availability, type DeliveryMoment } from "@/services";
import { useDeliveryMoment } from "@/stores/journeyStore";
import type { Restaurant } from "@/types";

/** One line for a kitchen's state at the delivery moment, e.g. "Open at your 9:08 PM arrival". */
export function availabilityLabel(r: Restaurant, a: Availability, moment: DeliveryMoment) {
  const atArrival = moment.source === "arrival";
  if (a.open) return atArrival ? `Open at your ${formatClock(moment.hhmm)} arrival` : "Open now";
  if (!r.live) return "Paused today";
  if (a.nextOpen) return `Closed at ${atArrival ? "your arrival" : "this time"} · opens ${formatClock(a.nextOpen)}`;
  return a.reason ?? "Closed";
}

export function RestaurantCard({ restaurant, className, showStation }: { restaurant: Restaurant; className?: string; showStation?: boolean }) {
  const r = restaurant;
  const station = getStation(r.stationCode);
  const moment = useDeliveryMoment(r.stationCode);
  const avail = moment ? getRestaurantAvailability(r, moment) : null;
  const dim = avail ? !avail.open : false;
  return (
    <Link
      href={`/restaurant/${r.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-line/80 bg-white shadow-card transition-[transform,box-shadow] duration-400 ease-(--ease-out-quart) hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <Image
          src={r.image}
          alt={`${r.name} food`}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className={cn("object-cover transition-transform duration-700 ease-(--ease-out-quart) group-hover:scale-[1.06]", dim && "opacity-70 grayscale")}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cocoa-950/70 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {r.pureVeg && <Badge tone="leaf">Pure veg</Badge>}
          {r.featured && <Badge tone="gold">Top pick</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-cream-50">
          <Clock3 className="size-3.5" />
          <span className="text-[12px] font-semibold">{r.prepTimeMin} min prep</span>
        </div>
        <span className="absolute bottom-3 right-3 inline-flex size-9 items-center justify-center rounded-full bg-cream-50 text-cocoa-900 opacity-0 transition-[opacity,transform] duration-300 group-hover:opacity-100">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className={cn("flex flex-1 flex-col p-4", dim && "opacity-80")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight text-cocoa-900">{r.name}</h3>
          <Rating value={r.rating} count={r.ratingCount} className="shrink-0" />
        </div>
        <p className="mt-1 truncate text-[13px] text-muted">{r.cuisines.join(" · ")}</p>
        {avail && moment && (
          <span
            title={avail.reason}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[12px] font-semibold",
              avail.open ? "bg-leaf-50 text-leaf-700" : r.live ? "bg-cream-100 text-muted" : "bg-chili-50 text-chili-600",
            )}
          >
            <span aria-hidden className={cn("size-1.5 rounded-full", avail.open ? "bg-leaf-500" : r.live ? "bg-cocoa-300" : "bg-chili-500")} />
            {availabilityLabel(r, avail, moment)}
          </span>
        )}
        <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
          <span>₹{r.priceForTwo} for two</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {r.distanceKm} km {showStation && station ? `· ${station.name}` : "from the platform"}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold max-sm:text-xs">
            <span className="text-muted">Delivery confidence</span>
            <span className={r.deliveryConfidence >= 93 ? "text-leaf-600" : "text-copper-700"}>{r.deliveryConfidence}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-200">
            <div className={cn("h-full rounded-full", r.deliveryConfidence >= 93 ? "bg-leaf-500" : "bg-copper-400")} style={{ width: `${r.deliveryConfidence}%` }} />
          </div>
        </div>
        {r.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {r.tags.slice(0, 3).map((t) => (
              <li key={t} className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-semibold text-cocoa-700 max-sm:text-xs">
                {t}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-4 text-[13px] font-bold text-copper-700">{dim ? "Browse the menu →" : "View menu →"}</span>
      </div>
    </Link>
  );
}
