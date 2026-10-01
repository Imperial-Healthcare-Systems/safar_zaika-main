"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { Button, Logo, Modal } from "@/components/ui";
import { useAuthStore, useUIStore } from "@/stores";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";
import { JourneyChip, navLinks } from "./Navbar";

export function MobileNav() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.mobileNavOpen);
  const { setMobileNavOpen, setOrderNowOpen, openLogin } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useHydrated();
  const close = () => setMobileNavOpen(false);

  return (
    <Modal open={open} onClose={close} variant="drawer" dark hideClose>
      <div className="flex items-center justify-between px-5 pt-5">
        <Logo variant="horizontal-white" priority className="h-10" href={null} />
        <button type="button" onClick={close} className="rounded-full px-3 py-1.5 text-sm font-semibold text-cream-50/80 hover:bg-cream-50/10">
          Close
        </button>
      </div>
      <JourneyChip light onClick={close} className="mx-5 mt-6 self-start" />
      <nav aria-label="Mobile" className="mt-5 flex flex-col px-2">
        {navLinks.map((l, i) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 font-condensed text-[2rem] font-bold uppercase leading-none tracking-[0.02em] transition-colors",
                active ? "bg-cream-50/10 text-gold-300" : "text-cream-50 hover:bg-cream-50/6",
              )}
            >
              <span className="w-6 font-condensed text-[11px] font-semibold tracking-[0.2em] text-cream-50/40" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              {l.label}
              <ArrowRight className="ml-auto size-5 opacity-50" aria-hidden />
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 px-5 pb-8 pt-6">
        {hydrated && user ? (
          <div className="flex items-center justify-between rounded-2xl bg-cream-50/8 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-copper-500 text-cream-50">
                <UserRound className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-cream-50">{user.name}</p>
                <p className="text-xs text-cream-50/60">+91 {user.phone}</p>
              </div>
            </div>
            <button type="button" onClick={logout} aria-label="Log out" className="rounded-full p-2 text-cream-50/70 hover:bg-cream-50/10">
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Button variant="glass" full size="lg" onClick={() => openLogin()}>
            Log in / Sign up
          </Button>
        )}
        <Button full size="lg" className="uppercase tracking-[0.08em]" onClick={() => setOrderNowOpen(true)}>
          Order now
        </Button>
      </div>
    </Modal>
  );
}
