"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
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
 * Saved-journey context, as a station signboard: "12951 -> BRC 9:08 PM" once a
 * delivery station is chosen, else "12951 MUMBAI RAJDHANI" (+ "Choose station" with `hint`).
 * Between lg and xl the navbar is tight, so the time / train name drop out there.
 * Renders nothing until the persisted store is hydrated / when there is no journey.
 */
export function JourneyChip({ className, hint, onClick }: { className?: string; hint?: boolean; onClick?: () => void }) {
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
      <span className="signboard">
        {journey.trainNumber}
        {selected ? (
          <>
            <ArrowRight className="size-3.5" aria-hidden />
            {selected.station.code}
            <span className="lg:max-xl:hidden">{time}</span>
          </>
        ) : (
          <span className="max-w-[9rem] truncate lg:max-xl:hidden">{journey.trainName}</span>
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

const iconBtn = "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-cocoa-900 transition-colors hover:bg-cocoa-900/6";

/**
 * Always-white bar on every route. Heights other layouts rely on:
 * 28px navy strip + 72px bar (60px below lg) at the top of the page; once scrolled past 48px the
 * strip collapses and the bar is 64px (60px below lg).
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
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

  return (
    <header className="fixed inset-x-0 top-0 z-nav">
      {/* Reading progress: an orange hairline that grows across the top of the viewport. */}
      <span ref={progressRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-copper-500" style={{ transform: "scaleX(0)" }} />

      {/* Utility strip: collapses once the page scrolls. */}
      <div className={cn("overflow-hidden bg-cocoa-900 transition-[height] duration-300 ease-(--ease-out-quart)", scrolled ? "h-0" : "h-7")}>
        <p className="led flex h-7 items-center justify-center gap-2.5 whitespace-nowrap px-4 text-[10.5px] sm:text-[11px]">
          <span className="size-1.5 shrink-0 animate-blink rounded-full bg-gold-400" aria-hidden />
          <Link href="/order?mode=pnr" className="transition-colors hover:text-gold-200">
            <span className="hidden sm:inline">Platform 1 · </span>Demo PNR 1234567890 · Try it
          </Link>
        </p>
      </div>

      <div className={cn("h-[60px] border-b border-line bg-cream-50 transition-[height,box-shadow] duration-300 ease-(--ease-out-quart)", scrolled ? "shadow-card lg:h-16" : "lg:h-[72px]")}>
        <nav aria-label="Primary" className="container-x flex h-full items-center justify-between gap-3">
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className={cn(iconBtn, "-ml-2 lg:hidden")} aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
              <Menu className="size-6" />
            </button>
            <Logo variant="horizontal-color" priority className="h-11 lg:h-12" />
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
                      "relative block whitespace-nowrap px-1.5 py-2 font-condensed text-[13px] font-semibold uppercase tracking-[0.06em] text-cocoa-900 xl:px-3 xl:text-[15px] xl:tracking-[0.07em]",
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
            <button type="button" className={iconBtn} aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </button>
            <button type="button" className={iconBtn} aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)} data-cart-target>
              <ShoppingBag className="size-5" />
              {hydrated && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-copper-500 px-1 text-[11px] font-bold text-cream-50 ring-2 ring-cream-50">
                  {cartCount}
                </span>
              )}
            </button>
            <JourneyChip className="mx-1 hidden lg:inline-flex" />
            {hydrated && user ? (
              <button type="button" className={cn(iconBtn, "hidden lg:inline-flex")} aria-label={`Account: ${user.name}`} onClick={() => openLogin()}>
                <UserRound className="size-5" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-leaf-500 ring-2 ring-cream-50" />
              </button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => openLogin()} className="hidden h-10 border-cocoa-900/25 bg-cream-50 font-condensed text-[14px] uppercase tracking-[0.07em] lg:inline-flex xl:text-[15px]">
                Login
              </Button>
            )}
            <Button size="md" onClick={() => setOrderNowOpen(true)} className={cn("hidden h-10 px-4 uppercase tracking-[0.08em] sm:inline-flex xl:ml-1 xl:px-5", showChip && "lg:hidden")}>
              Order now
            </Button>
          </div>
        </nav>
      </div>
      <MobileNav />
    </header>
  );
}
