"use client";

import { useState } from "react";
import { Banknote, CreditCard, Landmark, Lock, Smartphone } from "lucide-react";
import { Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export const paymentLabel: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  cod: "Cash on delivery",
};

type Method = { value: PaymentMethod; sub: string; icon: typeof CreditCard };

// Prepaid vs COD is the one thing the kitchen must see clearly, so the two are separate groups.
const groups: { title: string; note: string; methods: Method[] }[] = [
  {
    title: "Pay now (prepaid)",
    note: "Settled before the kitchen starts cooking.",
    methods: [
      { value: "upi", sub: "GPay, PhonePe, Paytm", icon: Smartphone },
      { value: "card", sub: "Credit or debit", icon: CreditCard },
      { value: "netbanking", sub: "All major banks", icon: Landmark },
    ],
  },
  {
    title: "Pay at delivery",
    note: "Collected by the partner when the meal is handed over.",
    methods: [{ value: "cod", sub: "Cash or UPI at your seat", icon: Banknote }],
  },
];

const banks = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"].map((b) => ({ value: b, label: b }));

const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Radio cards in two groups (prepaid / pay at delivery) with clearly-mock inner fields. Nothing here reaches a gateway. */
export function PaymentMethods({ value, onChange }: { value: PaymentMethod; onChange: (m: PaymentMethod) => void }) {
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bank, setBank] = useState("");

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <fieldset key={g.title}>
          <legend className="text-sm font-semibold text-cocoa-900">{g.title}</legend>
          <p className="mt-0.5 text-[13px] text-muted">{g.note}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {g.methods.map((m) => {
              const active = m.value === value;
              return (
                <label
                  key={m.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-copper-500/20",
                    active ? "border-copper-500 bg-copper-50 shadow-[0_0_0_1px_var(--color-copper-500)]" : "border-line bg-white hover:border-cocoa-900/30",
                  )}
                >
                  <input type="radio" name="payment-method" value={m.value} checked={active} onChange={() => onChange(m.value)} className="sr-only" />
                  <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors", active ? "bg-copper-500 text-cream-50" : "bg-cream-200 text-cocoa-700")}>
                    <m.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-cocoa-900">{paymentLabel[m.value]}</span>
                    <span className="block text-[12px] text-muted">{m.sub}</span>
                  </span>
                  <span aria-hidden className={cn("size-4 shrink-0 rounded-full border-2 transition-colors", active ? "border-copper-500 bg-copper-500 shadow-[inset_0_0_0_3px_white]" : "border-cocoa-900/25")} />
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="rounded-2xl border border-dashed border-copper-300 bg-cream-50 p-4">
        <p className="mb-4 flex items-center gap-1.5 text-[12px] font-semibold text-copper-600">
          <Lock className="size-3.5" /> Demo payment: nothing is charged.
        </p>
        {value === "upi" && <Input label="UPI ID" placeholder="name@upi" value={upi} onChange={(e) => setUpi(e.target.value)} autoComplete="off" hint="Any value works in the demo." />}
        {value === "card" && (
          <div className="grid gap-4">
            <Input label="Card number" placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="off" value={card} onChange={(e) => setCard(formatCard(e.target.value))} leftIcon={<CreditCard className="size-4" />} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Expiry" placeholder="MM/YY" inputMode="numeric" autoComplete="off" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} />
              <Input label="CVV" placeholder="•••" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </div>
          </div>
        )}
        {value === "netbanking" && <Select label="Bank" placeholder="Choose your bank" options={banks} value={bank} onChange={(e) => setBank(e.target.value)} />}
        {value === "cod" && (
          <p className="text-sm text-cocoa-800">
            Pay the delivery partner when the meal is handed over at your seat; the kitchen collects it on Safar Zaika&apos;s behalf. Exact change or UPI to the partner works.
          </p>
        )}
      </div>
    </div>
  );
}
