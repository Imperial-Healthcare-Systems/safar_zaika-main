"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, TicketPercent } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { evaluateCoupon, validateCoupon } from "@/services";
import { selectCartTotals, useCartStore } from "@/stores";

export function CouponField() {
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const stationCode = useCartStore((s) => s.stationCode);
  const totals = useCartStore(selectCartTotals);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Enter a coupon code.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await validateCoupon(clean, totals.itemTotal, stationCode);
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setCoupon(res.data.code);
    setCode("");
  };

  if (couponCode) {
    const applied = evaluateCoupon(couponCode, totals.itemTotal, stationCode);
    const note = applied.ok
      ? applied.data.discount > 0
        ? `${applied.data.label} — you save ₹${Math.min(applied.data.discount, totals.itemTotal)}`
        : applied.data.label
      : applied.error.message;
    return (
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-leaf-300 bg-leaf-50 p-4" role="status">
        <div className="flex min-w-0 gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf-600" />
          <div className="min-w-0">
            <p className="font-semibold text-leaf-700">{couponCode} applied</p>
            <p className="text-[13px] text-leaf-700/80">{note}</p>
          </div>
        </div>
        <button type="button" onClick={() => setCoupon(null)} className="shrink-0 text-[13px] font-semibold text-muted hover:text-chili-600">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void apply();
      }}
    >
      <Input
        label="Coupon code"
        placeholder="e.g. SAFAR100"
        value={code}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase());
          if (error) setError(null);
        }}
        error={error}
        leftIcon={<TicketPercent className="size-4" />}
        inputClassName="uppercase"
        rightSlot={
          <Button type="submit" size="sm" variant="secondary" loading={loading}>
            Apply
          </Button>
        }
      />
      <p className="text-[13px] text-muted">
        Looking for a station special?{" "}
        <Link href="/offers" className="font-semibold text-copper-700 hover:underline">
          Browse offers
        </Link>
      </p>
    </form>
  );
}
