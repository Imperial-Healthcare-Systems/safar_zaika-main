import type { Metadata } from "next";
import { TrackOrderEntry } from "@/components/tracking/TrackOrderEntry";

export const metadata: Metadata = { title: "Track order" };

export default function TrackOrderPage() {
  return <TrackOrderEntry />;
}
