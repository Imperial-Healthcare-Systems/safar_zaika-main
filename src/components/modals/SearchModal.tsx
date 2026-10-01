"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Search, Store, UtensilsCrossed } from "lucide-react";
import { Modal, VegDot } from "@/components/ui";
import { searchAll, type SearchResults } from "@/services";
import { useUIStore } from "@/stores";

const empty: SearchResults = { restaurants: [], dishes: [], stations: [] };

export function SearchModal() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>(empty);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      const r = await searchAll(q);
      if (alive) setResults(r);
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, open]);

  const close = () => setOpen(false);
  const total = results.restaurants.length + results.dishes.length + results.stations.length;

  return (
    <Modal open={open} onClose={close} size="lg" hideClose>
      <div className="p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-cocoa-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dishes, kitchens or stations…"
            aria-label="Search"
            className="h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-4 text-lg outline-none focus:border-copper-500 focus:ring-4 focus:ring-copper-500/15"
          />
        </div>
        <div className="mt-4 max-h-[60vh] overflow-y-auto" data-lenis-prevent>
          {q.length < 2 ? (
            <div className="flex flex-wrap gap-2 px-1 pb-2">
              {["Biryani", "Thali", "Vadodara", "Jain", "Chai", "New Delhi"].map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-line bg-cream-100 px-3 py-1.5 text-sm font-medium text-cocoa-800 hover:border-copper-300 max-lg:min-h-10">
                  {s}
                </button>
              ))}
            </div>
          ) : total === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted">Nothing matched &ldquo;{q}&rdquo;. Try a dish, cuisine or station name.</p>
          ) : (
            <div className="space-y-5">
              {results.stations.length > 0 && (
                <section>
                  <h3 className="px-2 font-sans text-sm font-semibold text-muted">Stations</h3>
                  <ul className="mt-2">
                    {results.stations.map((s) => (
                      <li key={s.code}>
                        <Link href={`/restaurants?station=${s.code}`} onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-cream-100">
                          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-cocoa-900 text-cream-50">
                            <MapPin className="size-4" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold">{s.name}</span>
                            <span className="block text-xs text-muted">
                              {s.code} · {s.city}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {results.restaurants.length > 0 && (
                <section>
                  <h3 className="px-2 font-sans text-sm font-semibold text-muted">Kitchens</h3>
                  <ul className="mt-2">
                    {results.restaurants.map((r) => (
                      <li key={r.id}>
                        <Link href={`/restaurant/${r.id}`} onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-cream-100">
                          <span className="relative size-9 overflow-hidden rounded-lg bg-cream-200">
                            <Image src={r.image} alt="" fill sizes="36px" className="object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{r.name}</span>
                            <span className="block text-xs text-muted">
                              {r.cuisines.join(", ")} · {r.stationCode}
                            </span>
                          </span>
                          <Store className="ml-auto size-4 text-cocoa-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {results.dishes.length > 0 && (
                <section>
                  <h3 className="px-2 font-sans text-sm font-semibold text-muted">Dishes</h3>
                  <ul className="mt-2">
                    {results.dishes.map(({ dish, restaurant }) => (
                      <li key={dish.id + restaurant.id}>
                        <Link href={`/restaurant/${restaurant.id}#${dish.category}`} onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-cream-100">
                          <span className="relative size-9 overflow-hidden rounded-lg bg-cream-200">
                            <Image src={dish.image} alt="" fill sizes="36px" className="object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-sm font-semibold">
                              <VegDot type={dish.veg} className="size-3" /> {dish.name}
                            </span>
                            <span className="block text-xs text-muted">
                              ₹{dish.price} · {restaurant.name}
                            </span>
                          </span>
                          <UtensilsCrossed className="ml-auto size-4 text-cocoa-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
