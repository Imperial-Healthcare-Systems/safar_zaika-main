"use client";

import Link from "next/link";
import { ArrowRight, Hash, PackageSearch, Ticket, Users } from "lucide-react";
import { Modal } from "@/components/ui";
import { useUIStore } from "@/stores";

const options = [
  { href: "/order?mode=pnr", icon: Ticket, title: "Order with PNR", desc: "We read your train, coach and berth from the ticket.", accent: "bg-copper-500" },
  { href: "/order?mode=train", icon: Hash, title: "Order with train number", desc: "No PNR handy? Use the train and your boarding station.", accent: "bg-cocoa-800" },
  { href: "/bulk-order", icon: Users, title: "Bulk order", desc: "Groups of 10+. Families, tours, corporate travel.", accent: "bg-leaf-600" },
  { href: "/track-order", icon: PackageSearch, title: "Track order", desc: "See where your food is, station by station.", accent: "bg-gold-500" },
];

export function OrderNowModal() {
  const open = useUIStore((s) => s.orderNowOpen);
  const setOpen = useUIStore((s) => s.setOrderNowOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="How would you like to order?" description="Pick a path — every one of them ends at your seat." size="lg">
      <div className="grid gap-3 p-6 sm:grid-cols-2">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            onClick={() => setOpen(false)}
            className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-4 transition-[transform,box-shadow,border-color] duration-300 ease-(--ease-out-quart) hover:-translate-y-0.5 hover:border-copper-300 hover:shadow-card"
          >
            <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-cream-50 ${o.accent}`}>
              <o.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2 font-semibold text-cocoa-900">
                {o.title}
                <ArrowRight className="size-4 text-copper-600 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-muted">{o.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </Modal>
  );
}
