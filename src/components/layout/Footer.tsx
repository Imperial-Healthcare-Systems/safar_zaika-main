"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";
import { Button, Logo } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";
import { toast } from "@/stores";

/** The site map, grouped the way a visitor looks for things. Privacy and terms sit in the bottom bar. */
const groups: ReadonlyArray<{ title: string; links: ReadonlyArray<readonly [label: string, href: string]> }> = [
  { title: "Order", links: [["Order food", "/order"], ["Track order", "/track-order"], ["Group order", "/bulk-order"], ["Offers", "/offers"]] },
  { title: "Explore", links: [["Stations", "/stations"], ["Restaurants", "/restaurants"], ["Train tools", "/train-tools"], ["How it works", "/how-it-works"]] },
  { title: "Support", links: [["Help centre", "/help"], ["Contact", "/contact"], ["Cancellation", "/cancellation"], ["Refunds", "/refund"]] },
  { title: "Company", links: [["About", "/about"], ["Careers", "/careers"], ["Partner with us", "/partner"]] },
];

const socials = [
  { label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" },
  { label: "X", path: "M3 3h4.6l4.3 6.1L17.2 3H20l-6.8 7.8L21 21h-4.6l-4.6-6.5L6.2 21H3.4l7.1-8.2L3 3zm3.4 1.6 10.3 14.8h1.9L8.3 4.6H6.4z" },
  { label: "LinkedIn", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z" },
  { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" },
];

const legal: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

const quiet = "transition-colors hover:text-cream-50 hover:underline decoration-copper-500 decoration-2 underline-offset-4";

/**
 * Degrees the plate turns either side of rest as the footer scrolls in. The photo ends at the plate's
 * far right, which sits past the footer's edge; keep this under 38 or that cut swings into view.
 */
const TURN = 30;

/**
 * The thali: a round crop of the brass plate, centred on the footer's right edge so half of it shows.
 * The plate turns with the scroll (`data-plate`); the ring of words drifts the other way while the
 * footer is on screen (`data-live` on the footer). The light and the shadow stay still.
 */
function Plate() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-38 size-[min(58vw,17rem)] translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 md:size-80 lg:top-1/2 lg:size-[clamp(21rem,28vw,30rem)]"
    >
      <div className="absolute -inset-[55%] rounded-full bg-[radial-gradient(closest-side,rgb(246_130_42/0.2),transparent)]" />
      <svg
        viewBox="0 0 400 400"
        className="absolute -left-[14%] -top-[14%] size-[128%] animate-spin [animation-direction:reverse] [animation-duration:150s] [animation-play-state:paused] group-data-live/footer:[animation-play-state:running]"
      >
        <circle cx="200" cy="200" r="162" fill="none" vectorEffect="non-scaling-stroke" className="stroke-cream-50/20" />
        <path id="sz-plate-ring" fill="none" d="M28,200a172,172 0 1,1 344,0a172,172 0 1,1 -344,0" />
        <text className="fill-cream-50/55 text-[14.5px] font-semibold">
          <textPath href="#sz-plate-ring" textLength="1078">
            {"Hot food at your seat · Your journey. Our zaika. · ".repeat(3)}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 rounded-full shadow-[0_32px_72px_rgb(0_0_0/0.6)]">
        <div data-plate className="absolute inset-0 overflow-hidden rounded-full bg-[#9c8558] will-change-transform">
          {/* hero-thali.jpg is 1200 square; the plate is centred at (1000, 598) and cropped at radius 310 to keep the side bowls out */}
          <Image
            src="/images/food/hero-thali.jpg"
            alt=""
            width={1200}
            height={1200}
            sizes="(min-width: 1024px) 54vw, (min-width: 768px) 620px, 112vw"
            className="absolute left-[-111.3%] top-[-46.45%] w-[193.55%] max-w-none"
          />
        </div>
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_22%,rgb(255_255_255/0.2),transparent_55%)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),inset_0_-28px_56px_rgb(7_22_52/0.5)]" />
      </div>
    </div>
  );
}

/**
 * "The table at the end of the line": the logo's tagline as the closing headline beside a thali that
 * turns as you scroll, then one rule and a plain five-column site map — brand and contact on the left,
 * four link groups beside it — over a thin bottom bar.
 */
export function Footer() {
  const footer = useRef<HTMLElement>(null);

  // One scrubbed tween, rotation only.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo("[data-plate]", { rotation: -TURN }, { rotation: TURN, ease: "none", scrollTrigger: { trigger: footer.current, start: "top bottom", end: "bottom bottom", scrub: true } });
    },
    { scope: footer },
  );

  // The ring's CSS animation only runs while the footer is on screen.
  useEffect(() => {
    const el = footer.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => el.toggleAttribute("data-live", entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={footer} className="group/footer relative mt-24 overflow-hidden rounded-t-[2.5rem] bg-cocoa-950 text-cream-50 lg:rounded-t-[4rem]">
      {/* Closing band: the tagline, the plate, and the only two things left to do */}
      <div className="relative">
        <Plate />
        <Reveal variant="letters" className="container-x relative pb-12 pt-16 lg:pb-14 lg:pt-20">
          <h2 className="text-[clamp(2.25rem,min(6.5vw,9vh),4.75rem)] leading-[1.06]">
            <span className="block">Your journey.</span>
            <span className="block">
              Our <span className="text-gold-400">zaika.</span>
            </span>
          </h2>
          <p className="mt-4 max-w-46 text-balance text-base leading-relaxed text-cream-50/70 sm:max-w-sm sm:text-lg lg:mt-5 lg:max-w-md">Hot food from local kitchens, handed over at your train seat.</p>
          <div className="mt-6 flex max-w-56 flex-wrap items-center gap-x-6 gap-y-2 sm:max-w-none lg:mt-8">
            <Button href="/order" size="lg" className="sm:h-14 sm:px-8 sm:text-base">
              Order with your PNR
            </Button>
            <Link href="/track-order" className={`inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-cream-50/85 ${quiet}`}>
              Track an order
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Site map: brand column, then the four link groups. lg:pr-* keeps the plate off the links. */}
      <div className="container-x relative border-t border-cream-50/10 pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-10 md:pb-[calc(env(safe-area-inset-bottom)+4rem)] lg:pb-8 lg:pr-56 xl:pr-64">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[minmax(15rem,1fr)_repeat(4,minmax(0,0.78fr))] lg:gap-x-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo variant="stacked-white" className="h-16" />
            <ul className="mt-4 space-y-1">
              <li>
                <a href="tel:+919800000000" className={`inline-flex min-h-10 items-center gap-2.5 text-[15px] text-cream-50/80 ${quiet}`}>
                  <Phone className="size-4 shrink-0 text-cream-50/45" aria-hidden />
                  Helpline +91 98XXX XXXXX
                </a>
              </li>
              <li>
                <a href="mailto:care@safarzaika.in" className={`inline-flex min-h-10 items-center gap-2.5 text-[15px] text-cream-50/80 ${quiet}`}>
                  <Mail className="size-4 shrink-0 text-cream-50/45" aria-hidden />
                  care@safarzaika.in
                </a>
              </li>
            </ul>
            <div className="-ml-2.5 mt-3 flex items-center gap-1">
              {socials.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={s.label}
                  onClick={() => toast(`${s.label} page coming soon`)}
                  className="inline-flex size-10 items-center justify-center rounded-full text-cream-50/60 transition-colors hover:bg-cream-50/10 hover:text-cream-50"
                >
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h3 className="font-sans text-sm font-semibold tracking-normal text-cream-50/55">{g.title}</h3>
              <ul className="mt-1.5">
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className={`inline-flex min-h-10 items-center text-[15px] text-cream-50/80 ${quiet}`}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-cream-50/10 pt-5 text-[13px] text-cream-50/50 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:mt-8">
          <p>© 2026 Safar Zaika Food Private Limited</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legal.map(([label, href]) => (
              <Link key={href} href={href} className={quiet}>
                {label}
              </Link>
            ))}
            <p>Prototype build. Everything shown is demo data.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
