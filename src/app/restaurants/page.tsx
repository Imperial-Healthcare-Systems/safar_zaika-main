import type { Metadata } from "next";
import { Suspense } from "react";
import { RestaurantsView } from "@/components/restaurant/RestaurantsView";

export const metadata: Metadata = {
  title: "Restaurants",
  description: "Verified partner kitchens that can deliver to your train at the station you choose.",
};

export default function RestaurantsPage() {
  return (
    <Suspense fallback={null}>
      <RestaurantsView />
    </Suspense>
  );
}
