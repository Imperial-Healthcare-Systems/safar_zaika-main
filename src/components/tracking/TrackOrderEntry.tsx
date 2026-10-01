"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronRight, PackageSearch, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Chip, Input, Skeleton } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";
import { orderStatusSteps } from "@/data/orders";
import { formatINR } from "@/lib/utils";
import { useOrderStore } from "@/stores";

const DEMO_ID = "SZ102948";

export function TrackOrderEntry() {
  const router = useRouter();
  const hydrated = useHydrated();
  const orders = useOrderStore((s) => s.orders);
  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const clean = id.trim().toUpperCase();
    if (!clean) {
      setError("Enter your order ID to continue.");
      return;
    }
    router.push(`/track-order/${clean}`);
  };

  return (
    <>
      <PageHeader compact title="Where's my meal?" description="Enter your order ID to follow it live, from the kitchen to the platform to your berth." />

      <div className="container-x grid gap-8 py-10 lg:grid-cols-2 lg:gap-12">
        <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7" aria-labelledby="track-title">
          <h2 id="track-title" className="font-display text-2xl font-semibold tracking-tight text-cocoa-900">
            Find your order
          </h2>
          <p className="mt-1 text-sm text-muted">The ID is in your confirmation message and in recent orders.</p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              label="Order ID"
              placeholder="SZ102948"
              value={id}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(e) => {
                setId(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              error={error}
              leftIcon={<Search className="size-4" />}
              inputClassName="font-display text-xl font-semibold tracking-[0.12em] placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            />
            <Chip
              active={id === DEMO_ID}
              icon={<Sparkles className="size-3.5" />}
              onClick={() => {
                setId(DEMO_ID);
                setError(null);
              }}
            >
              Try the demo order {DEMO_ID}
            </Chip>
            <Button type="submit" full size="xl" className="uppercase tracking-[0.1em]" rightIcon={<ArrowRight className="size-4" />}>
              Track
            </Button>
          </form>
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="font-display text-2xl font-semibold tracking-tight text-cocoa-900">
            Recent orders
          </h2>
          {!hydrated ? (
            <div className="mt-5 space-y-3" role="status" aria-label="Loading recent orders">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-3xl border border-dashed border-line bg-cream-100 px-6 py-10 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-white text-copper-600 shadow-card">
                <PackageSearch className="size-6" />
              </span>
              <p className="mt-4 font-display text-xl font-semibold text-cocoa-900">No orders yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted">Orders you place on this device will show up here for one-tap tracking.</p>
              <Button href="/order" variant="secondary" className="mt-5" rightIcon={<ArrowRight className="size-4" />}>
                Start an order
              </Button>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.map((o) => {
                const step = orderStatusSteps.find((s) => s.key === o.status);
                return (
                  <li key={o.id}>
                    <Link
                      href={`/track-order/${o.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition-[transform,box-shadow] duration-300 ease-(--ease-out-quart) hover:-translate-y-0.5 hover:shadow-lift"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-lg font-semibold tracking-[0.04em] text-cocoa-900">{o.id}</p>
                          <Badge tone={o.status === "delivered" ? "leaf" : o.status === "cancelled" ? "chili" : "copper"}>{step?.label ?? "Cancelled"}</Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {o.restaurantName} · {o.items.reduce((n, i) => n + i.quantity, 0)} items
                        </p>
                      </div>
                      <p className="shrink-0 font-bold tabular-nums text-cocoa-900">{formatINR(o.totals.total)}</p>
                      <ChevronRight className="size-5 shrink-0 text-cocoa-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
