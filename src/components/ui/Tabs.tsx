"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  dark,
  full,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  dark?: boolean;
  full?: boolean;
}) {
  const id = useId();
  const index = Math.max(0, items.findIndex((i) => i.value === value));
  return (
    <div
      role="tablist"
      aria-label="Options"
      className={cn("relative inline-grid rounded-full p-1", dark ? "bg-cream-50/10" : "bg-cream-200", full && "w-full", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-1 rounded-full transition-transform duration-400 ease-(--ease-out-expo)", dark ? "bg-cream-50 shadow-sm" : "bg-white shadow-card")}
        style={{ width: `calc((100% - 0.5rem) / ${items.length})`, left: "0.25rem", transform: `translateX(${index * 100}%)` }}
      />
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            id={`${id}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors",
              active ? "text-cocoa-900" : dark ? "text-cream-50/70 hover:text-cream-50" : "text-muted hover:text-cocoa-800",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
  icon,
  dark,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
        active
          ? "border-cocoa-900 bg-cocoa-900 text-cream-50"
          : dark
            ? "border-cream-50/20 text-cream-50/85 hover:border-cream-50/50"
            : "border-line bg-white text-cocoa-800 hover:border-cocoa-900/30",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
