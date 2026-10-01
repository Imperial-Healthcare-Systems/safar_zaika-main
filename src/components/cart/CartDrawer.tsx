"use client";

import { Modal } from "@/components/ui";
import { useUIStore } from "@/stores";
import { CartPanel } from "./CartPanel";

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const setOpen = useUIStore((s) => s.setCartOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} variant="drawer" title="Your cart" description="Fresh food, timed to your train.">
      <div className="mt-4 flex flex-1 flex-col">
        <CartPanel inDrawer onNavigate={() => setOpen(false)} />
      </div>
    </Modal>
  );
}
