"use client";

import Link from "next/link";
import { useRef } from "react";
import { Apple, Mail, Phone, Play } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { Logo } from "@/components/ui";
import { useReveal } from "@/components/animations/Reveal";
import { TrainIcon } from "@/components/animations/TrainIcon";
import { toast } from "@/stores";

/** The site map, grouped the way a visitor looks for things. */
const groups: ReadonlyArray<{ title: string; links: ReadonlyArray<readonly [label: string, href: string]> }> = [
  { title: "Order", links: [["Order food", "/order"], ["Track order", "/track-order"], ["Group order", "/bulk-order"], ["Offers", "/offers"]] },
  { title: "Explore", links: [["Stations", "/stations"], ["Restaurants", "/restaurants"], ["Train tools", "/train-tools"], ["How it works", "/how-it-works"]] },
  { title: "Support", links: [["Help centre", "/help"], ["Contact", "/contact"], ["Cancellation", "/cancellation"], ["Refunds", "/refund"]] },
  { title: "Company", links: [["About", "/about"], ["Careers", "/careers"], ["Partner with us", "/partner"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

const socials = [
  { label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" },
  { label: "X", path: "M3 3h4.6l4.3 6.1L17.2 3H20l-6.8 7.8L21 21h-4.6l-4.6-6.5L6.2 21H3.4l7.1-8.2L3 3zm3.4 1.6 10.3 14.8h1.9L8.3 4.6H6.4z" },
  { label: "LinkedIn", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z" },
  { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" },
];

const stores = [
  { name: "App Store", icon: Apple },
  { name: "Google Play", icon: Play },
];

const contact = "inline-flex min-h-10 items-center gap-2.5 text-[15px] text-cream-50/85";

/**
 * Brand block, five plain link groups, bottom bar. The one flourish: the footer's top edge is a
 * track, and a small train crosses it once when the footer scrolls into view, then stays parked
 * (its CSS resting place, so reduced motion simply shows it parked).
 */
export function Footer() {
  const track = useRef<HTMLDivElement>(null);

  useReveal(track, (el) => {
    const train = el.querySelector<HTMLElement>("[data-train]");
    if (!train) return;
    gsap.set(train, { autoAlpha: 0 });
    // starts just off the left edge of the viewport
    return () => gsap.fromTo(train, { x: -train.getBoundingClientRect().right, autoAlpha: 1 }, { x: 0, autoAlpha: 1, duration: 2.8, ease: "power2.inOut", clearProps: "transform,opacity,visibility" });
  });

  return (
    <footer className="relative mt-24 bg-cocoa-950 text-cream-50">
      <div ref={track} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-t-2 border-dashed border-cream-50/25">
        <span data-train className="absolute bottom-full right-[8%] flex text-cocoa-900">
          <TrainIcon className="h-4 sm:h-5" />
        </span>
      </div>

      <div className="container-x pb-[calc(env(safe-area-inset-bottom)+9rem)] pt-12 sm:pt-16 md:pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-10">
        <div className="grid gap-10 xl:grid-cols-[19rem_1fr] xl:gap-20">
          {/* Brand block */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between xl:flex-col xl:justify-start">
            <div>
              <Logo variant="stacked-white" className="h-24 sm:h-28" />
              <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-cream-50/70">Hot food from local kitchens, handed over at your train seat.</p>
              <ul className="mt-3">
                <li className={contact}>
                  <Phone className="size-4 text-cream-50/50" aria-hidden />
                  Helpline +91 98XXX XXXXX
                </li>
                <li>
                  <a href="mailto:care@safarzaika.in" className={`${contact} decoration-copper-500 underline-offset-4 transition-colors hover:text-cream-50 hover:underline`}>
                    <Mail className="size-4 text-cream-50/50" aria-hidden />
                    care@safarzaika.in
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4 md:items-end xl:items-start">
              <div className="-ml-2.5 flex items-center gap-1 md:ml-0 md:-mr-2.5 xl:-ml-2.5 xl:mr-0">
                {socials.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-label={s.label}
                    onClick={() => toast(`${s.label} page coming soon`)}
                    className="inline-flex size-10 items-center justify-center rounded-full text-cream-50/70 transition-colors hover:bg-cream-50/10 hover:text-cream-50"
                  >
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {stores.map((store) => (
                  <button
                    key={store.name}
                    type="button"
                    onClick={() => toast({ title: `${store.name} app coming soon`, description: "The web app works great on your phone in the meantime." })}
                    className="inline-flex h-12 items-center gap-2.5 rounded-xl border border-cream-50/15 bg-cream-50/6 px-3.5 text-left transition-colors hover:bg-cream-50/12"
                  >
                    <store.icon className="size-5 text-cream-50/80" aria-hidden />
                    <span>
                      <span className="block text-[11px] leading-tight text-cream-50/60">Coming soon on</span>
                      <span className="block text-sm font-semibold leading-tight">{store.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-5">
            {groups.map((g) => (
              <nav key={g.title} aria-label={g.title}>
                <h2 className="text-lg text-cream-50">{g.title}</h2>
                <ul className="mt-2">
                  {g.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="inline-flex min-h-10 items-center text-[15px] text-cream-50/70 decoration-copper-500 decoration-2 underline-offset-4 transition-colors hover:text-cream-50 hover:underline">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-1.5 border-t border-cream-50/10 pt-6 text-[13px] text-cream-50/55 sm:flex-row sm:justify-between sm:gap-6">
          <p>© 2026 Safar Zaika Food Private Limited</p>
          <p>Prototype build. Everything shown is demo data.</p>
        </div>
      </div>
    </footer>
  );
}
