"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityControl({
  value,
  onIncrement,
  onDecrement,
  size = "md",
  className,
  label,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const h = size === "sm" ? "h-8" : "h-10";
  const w = size === "sm" ? "w-8" : "w-10";
  return (
    <div
      className={cn("inline-flex items-center overflow-hidden rounded-full border border-copper-500 bg-copper-50 text-copper-700", h, className)}
      role="group"
      aria-label={label ? `Quantity for ${label}` : "Quantity"}
    >
      <button type="button" onClick={onDecrement} aria-label="Decrease quantity" className={cn("inline-flex h-full items-center justify-center transition-colors hover:bg-copper-100 active:bg-copper-200", w)}>
        <Minus className="size-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={onIncrement} aria-label="Increase quantity" className={cn("inline-flex h-full items-center justify-center transition-colors hover:bg-copper-100 active:bg-copper-200", w)}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
