"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui";
import { RouteLine } from "@/components/animations/RouteLine";
import { SplitFlap } from "@/components/animations/SplitFlap";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { toast } from "@/stores";

/** The site map, read as a departures board. Times step like a timetable; platforms rotate 1-4. */
const departures: ReadonlyArray<readonly [time: string, label: string, href: string]> = [
  ["06:10", "Order Food", "/order"],
  ["06:45", "Track Order", "/track-order"],
  ["07:20", "Bulk Orders", "/bulk-order"],
  ["07:55", "Offers", "/offers"],
  ["08:30", "Stations", "/stations"],
  ["09:05", "Restaurants", "/restaurants"],
  ["09:40", "How It Works", "/how-it-works"],
  ["10:15", "Help Center", "/help"],
  ["10:50", "About", "/about"],
  ["11:25", "Partner With Us", "/partner"],
  ["12:00", "Careers", "/careers"],
  ["12:35", "Terms", "/terms"],
  ["13:10", "Privacy", "/privacy"],
  ["13:45", "Refund Policy", "/refund"],
  ["14:20", "Cancellation", "/cancellation"],
  ["14:55", "Contact", "/contact"],
];

const socials = [
  { label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" },
  { label: "X", path: "M3 3h4.6l4.3 6.1L17.2 3H20l-6.8 7.8L21 21h-4.6l-4.6-6.5L6.2 21H3.4l7.1-8.2L3 3zm3.4 1.6 10.3 14.8h1.9L8.3 4.6H6.4z" },
  { label: "LinkedIn", path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9z" },
  { label: "YouTube", path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" },
];

// Board clock: HH:MM (24h) read from the wall clock in a store snapshot, so it is
// never computed during render and the server markup stays "--:--".
const subscribeClock = (cb: () => void) => {
  const id = window.setInterval(cb, 15_000);
  return () => window.clearInterval(id);
};
const readClock = () => new Date().toTimeString().slice(0, 5);
const serverClock = () => "--:--";

const ledHead = "led text-[10px] tracking-[0.18em] text-[#ffb648]/70 sm:text-[11px]";

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [boarding, setBoarding] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const clock = useSyncExternalStore(subscribeClock, readClock, serverClock);

  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: ref.current,
        start: "top 85%",
        onEnter: () => setProgress(1),
        onLeaveBack: () => setProgress(0),
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} className="relative mt-24 overflow-hidden gradient-cocoa text-cream-50">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-60" />
      <div className="container-x relative pb-10 pt-16 sm:pt-20">
        {/* Station sign */}
        <div className="flex flex-col items-center text-center">
          <Logo variant="stacked-white" className="h-36 sm:h-44" />
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream-50/65">Hot food from local kitchens, handed over at your seat.</p>
        </div>

        {/* Departures board */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-cream-50/10 bg-[#0d0703] shadow-[inset_0_0_48px_rgba(0,0,0,0.65)]">
          <div className="led-panel flex items-center justify-between gap-4 border-x-0 border-t-0 px-4 py-2.5 sm:px-6">
            <span className="led text-[11px] sm:text-xs">Departures</span>
            <SplitFlap text={clock} length={5} speed={40} className="text-[15px] sm:text-base" />
            <span className="led hidden text-[11px] sm:inline sm:text-xs">All services on time</span>
            <span className="led text-[11px] sm:hidden">On time</span>
          </div>

          <div className="px-3 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-3">
            <div className="grid grid-cols-[1fr_2.25rem] items-center gap-x-3 px-1 py-1.5 sm:grid-cols-[3.5rem_1fr_2.5rem_auto]" aria-hidden>
              <span className={cn(ledHead, "hidden sm:block")}>Time</span>
              <span className={ledHead}>Destination</span>
              <span className={cn(ledHead, "text-center")}>Pf</span>
              <span className={cn(ledHead, "hidden text-right sm:block")}>Status</span>
            </div>

            <ol className="divide-y divide-cream-50/6">
              {departures.map(([time, label, href], i) => {
                const hot = boarding === i;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-label={label}
                      onMouseEnter={() => setBoarding(i)}
                      onMouseLeave={() => setBoarding(null)}
                      onFocus={() => setBoarding(i)}
                      onBlur={() => setBoarding(null)}
                      className="grid grid-cols-[1fr_2.25rem] items-center gap-x-3 rounded-md px-1 py-[7px] outline-none transition-colors hover:bg-cream-50/4 focus-visible:bg-cream-50/8 sm:grid-cols-[3.5rem_1fr_2.5rem_auto]"
                    >
                      <span className="led hidden text-[13px] tabular-nums sm:block">{time}</span>
                      <SplitFlap text={label} length={15} delay={i * 55} className="text-[13px] sm:text-[15px]" />
                      <span className="led text-center text-[13px]">{(i % 4) + 1}</span>
                      <SplitFlap
                        text={hot ? "Boarding" : "On time"}
                        length={8}
                        delay={i * 55 + 220}
                        className="hidden text-[13px] sm:inline-flex"
                        cellClassName={hot ? "text-gold-400" : "text-leaf-300"}
                      />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="mt-14">
          <RouteLine
            dark
            labelSize={isMobile ? 30 : 17}
            progress={progress}
            stations={[{ label: "Mumbai Central" }, { label: "Vadodara" }, { label: "Kota" }, { label: "Jaipur" }, { label: "New Delhi" }]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-cream-50/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="text-[13px] text-cream-50/55">
              Helpline <span className="text-cream-50/85">+91 98XXX XXXXX</span> ·{" "}
              <a href="mailto:care@safarzaika.in" className="text-cream-50/85 transition-colors hover:text-gold-300">
                care@safarzaika.in
              </a>
            </p>
            <div className="flex items-center gap-1">
              {socials.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={s.label}
                  onClick={() => toast(`${s.label} page coming soon`)}
                  className="inline-flex size-9 items-center justify-center rounded-full text-cream-50/70 transition-colors hover:bg-cream-50/10 hover:text-cream-50"
                >
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {["App Store", "Google Play"].map((store) => (
              <button
                key={store}
                type="button"
                onClick={() => toast({ title: `${store} app coming soon`, description: "The web app works great on your phone in the meantime." })}
                className="inline-flex h-11 items-center gap-3 rounded-xl border border-cream-50/15 bg-cream-50/6 px-4 text-left transition-colors hover:bg-cream-50/12"
              >
                <span className="inline-block size-5 rounded-md bg-cream-50/20" aria-hidden />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-cream-50/60">Coming soon on</span>
                  <span className="block text-[13px] font-semibold leading-tight">{store}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-[12px] text-cream-50/45">© 2026 Safar Zaika Food Private Limited. Prototype build, demo data only.</p>
      </div>
    </footer>
  );
}
