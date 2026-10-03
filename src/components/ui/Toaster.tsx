"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { useUIStore, type Toast } from "@/stores";

function ToastItem({ toast }: { toast: Toast }) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    if (!reduced) gsap.fromTo(el, { y: 24, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "expo.out" });
    const timer = setTimeout(() => {
      if (reduced) dismiss(toast.id);
      else gsap.to(el, { y: 12, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => dismiss(toast.id) });
    }, 3600);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? XCircle : Info;
  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        "pointer-events-auto flex w-[min(92vw,380px)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift",
        toast.tone === "error" ? "border-chili-500/30 bg-chili-50 text-chili-600" : "border-cream-50/10 bg-cocoa-900 text-cream-50",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", toast.tone === "success" && "text-leaf-300", toast.tone === "default" && "text-gold-400")} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && <p className={cn("mt-0.5 text-[13px]", toast.tone === "error" ? "text-chili-600/80" : "text-cream-50/70")}>{toast.description}</p>}
      </div>
      <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="-mr-1 rounded-full p-1 opacity-70 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+8.5rem)] z-toast flex flex-col items-center gap-2 md:bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:items-end md:px-6 lg:bottom-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
