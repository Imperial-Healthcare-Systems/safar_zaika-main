"use client";

import { Button, Modal } from "@/components/ui";
import { flyToCart } from "@/lib/flyToCart";
import { toast, useCartStore } from "@/stores";

/** Resolves "items from another kitchen" conflicts — one cart, one restaurant, one delivery slot. */
export function ReplaceCartModal() {
  const pending = useCartStore((s) => s.pendingReplace);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const replaceWith = useCartStore((s) => s.replaceWith);
  const cancelReplace = useCartStore((s) => s.cancelReplace);

  return (
    <Modal open={Boolean(pending)} onClose={cancelReplace} size="sm" title="Start a new cart?" description={`Your cart has items from ${restaurantName ?? "another kitchen"}. One order ships from one kitchen so it arrives together at your seat.`}>
      <div className="flex flex-col gap-2 px-6 pb-6 pt-5 sm:flex-row-reverse">
        <Button
          full
          onClick={() => {
            if (!pending) return;
            replaceWith(pending.dish, pending.restaurant);
            flyToCart(null, pending.dish.image);
            toast({ title: "Cart replaced", description: `Now ordering from ${pending.restaurant.name}`, tone: "success" });
          }}
        >
          Replace cart
        </Button>
        <Button full variant="outline" onClick={cancelReplace}>
          Keep current cart
        </Button>
      </div>
    </Modal>
  );
}
