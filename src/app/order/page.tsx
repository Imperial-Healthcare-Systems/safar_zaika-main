import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/pnr/OrderView";

export const metadata: Metadata = {
  title: "Order food on your journey",
  description: "Enter your PNR or train number and see every kitchen that can deliver to your seat.",
};

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderView />
    </Suspense>
  );
}
