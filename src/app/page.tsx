import { Hero } from "@/components/hero/Hero";
import { StatsBand } from "@/components/home/StatsBand";
import { EasySteps } from "@/components/home/EasySteps";
import { TrainToolsGrid } from "@/components/home/TrainToolsGrid";
import { Categories } from "@/components/home/Categories";
import { MealTimes } from "@/components/home/MealTimes";
import { FoodDiscovery } from "@/components/home/FoodDiscovery";
import { RestaurantShowcase } from "@/components/home/RestaurantShowcase";
import { StationCoverage } from "@/components/home/StationCoverage";
import { LiveJourney } from "@/components/home/LiveJourney";
import { RecentOrders } from "@/components/home/RecentOrders";
import { HomeGuide } from "@/components/home/HomeGuide";
import { BulkCta } from "@/components/home/BulkCta";
import { TrustSection } from "@/components/home/TrustSection";
import { OffersSection } from "@/components/offers/OffersSection";
import { Testimonials } from "@/components/testimonials/Testimonials";
import { CtaBand } from "@/components/home/CtaBand";

/** Search first, then the order in four steps, tools and offers; group orders sit with the meal sections, and
 * browsing, proof and the long read follow. Each section has its own entrance. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <EasySteps />
      <TrainToolsGrid />
      <OffersSection />
      <Categories />
      <MealTimes />
      <BulkCta />
      <FoodDiscovery />
      <RestaurantShowcase />
      <TrustSection />
      <StationCoverage />
      <LiveJourney />
      <RecentOrders />
      <Testimonials />
      <HomeGuide />
      <CtaBand />
    </>
  );
}
