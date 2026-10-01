"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { lockScroll, unlockScroll } from "@/lib/lenis";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";

export type ModalVariant = "center" | "sheet" | "drawer";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** center = dialog (becomes a bottom sheet on mobile), drawer = right panel (bottom sheet on mobile) */
  variant?: ModalVariant;
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
  description?: string;
  hideClose?: boolean;
  className?: string;
  dark?: boolean;
}

const widths = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" };

/**
 * Native <dialog> for focus trapping, Esc handling and the top layer;
 * GSAP for the enter/exit motion; Lenis is paused while open.
 */
export function Modal({ open, onClose, children, variant = "center", size = "md", title, description, hideClose, className, dark }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const mode: ModalVariant = isMobile ? "sheet" : variant;

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;
    const reduced = prefersReducedMotion();
    gsap.killTweensOf(panel);

    if (open) {
      if (!dialog.open) dialog.showModal();
      lockScroll();
      const from = mode === "sheet" ? { y: "100%", opacity: 1 } : mode === "drawer" ? { x: "100%", opacity: 1 } : { y: 28, scale: 0.96, opacity: 0 };
      if (reduced) gsap.set(panel, { x: 0, y: 0, scale: 1, opacity: 1 });
      else gsap.fromTo(panel, from, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
      return;
    }

    if (dialog.open) {
      const finish = () => {
        if (dialog.open) dialog.close();
        unlockScroll();
      };
      if (reduced) {
        finish();
        return;
      }
      const to = mode === "sheet" ? { y: "100%" } : mode === "drawer" ? { x: "100%" } : { y: 16, scale: 0.98, opacity: 0 };
      gsap.to(panel, { ...to, duration: 0.28, ease: "power2.in", onComplete: finish });
    }
  }, [open, mode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) {
        dialog.close();
        unlockScroll();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? "modal-title" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className={cn(
        "fixed inset-0 z-modal m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-inherit open:grid",
        mode === "center" && "place-items-center p-4",
        mode === "sheet" && "items-end",
        mode === "drawer" && "justify-end",
      )}
    >
      <div
        ref={panelRef}
        data-lenis-prevent
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-y-auto overscroll-contain shadow-lift",
          dark ? "bg-cocoa-900 text-cream-50" : "bg-cream-50 text-cocoa-900",
          mode === "center" && cn("rounded-3xl", widths[size]),
          mode === "sheet" && "rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
          mode === "drawer" && "h-dvh max-h-dvh w-full max-w-md rounded-l-3xl",
          className,
        )}
      >
        {mode === "sheet" && <span aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-cocoa-900/15" />}
        {(title || !hideClose) && (
          <div className={cn("flex items-start justify-between gap-4 px-6 pt-5", !title && "absolute right-2 top-2 z-10 px-0 pt-0")}>
            {title && (
              <div>
                <h2 id="modal-title" className="font-display text-2xl">
                  {title}
                </h2>
                {description && <p className={cn("mt-1 text-sm", dark ? "text-cream-50/70" : "text-muted")}>{description}</p>}
              </div>
            )}
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                  dark ? "text-cream-50/80 hover:bg-cream-50/10" : "text-cocoa-700 hover:bg-cocoa-900/6",
                )}
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
