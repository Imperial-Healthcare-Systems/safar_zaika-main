import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review your order before it heads to the kitchen.",
};

export default function CartPage() {
  return <CartView />;
}
