"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard, Mousewheel, Navigation } from "swiper/modules";
import { ArrowRight } from "lucide-react";
import "swiper/css";
import { dishMap } from "@/data/menu";
import { restaurantMap } from "@/data/restaurants";
import { Button, SectionHeading } from "@/components/ui";
import { CarouselArrows } from "@/components/ui/CarouselArrows";
import { Reveal } from "@/components/animations/Reveal";
import { FoodCard } from "@/components/menu/FoodCard";
import { useHeadingParallax, useScrollSkew } from "@/hooks/useScrollSkew";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useHydrated } from "@/hooks/useHydrated";
import { selectSelectedStation, useJourneyStore } from "@/stores";

// Curated picks (dish + the kitchen that serves it) for the home carousel.
const picks: [string, string][] = [
  ["d-chicken-biryani", "biryani-darbar"],
  ["d-deluxe-thali", "sayaji-thali"],
  ["d-butter-chicken", "makhani-co"],
  ["d-pav-bhaji", "chowpatty-chaat"],
  ["d-paneer-butter-masala", "makhani-co"],
  ["d-galouti" in dishMap ? "d-galouti" : "d-kebab-platter", "awadhi-dastarkhwan"],
  ["d-masala-dosa", "udupi-express"],
  ["d-gulab-jamun", "mishti-ghar"],
  ["d-masala-chai", "surti-rasoi"],
];

const modules = [Navigation, Mousewheel, Keyboard, Autoplay, A11y];

/** Looping dish rail that advances itself every 3.6s and pauses on hover / while you interact. */
export function FoodDiscovery() {
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const selected = useJourneyStore(selectSelectedStation);
  const halt = hydrated ? selected?.station : undefined;
  useHeadingParallax(headRef, { x: -28, y: 0 });
  useScrollSkew(trackRef);
  const dragGuard = useDragGuard();

  return (
    <section className="relative overflow-hidden bg-cream-100 py-14 sm:py-16" aria-labelledby="food-title">
      <div aria-hidden className="absolute inset-0 map-grid opacity-50" />
      <div ref={headRef} className="container-x relative">
        <Reveal variant="slide-left">
          <SectionHeading
            title={<span id="food-title">Dishes worth checking the clock for</span>}
            description="Chef-picked dishes from partner kitchens. Add to cart right here."
            action={<CarouselArrows prevClass="food-prev" nextClass="food-next" label="dishes" />}
          />
        </Reveal>
      </div>
      {/* Below 640px the cards are a centred deck (neighbours peek on both sides); from 640px a left-aligned row that bleeds right. */}
      <div ref={trackRef} {...dragGuard} className="relative mt-8 sm:pl-[max(1rem,calc((100vw-82rem)/2+2.5rem))]">
        <Reveal variant="tilt" stagger={0.08} selector=".swiper-slide">
          {/* Autoplay cannot be switched on after init, so a reduced-motion change remounts (key).
              max-w keeps loop mode valid on ultrawide screens: loop needs more slides than fit in view. */}
          <Swiper
            key={reduced ? "static" : "auto"}
            modules={modules}
            className="!mx-0 max-w-[1800px] !overflow-visible"
            data-lenis-prevent-horizontal
            loop
            loopPreventsSliding={false}
            autoplay={reduced ? false : { delay: 3600, pauseOnMouseEnter: true, disableOnInteraction: false }}
            navigation={{ prevEl: ".food-prev", nextEl: ".food-next" }}
            mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            slidesPerView="auto"
            spaceBetween={20}
            speed={650}
            grabCursor
            centeredSlides
            breakpoints={{ 640: { centeredSlides: false } }}
          >
            {picks.map(([dishId, restaurantId]) => {
              const dish = dishMap[dishId];
              const restaurant = restaurantMap[restaurantId];
              if (!dish || !restaurant) return null;
              return (
                <SwiperSlide key={dishId} className="!h-auto !w-[280px] sm:!w-[320px]">
                  <FoodCard dish={dish} restaurant={restaurant} />
                </SwiperSlide>
              );
            })}
          </Swiper>
        </Reveal>
      </div>
      <div className="container-x relative mt-8">
        <Button href={halt ? `/restaurants?station=${halt.code}` : "/restaurants"} variant="outline" size="lg" rightIcon={<ArrowRight className="size-4" />}>
          {halt ? `See all kitchens at ${halt.name}` : "See all kitchens"}
        </Button>
      </div>
    </section>
  );
}
