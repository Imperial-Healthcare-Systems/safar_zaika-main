import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion, Button, SectionHeading } from "@/components/ui";
import { OffersGrid } from "@/components/offers/OffersGrid";

export const metadata: Metadata = {
  title: "Offers",
  description: "Coupons for first orders, group orders, free delivery and station specials. Reveal a code, copy it, apply at checkout.",
};

const faq = [
  { q: "How do I apply a coupon?", a: "Reveal the code on the card, copy it, and paste it into the coupon field at checkout. The discount shows in your bill before you pay." },
  { q: "Can I combine two coupons?", a: "One coupon per order. If a code doesn't apply, checkout tells you exactly why — usually a minimum order amount or a station-specific code." },
  { q: "What about station specials and group codes?", a: "Station specials only work for deliveries at that station. Group codes need 10 or more meals in one order; for bigger groups, use the bulk order form and a coordinator quotes directly." },
];

export default function OffersPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            Coupons for the <span className="text-copper-500">long way home.</span>
          </>
        }
        description="Reveal a code, copy it, apply at checkout."
      />
      <OffersGrid />
      <section className="container-x pb-16 sm:pb-20" aria-labelledby="coupons-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading title={<span id="coupons-title">How coupons work.</span>} description="No hidden conditions. If a code doesn't apply, checkout says why." />
          <Accordion items={faq} />
        </div>
        <div className="mt-16 flex flex-col items-center gap-4 rounded-[2.5rem] bg-cream-100 px-6 py-12 text-center">
          <h2 className="font-display text-4xl text-cocoa-900 sm:text-5xl">Found one you like?</h2>
          <p className="max-w-md text-muted">Codes apply at checkout. Start with your PNR and we&apos;ll show every kitchen on your route.</p>
          <Button href="/order" size="xl" className="mt-2" rightIcon={<ArrowRight className="size-4" />}>
            Start an order
          </Button>
        </div>
      </section>
    </>
  );
}
