import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrainToolsView } from "@/components/tools/TrainToolsView";

export const metadata: Metadata = {
  title: "Train tools",
  description: "Check a PNR, look up a train timetable or see where a train is on its route. Demo data in this prototype.",
};

export default function TrainToolsPage() {
  return (
    <>
      <PageHeader compact title="Train tools" description="Check a PNR, a timetable or where a train is. Demo data for now." />
      {/* The tab switcher reads ?tool= on the client. Until it hydrates, a spacer keeps the footer below the fold. */}
      <Suspense fallback={<div aria-hidden className="min-h-[80svh]" />}>
        <TrainToolsView />
      </Suspense>
    </>
  );
}
