import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackingSkeleton, TrackingView } from "@/components/tracking/TrackingView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Track order ${id.toUpperCase()}` };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const orderId = id.toUpperCase();
  return (
    <Suspense fallback={<TrackingSkeleton id={orderId} />}>
      <TrackingView id={orderId} />
    </Suspense>
  );
}
