import type { Metadata } from "next";
import { StationExplorer } from "@/components/station/StationExplorer";

export const metadata: Metadata = {
  title: "Stations",
  description: "Explore the stations where Safar Zaika partner kitchens can deliver to your train.",
};

export default function StationsPage() {
  return <StationExplorer />;
}
