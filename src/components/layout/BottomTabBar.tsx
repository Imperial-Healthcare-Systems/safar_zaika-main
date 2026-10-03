"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, House, ShoppingBag, UserRound, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { selectCartCount, useAuthStore, useCartStore, useUIStore } from "@/stores";

const tab = (active: boolean) =>
  cn(
    "relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors",
    active ? "text-copper-700 before:absolute before:top-0 before:h-[3px] before:w-9 before:rounded-b-full before:bg-copper-500" : "text-cocoa-800",
  );

/** Phone / tablet tab bar (below lg). Exactly 56px tall plus the safe area (the top border is a shadow line, so it adds no height); StickyCartBar and the Footer padding account for it. */
export function BottomTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const loggedIn = useAuthStore((s) => s.user !== null);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const openLogin = useUIStore((s) => s.openLogin);

  // /checkout pins its own pay bar to the bottom edge.
  if (pathname === "/checkout") return null;

  return (
    <nav
      aria-label="Quick access"
      className="fixed inset-x-0 bottom-0 z-sticky flex bg-cream-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--color-line),0_-10px_28px_-14px_rgb(13_34_80/0.22)] lg:hidden"
    >
      <Link href="/" className={tab(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
        <House className="size-5" aria-hidden />
        Home
      </Link>
      <Link href="/train-tools" className={tab(pathname.startsWith("/train-tools"))} aria-current={pathname.startsWith("/train-tools") ? "page" : undefined}>
        <Wrench className="size-5" aria-hidden />
        Tools
      </Link>
      <button type="button" className={tab(pathname === "/cart")} aria-label={`Cart, ${count} items`} onClick={() => setCartOpen(true)}>
        <span className="relative">
          <ShoppingBag className="size-5" aria-hidden />
          {hydrated && count > 0 && (
            <span className="absolute -right-3 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-copper-500 px-1 text-[10.5px] font-bold leading-none text-cream-50 ring-2 ring-cream-50">
              {count}
            </span>
          )}
        </span>
        Cart
      </button>
      <Link href="/offers" className={tab(pathname === "/offers")} aria-current={pathname === "/offers" ? "page" : undefined}>
        <BadgePercent className="size-5" aria-hidden />
        Offers
      </Link>
      <button type="button" className={tab(pathname === "/login")} onClick={() => openLogin()}>
        <UserRound className="size-5" aria-hidden />
        {hydrated && loggedIn ? "Account" : "Login"}
      </button>
    </nav>
  );
}
