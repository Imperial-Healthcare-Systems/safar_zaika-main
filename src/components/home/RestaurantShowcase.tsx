"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { A11y, Keyboard, Mousewheel, Navigation } from "swiper/modules";
import { ArrowRight } from "lucide-react";
import "swiper/css";
import { restaurants } from "@/data/restaurants";
import { gsap } from "@/lib/gsap";
import { Button, SectionHeading } from "@/components/ui";
import { CarouselArrows } from "@/components/ui/CarouselArrows";
import { Reveal, staggerIn, useReveal } from "@/components/animations/Reveal";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { useCarouselCrawl, useHeadingParallax, useScrollSkew } from "@/hooks/useScrollSkew";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const modules = [Navigation, Mousewheel, Keyboard, A11y];

/** Kitchens on a slow endless crawl (30px/s, loop mode); hover or a touch holds it, arrows / wheel nudge it and it resumes after 6s. */
export function RestaurantShowcase() {
  const featured = restaurants.filter((r) => r.featured).slice(0, 10);
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperClass | null>(null);
  const reduced = useReducedMotion();
  useHeadingParallax(headRef, { x: 28, y: 0 });
  useScrollSkew(trackRef);
  useCarouselCrawl(swiperRef, { enabled: !reduced, pxPerSec: 30 });
  const dragGuard = useDragGuard();

  // Cards slide in from the right while each photo wipes open from its right edge.
  useReveal(trackRef, (el) => {
    const slides = Array.from(el.querySelectorAll(".swiper-slide"));
    const photos = Array.from(el.querySelectorAll(".swiper-slide img"));
    gsap.set(slides, { autoAlpha: 0, x: 72 });
    gsap.set(photos, { clipPath: "inset(0% 0% 0% 100%)" });
    return () =>
      gsap
        .timeline()
        .add(staggerIn(slides, { autoAlpha: 1, x: 0 }, 0.09))
        .add(staggerIn(photos, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power3.inOut" }, 0.09), 0.2);
  });

  return (
    <section className="py-20 sm:py-24" aria-labelledby="rest-title">
      <div ref={headRef} className="container-x">
        <Reveal variant="slide-right">
          <SectionHeading
            title={<span id="rest-title">Kitchens within 3 km of the platform</span>}
            description="Independent restaurants, verified for hygiene, packaging and on-time handover."
            action={
              <div className="flex items-center gap-3">
                <Button href="/restaurants" variant="outline" rightIcon={<ArrowRight className="size-4" />}>
                  All kitchens
                </Button>
                <CarouselArrows prevClass="rest-prev" nextClass="rest-next" label="kitchens" />
              </div>
            }
          />
        </Reveal>
      </div>
      <div ref={trackRef} {...dragGuard} className="mt-10 pl-[max(1rem,calc((100vw-82rem)/2+2.5rem))]">
        {/* max-w keeps loop mode valid on ultrawide screens: loop needs more slides than fit in view. */}
        <Swiper
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          modules={modules}
          className="!mx-0 max-w-[1800px] !overflow-visible"
          data-lenis-prevent-horizontal
          loop
          loopPreventsSliding={false}
          navigation={{ prevEl: ".rest-prev", nextEl: ".rest-next" }}
          mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          slidesPerView="auto"
          spaceBetween={20}
          speed={650}
          grabCursor
        >
          {featured.map((r) => (
            <SwiperSlide key={r.id} className="!h-auto !w-[300px] sm:!w-[340px]">
              <RestaurantCard restaurant={r} showStation />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
