"use client";

import { useState } from "react";
import { offers } from "@/data/offers";
import { Chip } from "@/components/ui";
import type { OfferType } from "@/types";
import { OfferCard } from "./OfferCard";

type Filter = OfferType | "all";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "first-order", label: "First order" },
  { value: "percent", label: "Percent off" },
  { value: "flat", label: "Flat off" },
  { value: "free-delivery", label: "Free delivery" },
  { value: "station", label: "Station specials" },
  { value: "bulk", label: "Groups" },
];

export function OffersGrid() {
  const [filter, setFilter] = useState<Filter>("all");
  const list = filter === "all" ? offers : offers.filter((o) => o.type === filter);

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 scroll-px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter offers">
        {filters.map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {list.map((o) => (
          <OfferCard key={o.code} offer={o} />
        ))}
      </div>
      {list.length === 0 && <p className="mt-8 text-center text-muted">No offers in this category right now.</p>}
    </div>
  );
}
