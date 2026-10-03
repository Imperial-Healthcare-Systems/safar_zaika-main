"use client";

import { useRef, useState } from "react";
import { Copy, Flame, Gift, Percent, TrainFront, Users, Truck } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { offerCards } from "@/data/offers";
import { toast } from "@/stores";
import type { Offer } from "@/types";

const icons: Record<Offer["type"], typeof Gift> = {
  flat: Gift,
  percent: Percent,
  "free-delivery": Truck,
  "first-order": Flame,
  station: TrainFront,
  bulk: Users,
};

/**
 * A coupon: white ticket with a dashed border and side notches, a short headline, one line of terms
 * and the code in an outlined chip. First tap on the chip reveals the code, the next taps copy it.
 */
export function OfferCard({ offer, className }: { offer: Offer; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const codeRef = useRef<HTMLSpanElement>(null);
  const Icon = icons[offer.type];
  const card = offerCards[offer.code];

  const reveal = () => {
    setRevealed(true);
    if (codeRef.current && !prefersReducedMotion()) {
      gsap.fromTo(codeRef.current, { rotateX: -90, autoAlpha: 0 }, { rotateX: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.7)", clearProps: "transform,opacity,visibility" });
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      toast({ title: `${offer.code} copied`, description: "Apply it at checkout.", tone: "success" });
    } catch {
      toast({ title: `Use code ${offer.code}`, description: "Apply it at checkout." });
    }
  };

  return (
    <article className={cn("ticket-edge flex h-full flex-col rounded-2xl border-2 border-dashed border-line bg-white px-6 py-5 transition-[translate,border-color] duration-300 hover:-translate-y-0.5 hover:border-rail-400", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-copper-50 text-copper-600">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        {offer.expires && <span className="text-xs font-semibold text-muted">Till {new Date(offer.expires).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
      </div>
      <h3 className="mt-3 text-2xl text-cocoa-900">{card?.headline ?? offer.title}</h3>
      <p className="mt-1.5 text-[13px] leading-snug text-muted">{card?.terms ?? offer.description}</p>
      <div className="mt-auto pt-4 [perspective:600px]">
        <button
          type="button"
          onClick={revealed ? copy : reveal}
          aria-label={revealed ? `Copy code ${offer.code}` : `Reveal the code for ${card?.headline ?? offer.title}`}
          className="inline-flex h-10 items-center gap-2.5 rounded-lg border-[1.5px] border-rail-500 bg-white px-3 transition-colors hover:bg-rail-50 max-lg:h-11"
        >
          <span ref={codeRef} className={cn("inline-block font-mono text-sm font-bold tracking-[0.18em]", revealed ? "text-rail-700" : "text-cocoa-900/35")}>
            {revealed ? offer.code : offer.code.replace(/./g, "•")}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-copper-700">
            {revealed ? (
              <>
                <Copy className="size-3.5" aria-hidden /> Copy
              </>
            ) : (
              "Reveal"
            )}
          </span>
        </button>
      </div>
    </article>
  );
}
