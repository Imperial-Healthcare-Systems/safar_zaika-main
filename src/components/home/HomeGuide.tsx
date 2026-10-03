import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { categoryLabels, dishes, dishesForMeal } from "@/data/menu";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, MIN_LEAD_MINUTES } from "@/services";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";
import type { Dish } from "@/types";

const unique = (list: string[]) => Array.from(new Set(list)).join(", ");
/** "Masala Chai (Flask, 2 cups)" -> "Masala Chai" */
const names = (list: Dish[]) => unique(list.map((d) => d.name.replace(/\s*\(.*\)$/, "")));
const cuisines = (list: Dish[]) => unique(list.map((d) => categoryLabels[d.category]));

/** Straight from the demo catalogue, so the lists stay true to what the menus hold. `category` is the /restaurants filter. */
const menuGroups = [
  { title: "Vegetarian", category: "veg", items: cuisines(dishes.filter((d) => d.veg === "veg")) },
  { title: "Non-vegetarian", category: "non-veg", items: cuisines(dishes.filter((d) => d.veg === "non-veg")) },
  { title: "Jain", category: "jain", items: names(dishes.filter((d) => d.jain)) },
  { title: "Breakfast", category: "breakfast", items: names(dishesForMeal("breakfast")) },
];

const orderSteps = [
  "Enter your 10-digit PNR, or your train number and journey date.",
  `Pick a halt on your route. A halt can take an order when it is at least ${MIN_LEAD_MINUTES} minutes away and a kitchen there is open.`,
  "Choose a kitchen and add dishes to your cart.",
  "Apply a coupon at checkout if you have one.",
  "Pay online, or choose cash on delivery.",
  "Follow the order on the tracking page, from the kitchen to your platform.",
  "Eat at your seat. The delivery partner hands the order over at your coach and berth during the halt.",
];

function Topic({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="group border-b border-line last:border-0" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 marker:content-none [&::-webkit-details-marker]:hidden">
        <h3 className="text-xl text-cocoa-900 sm:text-2xl">{title}</h3>
        <ChevronDown className="size-5 shrink-0 text-copper-600 transition-transform duration-300 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-cocoa-800">{children}</div>
    </details>
  );
}

/** Plain reference copy for people who want to read before they order: native <details>, no claims. */
export function HomeGuide() {
  return (
    <section className="bg-cream-100 py-14 sm:py-16" aria-labelledby="guide-title">
      <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
        <Reveal variant="slide-left">
          <SectionHeading title={<span id="guide-title">How ordering food on a train works</span>} description="The steps, what is on the menu, and how payment and cancellation work." />
        </Reveal>
        <Reveal variant="slide-right">
          <div className="rounded-3xl border border-line bg-white px-5 sm:px-8">
            <Topic title="Ordering on the website" open>
              <ol className="list-decimal space-y-2 pl-5 marker:font-bold marker:text-rail-600">
                {orderSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </Topic>
            <Topic title="What you can order">
              <p>Menus change with the station and the time of day. Across the partner kitchens you will find:</p>
              <dl className="mt-3 space-y-3">
                {menuGroups.map((g) => (
                  <div key={g.title}>
                    <dt>
                      <Link href={`/restaurants?category=${g.category}`} className="font-bold text-rail-600 underline-offset-4 transition-colors hover:text-rail-700 hover:underline">
                        {g.title}
                      </Link>
                    </dt>
                    <dd className="text-muted">{g.items}</dd>
                  </div>
                ))}
              </dl>
            </Topic>
            <Topic title="Payment, changes and cancellation">
              <ul className="list-disc space-y-2 pl-5 marker:text-rail-500">
                <li>Pay online by UPI, card or net banking, or choose cash on delivery and pay the delivery partner at your seat.</li>
                <li>
                  Menu prices are the prices you pay. Delivery is free above ₹{FREE_DELIVERY_ABOVE}; below that a ₹{DELIVERY_FEE} delivery fee applies. Taxes are shown before you confirm.
                </li>
                <li>You can cancel from the tracking page while the order is still being confirmed, before the kitchen starts cooking. We ask for a reason.</li>
                <li>Need a different dish or halt? Cancel while that is still possible and place a new order.</li>
              </ul>
              <p className="mt-3">
                <Link href="/cancellation" className="font-bold text-rail-600 underline-offset-4 transition-colors hover:text-rail-700 hover:underline">
                  Read the draft cancellation policy
                </Link>
              </p>
            </Topic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
