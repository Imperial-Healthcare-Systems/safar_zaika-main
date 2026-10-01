import { Hero } from "@/components/hero/Hero";
import { StatsBand } from "@/components/home/StatsBand";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Categories } from "@/components/home/Categories";
import { MealTimes } from "@/components/home/MealTimes";
import { FoodDiscovery } from "@/components/home/FoodDiscovery";
import { RestaurantShowcase } from "@/components/home/RestaurantShowcase";
import { StationCoverage } from "@/components/home/StationCoverage";
import { LiveJourney } from "@/components/home/LiveJourney";
import { FoodJourney } from "@/components/home/FoodJourney";
import { BulkCta } from "@/components/home/BulkCta";
import { TrustSection } from "@/components/home/TrustSection";
import { OffersSection } from "@/components/offers/OffersSection";
import { Testimonials } from "@/components/testimonials/Testimonials";
import { CtaBand } from "@/components/home/CtaBand";

/** Sections enter with their own restrained reveals; the hero has its own intro. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <HowItWorks />
      <Categories />
      <MealTimes />
      <FoodDiscovery />
      <RestaurantShowcase />
      <StationCoverage />
      <LiveJourney />
      <FoodJourney />
      <BulkCta />
      <TrustSection />
      <OffersSection />
      <Testimonials />
      <CtaBand />
    </>
  );
}
