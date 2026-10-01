import type { Metadata } from "next";
import { JourneyView } from "@/components/journey/JourneyView";

export const metadata: Metadata = {
  title: "Your journey",
  description: "Pick the station where your food should meet your train.",
};

export default function JourneyPage() {
  return <JourneyView />;
}
