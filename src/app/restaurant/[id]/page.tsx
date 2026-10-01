import type { Metadata } from "next";
import { restaurantMap, restaurants } from "@/data/restaurants";
import { getStation } from "@/data/stations";
import { RestaurantMenuView } from "@/components/menu/RestaurantMenuView";

export function generateStaticParams() {
  return restaurants.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = restaurantMap[id];
  if (!r) return { title: "Restaurant" };
  const station = getStation(r.stationCode);
  return {
    title: `${r.name} · ${station?.name ?? r.stationCode}`,
    description: `${r.cuisines.join(", ")} delivered to your train at ${station?.name ?? r.stationCode}. ${r.prepTimeMin} min prep, ${r.deliveryConfidence}% on-time.`,
  };
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RestaurantMenuView id={id} />;
}
