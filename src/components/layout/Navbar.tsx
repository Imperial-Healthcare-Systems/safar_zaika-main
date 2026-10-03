"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, TrainFront, UserRound } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn, formatClock } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { Button, Logo } from "@/components/ui";
import { selectCartCount, selectSelectedStation, useAuthStore, useCartStore, useJourneyStore, useUIStore } from "@/stores";
import { MobileNav } from "./MobileNav";

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/stations", label: "Stations" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/bulk-order", label: "Group order" },
  { href: "/train-tools", label: "Train tools" },
  { href: "/offers", label: "Offers" },
  { href: "/track-order", label: "Track order" },
];

/**
 * Saved-journey context as a small chip: "12951 -> BRC 9:08 PM" once a
 * delivery station is chosen, else "12951 Mumbai Rajdhani" (+ "Choose station" with `hint`).
 * Between lg and xl the navbar is tight, so the time / train name drop out there.
 * Renders nothing until the persisted store is hydrated / when there is no journey.
 * `onDark`: white-on-navy variant for the transparent navbar over the home hero.
 */
export function JourneyChip({ className, hint, onClick, onDark }: { className?: string; hint?: boolean; onClick?: () => void; onDark?: boolean }) {
  const hydrated = useHydrated();
  const journey = useJourneyStore((s) => s.journey);
  const selected = useJourneyStore(selectSelectedStation);
  if (!hydrated || !journey) return null;
  const time = selected ? formatClock(selected.stop.arrival ?? selected.stop.departure) : "";
  return (
    <Link
      href="/journey"
      onClick={onClick}
      aria-label={selected ? `Your journey: train ${journey.trainNumber}, delivery at ${selected.station.name} ${time}` : `Your journey: train ${journey.trainNumber} ${journey.trainName}, choose a delivery station`}
      className={cn("group inline-flex items-center gap-2.5 rounded-md", className)}
    >
      <span
        className={cn(
          "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-bold transition-colors duration-250",
          onDark ? "border-cream-50/30 bg-cocoa-950/45 text-cream-50 group-hover:border-cream-50/60" : "border-rail-100 bg-rail-50 text-cocoa-900 group-hover:border-rail-300",
        )}
      >
        <TrainFront className={cn("size-4", onDark ? "text-gold-400" : "text-rail-600")} aria-hidden />
        {journey.trainNumber}
        {selected ? (
          <>
            <ArrowRight className={cn("size-3.5", onDark ? "text-gold-400" : "text-rail-600")} aria-hidden />
            {selected.station.code}
            <span className={cn("font-medium lg:max-xl:hidden", onDark ? "text-cream-50/75" : "text-cocoa-700")}>{time}</span>
          </>
        ) : (
          <span className={cn("max-w-[9rem] truncate font-medium lg:max-xl:hidden", onDark ? "text-cream-50/75" : "text-cocoa-700")}>{journey.trainName}</span>
        )}
      </span>
      {hint && !selected && (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-cocoa-700 group-hover:text-cocoa-900">
          Choose station
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      )}
    </Link>
  );
}

const iconBtn = "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors duration-250";

/**
 * Solid white bar on every route, except over the home hero: there it is transparent (white lockup, white links)
 * and turns white once the hero's bottom edge slides under it. Heights other layouts rely on, same in both looks:
 * 28px strip + 72px bar (60px below lg) at the top of the page; once scrolled past 48px the
 * strip collapses and the bar is 64px (60px below lg).
 */
export function Navbar() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // Starts false, so "/" renders transparent on the server and on the client: no white flash on load.
  const [pastHero, setPastHero] = useState(false);
  const overHero = home && !pastHero;
  const progressRef = useRef<HTMLSpanElement>(null);
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const user = useAuthStore((s) => s.user);
  // With a journey loaded the chip is the way back into ordering, so it takes the "Order now" slot on lg+.
  const showChip = useJourneyStore((s) => s.journey !== null) && hydrated;
  // Action selectors (stable references): the navbar never re-renders for a toast or a modal toggle.
  const openLogin = useUIStore((s) => s.openLogin);
  const setOrderNowOpen = useUIStore((s) => s.setOrderNowOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);

  // Scroll state + progress line via ScrollTrigger so they share Lenis' clock.
  // onToggle only: React renders when the 48px line is crossed, not on every scroll pixel.
  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 48,
      end: 1e9, // never "leaves" at the page bottom, so the compact state sticks
      onToggle: (self) => setScrolled(self.isActive),
    });
    gsap.to(progressRef.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.4 } });
    return () => st.kill();
  }, []);

  // One trigger on the home hero (it exists only on "/"): active once the hero's bottom edge is under the 64px bar.
  // ponytail: the line is measured on refresh (load, resize, route change); if the hero grows after that (a taller
  // search card) the bar turns white that many px early. Refresh from the hero if it ever matters.
  useGSAP(() => {
    const hero = home ? document.querySelector("[data-hero]") : null;
    if (!hero) return;
    const st = ScrollTrigger.create({ trigger: hero, start: "bottom 64px", end: 1e9, onToggle: (self) => setPastHero(self.isActive) });
    return () => {
      st.kill();
      setPastHero(false); // the next visit to "/" starts over the hero again
    };
  }, { dependencies: [home], revertOnUpdate: true }); // revertOnUpdate: without it useGSAP only cleans up on unmount, and the navbar never unmounts

  const icon = cn(iconBtn, overHero ? "text-cream-50 hover:bg-cream-50/12" : "text-cocoa-900 hover:bg-cocoa-900/6");
  const badgeRing = overHero ? "ring-cocoa-950" : "ring-cream-50";

  return (
    <header className="fixed inset-x-0 top-0 z-nav">
      {/* Reading progress: an orange hairline that grows across the top of the viewport. */}
      <span ref={progressRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-copper-500" style={{ transform: "scaleX(0)" }} />

      {/* Utility strip: collapses once the page scrolls. Over the hero it has no slab of its own. */}
      <div className={cn("overflow-hidden transition-[height,background-color] duration-300 ease-(--ease-out-quart)", overHero ? "bg-transparent" : "bg-cocoa-900", scrolled ? "h-0" : "h-7")}>
        <p className="flex h-7 items-center justify-center whitespace-nowrap px-4 text-xs text-cream-50/75">
          <Link href="/order?mode=pnr" className="transition-colors hover:text-cream-50">
            Prototype preview. Try the demo PNR <span className="font-semibold text-cream-50">1234567890</span>
          </Link>
        </p>
      </div>

      <div
        className={cn(
          "relative h-[60px] border-b transition-[height,background-color,border-color,box-shadow] duration-300 ease-(--ease-out-quart)",
          overHero ? "border-transparent bg-transparent" : "border-line bg-cream-50",
          scrolled ? cn("lg:h-16", !overHero && "shadow-card") : "lg:h-[72px]",
        )}
      >
        {/* Navy scrim while scrolling inside the hero: the white links stay legible as the headline and the white card pass under.
            Never shown at the top of the page; it fades out below the bar, so there is no slab edge. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] bg-[linear-gradient(180deg,rgba(7,22,52,0.98)_0%,rgba(7,22,52,0.95)_66%,rgba(7,22,52,0)_100%)] transition-opacity duration-250",
            overHero && scrolled ? "opacity-100" : "opacity-0",
          )}
        />
        <nav aria-label="Primary" className="container-x flex h-full items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className={cn(icon, "-ml-2 lg:hidden")} aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
              <Menu className="size-6" />
            </button>
            {/* Both lockups are stacked and cross-fade: no image swap, no layout shift. */}
            <span className="relative inline-flex">
              <Logo variant="horizontal-color" priority className={cn("h-11 transition-opacity duration-250 lg:h-12", overHero && "opacity-0")} />
              <span aria-hidden className={cn("pointer-events-none absolute inset-0 flex items-center transition-opacity duration-250", !overHero && "opacity-0")}>
                <Logo variant="horizontal-white" href={null} priority={home} className="h-11 lg:h-12" />
              </span>
            </span>
          </div>

          <ul className="hidden items-center lg:flex">
            {navLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block whitespace-nowrap px-1.5 py-2 text-[13px] font-semibold transition-colors duration-250 xl:px-3 xl:text-sm",
                      overHero ? "text-cream-50" : "text-cocoa-900",
                      "after:absolute after:inset-x-1.5 after:bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-copper-500 after:transition-transform after:duration-300 hover:after:scale-x-100 xl:after:inset-x-3",
                      active && "after:scale-x-100",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-1 xl:gap-1.5">
            <button type="button" className={icon} aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </button>
            <button type="button" className={icon} aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)} data-cart-target>
              <ShoppingBag className="size-5" />
              {hydrated && cartCount > 0 && (
                <span className={cn("absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-copper-500 px-1 text-[11px] font-bold text-cream-50 ring-2", badgeRing)}>
                  {cartCount}
                </span>
              )}
            </button>
            <JourneyChip className="mx-1 hidden lg:inline-flex" onDark={overHero} />
            {hydrated && user ? (
              <button type="button" className={cn(icon, "hidden lg:inline-flex")} aria-label={`Account: ${user.name}`} onClick={() => openLogin()}>
                <UserRound className="size-5" />
                <span className={cn("absolute right-1.5 top-1.5 size-2 rounded-full bg-leaf-500 ring-2", badgeRing)} />
              </button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openLogin()}
                className={cn(
                  "hidden h-10 text-sm transition-[transform,box-shadow,background-color,border-color,color] lg:inline-flex",
                  overHero ? "border-cream-50/50 bg-transparent text-cream-50 hover:border-cream-50 hover:bg-cream-50/12" : "border-cocoa-900/25 bg-cream-50",
                )}
              >
                Login
              </Button>
            )}
            <Button size="md" onClick={() => setOrderNowOpen(true)} className={cn("hidden h-10 px-4 sm:inline-flex xl:ml-1 xl:px-5", showChip && "lg:hidden")}>
              Order now
            </Button>
          </div>
        </nav>
      </div>
      <MobileNav />
    </header>
  );
}
