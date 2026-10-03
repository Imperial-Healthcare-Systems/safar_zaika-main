"use client";

import { useEffect } from "react";
import { Logo, Modal } from "@/components/ui";
import { PnrModule } from "@/components/pnr/PnrModule";
import { useJourneyStore, useUIStore } from "@/stores";

const SEEN_KEY = "sz-welcome-seen";
const OPEN_AFTER_MS = 1600;

/**
 * First-visit prompt, like a food app asking for your location: opens once per
 * session, only when the session starts on "/", never over another overlay and
 * never when a journey is already saved.
 */
export function WelcomeModal() {
  const open = useUIStore((s) => s.welcomeOpen);
  const setOpen = useUIStore((s) => s.setWelcomeOpen);

  // Runs once, on the first page load of this session (Providers never remount on client navigation).
  // The route is read from the window so later navigations to "/" never re-trigger it.
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {}
      const ui = useUIStore.getState();
      if (ui.loginOpen || ui.orderNowOpen || ui.cartOpen || ui.searchOpen || ui.mobileNavOpen) return;
      if (useJourneyStore.getState().journey) return;
      ui.setWelcomeOpen(true);
    }, OPEN_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} size="lg">
      <div className="px-5 pb-5 pt-5 sm:px-8 sm:pb-7 sm:pt-7">
        <div className="flex items-start gap-4 pr-10">
          <Logo variant="badge" href={null} priority className="h-16 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-[1.12] sm:text-[1.75rem]">Where&apos;s your train headed?</h2>
            <p className="mt-2 text-[15px] leading-snug text-muted">Enter your PNR. Food from kitchens on your route comes to your seat.</p>
          </div>
        </div>
        <PnrModule bare className="mt-5 border-0 bg-transparent p-0 shadow-none sm:p-0" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setOpen(false)} className="rounded-full px-3 py-2 text-sm font-semibold text-cocoa-700 transition-colors hover:bg-cocoa-900/6 hover:text-cocoa-900">
            Just browsing
          </button>
          <span className="text-xs text-muted">Prototype, demo data only</span>
        </div>
      </div>
    </Modal>
  );
}
