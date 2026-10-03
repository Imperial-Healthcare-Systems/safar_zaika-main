import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "copper" | "leaf" | "cocoa" | "cream" | "chili" | "gold" | "outline" | "glass";

const tones: Record<BadgeTone, string> = {
  copper: "bg-copper-100 text-copper-700",
  leaf: "bg-leaf-100 text-leaf-700",
  cocoa: "bg-cocoa-900 text-cream-50",
  cream: "bg-cream-200 text-cocoa-800",
  chili: "bg-chili-100 text-chili-600",
  gold: "bg-gold-200 text-cocoa-800",
  outline: "border border-cocoa-900/15 text-cocoa-700",
  glass: "glass text-cream-50",
};

export function Badge({ tone = "cream", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}
      {...rest}
    />
  );
}

export function VegDot({ type, className }: { type: "veg" | "non-veg" | "egg"; className?: string }) {
  const color = type === "veg" ? "border-leaf-600 text-leaf-600" : type === "egg" ? "border-gold-600 text-gold-600" : "border-chili-500 text-chili-500";
  const label = type === "veg" ? "Vegetarian" : type === "egg" ? "Contains egg" : "Non-vegetarian";
  return (
    <span role="img" aria-label={label} title={label} className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white", color, className)}>
      <span className={cn("block rounded-full bg-current", type === "non-veg" ? "size-2 [clip-path:polygon(50%_0,100%_100%,0_100%)] rounded-none" : "size-2")} />
    </span>
  );
}

export function Rating({ value, count, className, light }: { value: number; count?: number; className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-semibold", light ? "text-cream-50" : "text-cocoa-900", className)}>
      <span className="inline-flex size-5 items-center justify-center rounded-md bg-leaf-600 text-[10px] text-white" aria-hidden>
        ★
      </span>
      <span>
        {value.toFixed(1)}
        <span className="sr-only"> out of 5</span>
      </span>
      {count !== undefined && <span className={cn("font-medium", light ? "text-cream-50/70" : "text-muted")}>({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})</span>}
    </span>
  );
}

export function Price({ value, mrp, className, size = "md" }: { value: number; mrp?: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 font-bold text-cocoa-900 tabular-nums", sizes[size], className)}>
      ₹{value}
      {mrp && mrp > value && <span className="text-[0.8em] font-medium text-muted line-through">₹{mrp}</span>}
    </span>
  );
}
