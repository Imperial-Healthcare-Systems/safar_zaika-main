"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Clock, MapPin, Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Input, Skeleton, Textarea } from "@/components/ui";
import { JourneyCard } from "@/components/journey/JourneyCard";
import { CartPanel } from "@/components/cart/CartPanel";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";
import { useHydrated } from "@/hooks/useHydrated";
import { getStation } from "@/data/stations";
import { trainMap } from "@/data/trains";
import { createMockOrder, PHONE_REGEX } from "@/services";
import { selectCartTotals, selectSelectedStation, toast, useAuthStore, useCartStore, useJourneyStore, useOrderStore, useUIStore } from "@/stores";
import { formatClock } from "@/lib/utils";
import type { PaymentMethod } from "@/types";
import { CouponField } from "./CouponField";
import { OrderSummary } from "./OrderSummary";
import { PaymentMethods } from "./PaymentMethods";
import { PlacingOverlay } from "./PlacingOverlay";

const header = (
  <PageHeader compact title="Almost at your seat." description="Confirm who's travelling, where we hand over, and whether you pay now or at the seat. Takes about a minute." />
);

export function CheckoutView() {
  const hydrated = useHydrated();
  const count = useCartStore((s) => s.items.length);
  // Lives here (not in the form) so the overlay survives the cart being cleared after a successful order.
  const [placing, setPlacing] = useState(false);

  return (
    <>
      {placing && <PlacingOverlay />}
      {!hydrated ? (
        <>
          {header}
          <div className="container-x grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_380px]" role="status" aria-label="Loading checkout">
            <div className="space-y-5">
              <Skeleton className="h-48 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </>
      ) : count === 0 && !placing ? (
        <>
          {header}
          <div className="container-x py-10">
            <div className="mx-auto flex max-w-md rounded-3xl border border-line bg-white shadow-card">
              <CartPanel />
            </div>
          </div>
        </>
      ) : (
        <CheckoutForm placing={placing} setPlacing={setPlacing} />
      )}
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6" aria-labelledby={`checkout-section-${n}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-cocoa-900 font-display text-sm font-semibold text-cream-50">{n}</span>
        <h2 id={`checkout-section-${n}`} className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

type Field = "name" | "phone" | "coach" | "berth" | "terms";

function CheckoutForm({ placing, setPlacing }: { placing: boolean; setPlacing: (v: boolean) => void }) {
  const router = useRouter();
  const journey = useJourneyStore((s) => s.journey);
  const selected = useJourneyStore(selectSelectedStation);
  const user = useAuthStore((s) => s.user);
  const guest = useAuthStore((s) => s.guest);
  const { items, restaurantId, restaurantName, stationCode, couponCode, clear } = useCartStore();
  const totals = useCartStore(selectCartTotals);

  // Only mounted once the persisted stores are hydrated, so initialisers see real data.
  const p0 = journey?.passengers[0];
  const [name, setName] = useState(p0?.name ?? user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [coach, setCoach] = useState(p0?.coach ?? "");
  const [berth, setBerth] = useState(p0?.berth ?? "");
  const [instructions, setInstructions] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const station = selected?.station ?? (stationCode ? getStation(stationCode) : undefined);
  const stop = selected?.stop ?? (journey && station ? trainMap[journey.trainNumber]?.stops.find((s) => s.stationCode === station.code) : undefined);

  const clearError = (f: Field) => setErrors((e) => (e[f] ? { ...e, [f]: undefined } : e));

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) e.name = "Enter the passenger's name as on the ticket.";
    if (!PHONE_REGEX.test(phone)) e.phone = "Enter a valid 10-digit mobile number.";
    if (!coach.trim()) e.coach = "Coach is required.";
    if (!berth.trim()) e.berth = "Berth is required.";
    if (!terms) e.terms = "Please accept the terms to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!restaurantId || !restaurantName) return;
    setPlacing(true);
    const res = await createMockOrder({
      items,
      restaurantId,
      restaurantName,
      trainNumber: journey?.trainNumber ?? "—",
      trainName: journey?.trainName ?? "—",
      journeyDate: journey?.date ?? "—",
      boardingCode: journey?.from ?? stationCode ?? "—",
      deliveryStationCode: station?.code ?? stationCode ?? "—",
      deliveryEta: stop?.arrival ?? "",
      passenger: { name: name.trim(), phone, coach: coach.trim().toUpperCase(), berth: berth.trim() },
      paymentMethod: method,
      couponCode,
    });
    if (!res.ok) {
      setPlacing(false);
      toast({ title: "Couldn't place your order", description: res.error.message, tone: "error" });
      return;
    }
    useOrderStore.getState().addOrder(res.data);
    clear();
    toast({ title: `Order ${res.data.id} confirmed`, description: "The kitchen has been notified. Track it live.", tone: "success" });
    router.push(`/track-order/${res.data.id}?placed=1`);
  };

  const confirm = () => {
    if (!validate()) {
      toast({ title: "A few details are missing", description: "Check the highlighted fields and try again.", tone: "error" });
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (!user && !guest) {
      useUIStore.getState().openLogin(() => void placeOrder());
      return;
    }
    void placeOrder();
  };

  return (
    <>
      {header}
      <div className="container-x grid gap-8 pb-32 pt-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10 max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base">
        <div className="space-y-5">
          <Section n={1} title="Journey">
            {journey ? (
              <JourneyCard journey={journey} compact />
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-cream-100 p-4 text-sm text-muted">
                No journey attached.{" "}
                <Link href="/order" className="font-semibold text-copper-600 hover:underline">
                  Add your PNR or train
                </Link>{" "}
                so we can time the hand-over to your halt.
              </div>
            )}
          </Section>

          <Section n={2} title="Passenger details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Passenger name"
                placeholder="As on the ticket"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                error={errors.name}
                className="sm:col-span-2"
              />
              <Input
                label="Mobile number"
                placeholder="10-digit number"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  clearError("phone");
                }}
                leftIcon={<span className="text-sm font-semibold text-cocoa-700">+91</span>}
                error={errors.phone}
                hint="Our partner calls this number on the platform."
                className="sm:col-span-2"
              />
              <Input
                label="Coach"
                placeholder="e.g. B4"
                autoComplete="off"
                value={coach}
                onChange={(e) => {
                  setCoach(e.target.value.toUpperCase());
                  clearError("coach");
                }}
                error={errors.coach}
              />
              <Input
                label="Berth / seat"
                placeholder="e.g. 23"
                autoComplete="off"
                value={berth}
                onChange={(e) => {
                  setBerth(e.target.value);
                  clearError("berth");
                }}
                error={errors.berth}
              />
            </div>
          </Section>

          <Section n={3} title="Delivery">
            {station ? (
              <div className="flex items-start gap-3 rounded-2xl bg-cream-100 p-4">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-copper-500 text-cream-50">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cocoa-900">
                    {station.name} <span className="text-muted">({station.code})</span>
                  </p>
                  {station.city && (
                    <p className="text-[13px] text-muted">
                      {station.city}, {station.state}
                    </p>
                  )}
                  {stop && (
                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-copper-600" />
                        <dt className="text-muted">Arrives</dt>
                        <dd className="font-semibold text-cocoa-900">{formatClock(stop.arrival)}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Timer className="size-3.5 text-copper-600" />
                        <dt className="text-muted">Halt</dt>
                        <dd className="font-semibold text-cocoa-900">{stop.halt} min</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">We&apos;ll deliver at the station your restaurant serves.</p>
            )}
            <Textarea
              label="Delivery instructions"
              placeholder="Side lower berth near door 2, call before boarding…"
              hint="Optional. Shared with your delivery partner."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-4"
              maxLength={200}
            />
          </Section>

          <Section n={4} title="Coupon">
            <CouponField />
          </Section>

          <Section n={5} title="Payment method">
            <PaymentMethods value={method} onChange={setMethod} />
          </Section>

          <Section n={6} title="Terms">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-cocoa-800">
              <input
                type="checkbox"
                checked={terms}
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? "terms-error" : undefined}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  clearError("terms");
                }}
                className="mt-0.5 size-5 shrink-0 rounded accent-copper-500"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="font-semibold text-copper-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and the{" "}
                <Link href="/cancellation" className="font-semibold text-copper-600 hover:underline">
                  Cancellation policy
                </Link>
                . Delivery times depend on the train running on schedule.
              </span>
            </label>
            {errors.terms && (
              <p id="terms-error" role="alert" className="mt-2 text-[13px] font-medium text-chili-600">
                {errors.terms}
              </p>
            )}
          </Section>
        </div>

        <OrderSummary method={method} onConfirm={confirm} loading={placing} className="lg:sticky lg:top-28" />
      </div>

      {/* Mobile: fixed confirm bar (the global cart bar is hidden on /checkout). */}
      <div className="fixed inset-x-0 bottom-0 z-sticky border-t border-line glass-light px-4 pt-3 md:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[12px] font-semibold text-muted">{method === "cod" ? "Pay at seat" : "To pay"}</p>
            <p className="font-display text-xl font-bold tabular-nums text-cocoa-900">
              <AnimatedNumber value={totals.total} format={(n) => `₹${Math.round(n)}`} />
            </p>
          </div>
          <Button size="lg" onClick={confirm} loading={placing} className="flex-1 uppercase tracking-[0.1em]">
            Confirm order
          </Button>
        </div>
      </div>
    </>
  );
}
