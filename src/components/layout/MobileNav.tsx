"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { Button, Logo, Modal } from "@/components/ui";
import { useAuthStore, useUIStore } from "@/stores";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";
import { JourneyChip, navLinks } from "./Navbar";

/** memo: the drawer only re-renders for its own store slices, not every time the Navbar toggles its scrolled state. */
export const MobileNav = memo(function MobileNav() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const setOrderNowOpen = useUIStore((s) => s.setOrderNowOpen);
  const openLogin = useUIStore((s) => s.openLogin);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useHydrated();
  const close = () => setMobileNavOpen(false);

  return (
    <Modal open={open} onClose={close} variant="drawer" hideClose>
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo variant="horizontal-color" className="h-11" href={null} />
        <button type="button" onClick={close} className="rounded-full px-3 py-1.5 text-sm font-semibold text-cocoa-700 hover:bg-cocoa-900/6">
          Close
        </button>
      </div>
      <JourneyChip hint onClick={close} className="mx-5 mt-5 self-start" />
      <nav aria-label="Mobile" className="mt-3 flex flex-col px-5">
        {navLinks.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-between border-b border-line font-display text-xl transition-colors",
                active ? "text-copper-700" : "text-cocoa-900 hover:text-copper-700",
              )}
            >
              {l.label}
              <ArrowRight className="size-4 opacity-50" aria-hidden />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 px-5 pb-8 pt-6">
        {hydrated && user ? (
          <div className="flex items-center justify-between rounded-2xl bg-cream-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-copper-500 text-cream-50">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-cocoa-900">{user.name}</p>
                <p className="text-xs text-muted">+91 {user.phone}</p>
              </div>
            </div>
            <button type="button" onClick={logout} aria-label="Log out" className="rounded-full p-2 text-cocoa-700 hover:bg-cocoa-900/6">
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Button variant="outline" full size="lg" className="border-cocoa-900/25" onClick={() => openLogin()}>
            Log in / Sign up
          </Button>
        )}
        <Button full size="lg" onClick={() => setOrderNowOpen(true)}>
          Order now
        </Button>
      </div>
    </Modal>
  );
});
