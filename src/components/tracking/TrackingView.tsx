"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, PackageSearch, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Select, Skeleton } from "@/components/ui";
import { JourneyStatus } from "@/components/journey/JourneyStatus";
import { useHydrated } from "@/hooks/useHydrated";
import { CANCEL_REASONS, orderStatusSteps, statusIndex } from "@/data/orders";
import { getStation } from "@/data/stations";
import { trainMap } from "@/data/trains";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatClock, formatINR, prefersReducedMotion } from "@/lib/utils";
import { cancelMockOrder, getMockOrderStatus } from "@/services";
import { toast, useOrderStore } from "@/stores";
import type { Order } from "@/types";
import { TrackingHero } from "./TrackingHero";
import { OrderTimeline } from "./OrderTimeline";
import { DeliveryDetails, OrderDetails } from "./OrderDetails";

const statusSteps = orderStatusSteps.map((s, i, all) => ({
  headline: s.label,
  sub: s.description,
  progress: i / (all.length - 1),
  tone: i === all.length - 1 ? ("success" as const) : undefined,
}));

const POLL_MS = 4000;

export function TrackingView({ id }: { id: string }) {
  const hydrated = useHydrated();
  // Selector form so status updates re-render (getOrder returns a new object after updateStatus).
  const order = useOrderStore((s) => s.getOrder(id));
  const updateStatus = useOrderStore((s) => s.updateStatus);
  const orderId = order?.id;

  useEffect(() => {
    if (!orderId) return;
    const t = setInterval(async () => {
      const current = useOrderStore.getState().getOrder(orderId);
      if (!current) return;
      const res = await getMockOrderStatus(current);
      if (res.ok && res.data.status !== current.status) updateStatus(current.id, res.data.status);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [orderId, updateStatus]);

  if (!hydrated) return <TrackingSkeleton id={id} />;
  if (!order) return <NotFound id={id} />;

  const cancelled = order.status === "cancelled";
  const stepIndex = Math.max(0, statusIndex(order.status));
  const boarding = getStation(order.boardingCode);
  const delivery = getStation(order.deliveryStationCode);
  const departure = trainMap[order.trainNumber]?.stops.find((s) => s.stationCode === order.boardingCode)?.departure ?? null;

  return (
    <>
      <TrackingHero order={order} stepIndex={stepIndex} />
      <div className="container-x py-8 sm:py-10">
        <PlacedBanner id={order.id} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <JourneyStatus
              stations={[
                { label: boarding?.name ?? order.boardingCode, sub: departure ? formatClock(departure) : undefined },
                { label: "Kitchen", sub: order.restaurantName },
                { label: "Platform", sub: "Partner" },
                { label: delivery?.name ?? order.deliveryStationCode, sub: formatClock(order.deliveryEta) },
              ]}
              steps={cancelled ? [{ headline: "Order cancelled", sub: `Reason: ${order.cancelReason ?? "not given"}. The kitchen has been told; nothing is being prepared.`, progress: 0 }] : statusSteps}
              stepIndex={cancelled ? 0 : stepIndex}
            />
            <OrderTimeline order={order} stepIndex={cancelled ? -1 : stepIndex} />
          </div>
          <div className="space-y-6">
            <OrderDetails order={order} />
            <CancelOrder order={order} />
            <DeliveryDetails order={order} />
          </div>
        </div>
      </div>
    </>
  );
}

/** Customer-side cancellation: only before the kitchen starts cooking, reason mandatory. */
function CancelOrder({ order }: { order: Order }) {
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cancellable = order.status === "confirmed" || order.status === "accepted";
  if (!cancellable) return null;
  const paid = order.payment.status === "paid";

  const confirm = async () => {
    if (!reason) {
      setError("Pick a reason so the kitchen knows why.");
      return;
    }
    setBusy(true);
    const res = await cancelMockOrder(order.id, reason);
    setBusy(false);
    if (!res.ok) {
      toast({ title: "Couldn't cancel the order", description: res.error.message, tone: "error" });
      return;
    }
    cancelOrder(order.id, res.data.reason);
    toast({ title: `Order ${order.id} cancelled`, description: paid ? `${formatINR(order.totals.total)} goes back to the source within 5-7 working days.` : "Nothing to pay.", tone: "success" });
  };

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6" aria-labelledby="cancel-title">
      <h2 id="cancel-title" className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
        Need to cancel?
      </h2>
      <p className="mt-1 text-sm text-muted">Free until the kitchen starts cooking. After that the order is already on the stove and can&apos;t be cancelled.</p>
      {open ? (
        <div className="mt-4 space-y-4">
          <Select
            label="Reason"
            placeholder="Choose a reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
            error={error}
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" loading={busy} onClick={() => void confirm()} leftIcon={<XCircle className="size-4" />}>
              Confirm cancellation
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setOpen(false)}>
              Keep my order
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
          Cancel order
        </Button>
      )}
    </section>
  );
}

function PlacedBanner({ id }: { id: string }) {
  const placed = useSearchParams().get("placed") === "1";
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!placed || prefersReducedMotion()) return;
      gsap.fromTo("[data-check]", { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(2)" });
      gsap.fromTo("[data-text]", { x: -8, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, delay: 0.15, ease: "expo.out" });
    },
    { scope: ref, dependencies: [placed] },
  );

  if (!placed) return null;
  return (
    <div ref={ref} role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-leaf-300 bg-leaf-50 px-4 py-3 text-leaf-700">
      <span data-check className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-white">
        <CheckCircle2 className="size-5" />
      </span>
      <div data-text className="min-w-0">
        <p className="font-semibold">Order received · {id}</p>
        <p className="text-[13px] text-leaf-700/80">Safar Zaika has it; once confirmed it goes to the kitchen with your coach and berth. We&apos;ll keep this page updated.</p>
      </div>
    </div>
  );
}

export function TrackingSkeleton({ id }: { id: string }) {
  return (
    <>
      <PageHeader dark compact title={<span className="block h-10 w-72 max-w-full animate-pulse rounded-xl bg-cream-50/10" />} description={`Order ${id}`} />
      <div className="container-x grid gap-6 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" role="status" aria-label="Loading order">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <>
      <PageHeader compact title="We couldn't find that order." description={`Nothing matches “${id}”. Order IDs look like SZ102948 — check your confirmation and try again.`} />
      <div className="container-x py-10">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-cream-200 text-copper-600">
            <PackageSearch className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-cocoa-900">No order with that ID</h2>
          <p className="mt-2 text-sm text-muted">Check the ID on your confirmation, or open the demo order to see tracking in action.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/track-order" variant="secondary">
              Try another ID
            </Button>
            <Button href="/track-order/SZ102948" variant="outline">
              See the demo order
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
