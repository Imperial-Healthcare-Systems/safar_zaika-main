import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LiveJourney } from "@/components/home/LiveJourney";
import { Accordion, Button, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "Enter your PNR, pick a station, choose your food, pay your way and eat at your seat. Five stops between you and a great meal.",
};

const faq = [
  {
    q: "How far ahead do I need to order?",
    a: "At least 45 minutes before your train reaches the delivery station. The app only shows stations where a kitchen can still cook, pack and reach the platform in time, so if a station is listed, you can order there.",
  },
  {
    q: "What happens if my train is running late?",
    a: "We follow the train's live position and push the new arrival time to the kitchen and the delivery partner automatically. Cooking is timed to when you actually arrive, not the printed timetable.",
  },
  {
    q: "Can I pay cash when the food arrives?",
    a: "Yes. Choose cash on delivery at checkout and pay the delivery partner at your seat. UPI, cards and net banking are available if you'd rather pay upfront.",
  },
  {
    q: "Do you have Jain and pure-veg options?",
    a: "Many partner kitchens are pure-veg and several offer Jain thalis with no onion, garlic or root vegetables. Use the Jain and pure-veg filters when browsing a station's kitchens.",
  },
  {
    q: "Can I cancel an order?",
    a: "Free of charge until the kitchen starts preparing your food, usually 45–60 minutes before the delivery station. After that, cancellation depends on the kitchen and the tracking page shows whether it's still possible.",
  },
  {
    q: "Where exactly is the food handed over?",
    a: "At your seat. The delivery partner waits on the platform near your coach, boards during the halt and hands over sealed packaging at your berth. Prefer to meet at the coach door? Say so in the order notes.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="h-24 sm:h-28" aria-hidden />
      <HowItWorks standalone />

      <section className="container-x py-20 sm:py-24" aria-labelledby="faq-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading title={<span id="faq-title">What travellers ask first.</span>} description="Lead times, late trains, cash, Jain food, cancellations and where the hand-over happens." />
          <Accordion items={faq} />
        </div>
      </section>

      <LiveJourney />

      <section className="container-x py-20 text-center sm:py-24">
        <h2 className="text-balance font-display text-4xl text-cocoa-900 sm:text-6xl">
          Your seat is the <span className="text-copper-600">table.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted">Enter a PNR or a train number and we&apos;ll show you every kitchen on the route.</p>
        <Button href="/order" size="xl" className="mt-8" rightIcon={<ArrowRight className="size-4" />}>
          Start an order
        </Button>
      </section>
    </>
  );
}
