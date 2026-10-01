"use client";

import Image from "next/image";
import { useRef } from "react";
import { Clock3, Flame, Plus, Star } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { flyToCart } from "@/lib/flyToCart";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Badge, Price, VegDot } from "@/components/ui";
import { QuantityControl } from "./QuantityControl";
import { isWithinWindows } from "@/services";
import { selectQuantity, toast, useCartStore } from "@/stores";
import { useDeliveryMoment } from "@/stores/journeyStore";
import type { Dish, Restaurant, TimeWindow } from "@/types";

/** "06:00"-"11:00" -> "6-11 AM"; "18:00"-"23:30" -> "6-11:30 PM"; "11:00"-"15:00" -> "11 AM-3 PM". */
function formatWindows(windows: TimeWindow[]) {
  const t = (hhmm: string, suffix: boolean) => {
    const [h, m] = hhmm.split(":").map(Number);
    return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix ? ` ${h >= 12 ? "PM" : "AM"}` : ""}`;
  };
  return windows
    .map((w) => {
      const sameHalf = Number(w.from.slice(0, 2)) >= 12 === Number(w.to.slice(0, 2)) >= 12;
      return `${t(w.from, !sameHalf)}-${t(w.to, true)}`;
    })
    .join(", ");
}
const mealName = (windows: TimeWindow[]) => {
  const h = Number(windows[0].from.slice(0, 2));
  return h < 11 ? "Breakfast" : h < 16 ? "Lunch" : "Dinner";
};

export function FoodCard({
  dish,
  restaurant,
  className,
  variant = "vertical",
  dark,
  disabled,
  disabledReason,
}: {
  dish: Dish;
  restaurant: Restaurant;
  className?: string;
  variant?: "vertical" | "row";
  dark?: boolean;
  /** Kitchen-level block (paused / closed at arrival); dish windows are checked here. */
  disabled?: boolean;
  disabledReason?: string;
}) {
  const quantity = useCartStore(selectQuantity(dish.id));
  const add = useCartStore((s) => s.add);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const moment = useDeliveryMoment(restaurant.stationCode);
  const imgRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const windows = dish.availableWindows;
  const inWindow = !windows || !moment || isWithinWindows(moment.hhmm, windows);
  const blocked = Boolean(disabled) || !inWindow;
  const reason = disabled ? disabledReason : windows && !inWindow ? `Available for ${formatWindows(windows)} deliveries` : undefined;

  const handleAdd = () => {
    if (blocked) return;
    // A conflict opens the global ReplaceCartModal via the store.
    if (add(dish, restaurant) === "conflict") return;
    flyToCart(imgRef.current, dish.image);
    toast({ title: `${dish.name} added`, description: `From ${restaurant.name}`, tone: "success" });
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card, { rotateY: dx * 6, rotateX: -dy * 6, duration: 0.5, ease: "power2.out", transformPerspective: 900 });
  };
  const onLeave = () => {
    if (cardRef.current) gsap.to(cardRef.current, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
  };

  const windowChip = windows && (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold max-sm:text-xs", inWindow ? "bg-gold-200 text-cocoa-800" : "bg-cream-100 text-muted")}>
      <Clock3 className="size-3" /> {mealName(windows)} · {formatWindows(windows)}
    </span>
  );

  const addControl =
    quantity > 0 ? (
      <QuantityControl value={quantity} onIncrement={() => increment(dish.id)} onDecrement={() => decrement(dish.id)} label={dish.name} />
    ) : (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleAdd}
          disabled={blocked}
          title={reason}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-copper-500 bg-white px-4 max-lg:h-11 text-[13px] font-bold uppercase tracking-[0.1em] text-copper-700 transition-[background-color,color,transform] duration-200 hover:bg-copper-500 hover:text-cream-50 active:scale-95 disabled:cursor-not-allowed disabled:border-line disabled:bg-cream-100 disabled:text-muted disabled:hover:bg-cream-100 disabled:hover:text-muted disabled:active:scale-100"
          aria-label={blocked ? `${dish.name} unavailable: ${reason ?? "not available for this delivery"}` : `Add ${dish.name} to cart`}
        >
          <Plus className="size-4" /> Add
        </button>
        {blocked && reason && <span className={cn("max-w-[11rem] text-right text-[11px] font-medium leading-tight max-sm:text-xs", dark ? "text-cream-50/60" : "text-muted")}>{reason}</span>}
      </div>
    );

  if (variant === "row") {
    return (
      <div ref={cardRef} className={cn("flex gap-4 rounded-2xl border border-line bg-white p-3 shadow-card", className)}>
        <div ref={imgRef} className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:size-32">
          <Image src={dish.image} alt={dish.name} fill sizes="128px" className={cn("object-cover", blocked && "grayscale")} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <VegDot type={dish.veg} />
            {dish.bestseller && <Badge tone="gold">Bestseller</Badge>}
            {dish.jain && <Badge tone="leaf">Jain</Badge>}
            {windowChip}
          </div>
          <h4 className="mt-1.5 font-semibold text-cocoa-900">{dish.name}</h4>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{dish.description}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <div>
              <Price value={dish.price} mrp={dish.mrp} />
              {dish.rating && (
                <p className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-cocoa-700">
                  <Star className="size-3 fill-gold-500 text-gold-500" /> {dish.rating.toFixed(1)}
                </p>
              )}
            </div>
            <span className="inline-flex w-[108px] shrink-0 justify-end">{addControl}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border shadow-card transition-shadow duration-300 hover:shadow-lift",
        dark ? "border-cream-50/10 bg-cocoa-800 text-cream-50" : "border-line/80 bg-white",
        className,
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div ref={imgRef} className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <Image src={dish.image} alt={dish.name} fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw" className={cn("object-cover transition-transform duration-700 ease-(--ease-out-quart) group-hover:scale-[1.07]", blocked && "grayscale")} />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md bg-white/95 p-0.5">
            <VegDot type={dish.veg} />
          </span>
          {dish.bestseller && <Badge tone="gold">Bestseller</Badge>}
        </div>
        {dish.spicy && dish.spicy >= 2 ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-chili-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
            <Flame className="size-3" /> {dish.spicy === 3 ? "Fiery" : "Spicy"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn("font-display text-lg font-semibold leading-tight", dark ? "text-cream-50" : "text-cocoa-900")}>{dish.name}</h4>
          {dish.rating && (
            <span className={cn("inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold", dark ? "text-cream-50/80" : "text-cocoa-700")}>
              <Star className="size-3 fill-gold-500 text-gold-500" /> {dish.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className={cn("mt-1 line-clamp-2 text-[13px]", dark ? "text-cream-50/60" : "text-muted")}>{dish.description}</p>
        {windowChip && <div className="mt-2">{windowChip}</div>}
        <div className="mt-auto flex items-center justify-between pt-4">
          <Price value={dish.price} mrp={dish.mrp} size="lg" className={cn(dark && "text-cream-50")} />
          <span className="inline-flex w-[108px] shrink-0 justify-end">{addControl}</span>
        </div>
      </div>
    </div>
  );
}
