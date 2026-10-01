"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselArrowsProps {
  /** Unique class hooks for Swiper's `navigation.prevEl` / `nextEl` (e.g. "food-prev"). Swiper toggles `disabled` on them. */
  prevClass?: string;
  nextClass?: string;
  /** Click handlers for engines without element hooks (react-slick). */
  onPrev?: () => void;
  onNext?: () => void;
  /** Cream-on-dark variant for dark sections. */
  dark?: boolean;
  /** What the arrows move, for the aria-labels ("dishes" -> "Previous dishes"). */
  label?: string;
  className?: string;
}

/**
 * Round prev/next buttons (44px). Styled in src/app/carousels.css: on touch devices
 * they are visually hidden but stay in the DOM and reappear on keyboard focus.
 */
export function CarouselArrows({ prevClass, nextClass, onPrev, onNext, dark, label = "slides", className }: CarouselArrowsProps) {
  return (
    <div className={cn("carousel-arrows", dark && "carousel-arrows-dark", className)}>
      <button type="button" className={cn("carousel-arrow", prevClass)} onClick={onPrev} aria-label={`Previous ${label}`}>
        <ArrowLeft className="size-4" aria-hidden />
      </button>
      <button type="button" className={cn("carousel-arrow", nextClass)} onClick={onNext} aria-label={`Next ${label}`}>
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** Thin copper progress bar. Pass its unique class to Swiper's `scrollbar.el` (draggable: true) to make it a scrollbar. */
export function SwiperProgress({ className }: { className: string }) {
  return <div className={cn("swiper-progress", className)} aria-hidden />;
}
