import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { BulkOrderForm } from "@/components/bulk-order/BulkOrderForm";
import { AUDIENCES } from "@/components/bulk-order/constants";

export const metadata: Metadata = {
  title: "Bulk & group orders",
  description: "Feed a family, a tour group or a whole office on one train with a single order. A coordinator confirms the menu and timing.",
};

export default function BulkOrderPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            Feed the whole group. <span className="text-copper-600">One order.</span>
          </>
        }
        description="Tell us the headcount, the train and what everyone likes to eat. A coordinator confirms the menu, timing and price, then every pack is handed over together at the platform."
      >
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Who this is for">
          {AUDIENCES.map((a) => (
            <li key={a} className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold text-cocoa-800">
              {a}
            </li>
          ))}
        </ul>
      </PageHeader>
      <BulkOrderForm />
    </>
  );
}
