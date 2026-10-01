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
  { href: "/order", label: "Order Food" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/stations", label: "Stations" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/bulk-order", label: "Bulk Orders" },
  { href: "/track-order", label: "Track Order" },
];

/** Routes whose first screen is dark, so the navbar starts light-on-dark. */
const hasDarkHero = (pathname: string) => pathname === "/" || pathname.startsWith("/restaurant/") || pathname.startsWith("/track-order/");

/**
 * Saved-journey context, as a station signboard: "12951 -> BRC 9:08 PM" once a
 * delivery station is chosen, else "12951 MUMBAI RAJDHANI" + "Choose station".
 * Renders nothing until the persisted store is hydrated / when there is no journey.
 */
export function JourneyChip({ className, light, onClick }: { className?: string; light?: boolean; onClick?: () => void }) {
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
            {selected.station.code} {time}
          </>
        ) : (
          <span className="max-w-[9rem] truncate">{journey.trainName}</span>
        )}
      </span>
      {!selected && (
        <span className={cn("hidden items-center gap-1 text-[12px] font-semibold xl:inline-flex", light ? "text-cream-50/80 group-hover:text-cream-50" : "text-cocoa-700 group-hover:text-cocoa-900")}>
          Choose station
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const hydrated = useHydrated();
  const cartCount = useCartStore(selectCartCount);
  const user = useAuthStore((s) => s.user);
  const hasJourney = useJourneyStore((s) => s.journey !== null);
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
      end: 1e9, // never "leaves" at the page bottom, so the pill state sticks
      onToggle: (self) => setScrolled(self.isActive),
    });
    gsap.to(progressRef.current, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.4 } });
    return () => st.kill();
  }, []);

  const onDark = hasDarkHero(pathname) && !scrolled;
  const showChip = hydrated && hasJourney;
  const iconBtn = cn(
    "relative inline-flex size-10 items-center justify-center rounded-full transition-colors",
    onDark ? "text-cream-50 hover:bg-cream-50/12" : "text-cocoa-800 hover:bg-cocoa-900/6",
  );

  return (
    <header className="fixed inset-x-0 top-0 z-nav will-change-transform">
      {/* Reading progress: a copper hairline that grows across the top of the viewport. */}
      <span ref={progressRef} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left bg-copper-500" style={{ transform: "scaleX(0)" }} />

      {/* Platform indicator: collapses once the page scrolls. */}
      <div className={cn("overflow-hidden transition-[height,opacity] duration-500 ease-(--ease-out-quart)", scrolled ? "h-0 opacity-0" : "h-7 opacity-100")}>
        <p className="led-panel led flex h-7 items-center justify-center gap-2.5 overflow-hidden whitespace-nowrap border-x-0 border-t-0 px-4 text-[10.5px] sm:text-[11px]">
          <span className="size-1.5 shrink-0 animate-blink rounded-full bg-[#ffb648] shadow-[0_0_6px_#ffb648]" aria-hidden />
          <Link href="/order?mode=pnr" className="transition-colors hover:text-[#ffd27a]">
            <span className="hidden sm:inline">Platform 1 · </span>Demo PNR 1234567890 · Try it
          </Link>
        </p>
      </div>

      <div className={cn("transition-[padding] duration-500 ease-(--ease-out-quart)", scrolled ? "px-3 pt-2 sm:px-5" : "px-0")}>
        <nav
          aria-label="Primary"
          className={cn(
            "container-x flex items-center justify-between gap-4 transition-[height,background-color,box-shadow,border-radius,max-width] duration-500 ease-(--ease-out-quart)",
            scrolled ? "h-14 max-w-6xl rounded-full glass-light shadow-card" : "h-[76px]",
          )}
        >
          <Link href="/" aria-label="Safar Zaika home" className="relative flex shrink-0 items-center">
            {/* Transparent lockups: white over dark heroes, colour over light pages and the scrolled pill. */}
            <Logo href={null} variant="horizontal-white" priority className={cn("transition-[height,opacity] duration-500 ease-(--ease-out-quart)", scrolled ? "h-9 sm:h-10" : "h-10 sm:h-12 md:h-14", !onDark && "opacity-0")} />
            <Logo href={null} variant="horizontal-color" className={cn("absolute left-0 top-0 transition-[height,opacity] duration-500 ease-(--ease-out-quart)", scrolled ? "h-9 sm:h-10" : "h-10 sm:h-12 md:h-14", onDark && "opacity-0")} />
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-copper-500 after:opacity-0 after:transition-opacity",
                      onDark ? "text-cream-50/85 hover:text-cream-50" : "text-cocoa-800 hover:text-cocoa-900",
                      active && "after:opacity-100",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {showChip && <JourneyChip light={onDark} className="mr-2 hidden lg:inline-flex" />}
            <button type="button" className={iconBtn} aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search className="size-5" />
            </button>
            <button type="button" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label={user ? `Account: ${user.name}` : "Log in"} onClick={() => openLogin()}>
              <UserRound className="size-5" />
              {hydrated && user && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-leaf-500 ring-2 ring-cream-50" />}
            </button>
            <button type="button" className={iconBtn} aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)} data-cart-target>
              <ShoppingBag className="size-5" />
              {hydrated && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-copper-500 px-1 text-[11px] font-bold text-cream-50 ring-2 ring-cream-50">
                  {cartCount}
                </span>
              )}
            </button>
            <Button size="md" onClick={() => setOrderNowOpen(true)} className={cn("ml-1 hidden uppercase tracking-[0.08em] sm:inline-flex", showChip && "lg:hidden")}>
              Order now
            </Button>
            <button type="button" className={cn(iconBtn, "lg:hidden")} aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
              <Menu className="size-6" />
            </button>
          </div>
        </nav>
      </div>
      <MobileNav />
    </header>
  );
}
