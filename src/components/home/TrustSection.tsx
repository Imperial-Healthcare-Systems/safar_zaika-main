import { BadgeCheck, Banknote, Clock, Headset, MapPinned, Truck } from "lucide-react";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE } from "@/services";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

const items = [
  { icon: BadgeCheck, t: "Verified partner kitchens", d: "Checked for hygiene and packaging before they go live." },
  { icon: Clock, t: "Cooked to your train's arrival time", d: "Prep is timed to the halt, not to when you order." },
  { icon: Banknote, t: "Prepaid or cash on delivery", d: "Pay online, or pay in cash at your seat." },
  { icon: MapPinned, t: "Live order tracking", d: "Every step from the kitchen to your coach." },
  { icon: Truck, t: `Free delivery above ₹${FREE_DELIVERY_ABOVE}`, d: `A ₹${DELIVERY_FEE} delivery fee applies below that.` },
  { icon: Headset, t: "Help on call until you've eaten", d: "Support stays with the order until hand-over." },
];

/** Six plain reasons on a light band. Only things the product does today; badges wait for real approvals. */
export function TrustSection() {
  return (
    <section className="bg-cream-100 py-14 sm:py-16" aria-labelledby="trust-title">
      <div className="container-x">
        <Reveal variant="letters">
          <SectionHeading align="center" title={<span id="trust-title">Why choose Safar Zaika</span>} />
        </Reveal>
        <Reveal stagger={0.07} selector="li" className="mt-8">
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.t} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rail-50 text-rail-600 sm:size-14">
                  <it.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg leading-tight text-cocoa-900 sm:text-xl">{it.t}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-muted sm:text-sm">{it.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="mt-6 text-center text-sm text-muted">Authorisation and partner badges will appear here once formal approvals are in place.</p>
      </div>
    </section>
  );
}
