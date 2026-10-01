"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard, Mousewheel, Navigation } from "swiper/modules";
import { ArrowRight } from "lucide-react";
import "swiper/css";
import { offers } from "@/data/offers";
import { Button, SectionHeading } from "@/components/ui";
import { CarouselArrows } from "@/components/ui/CarouselArrows";
import { Reveal } from "@/components/animations/Reveal";
import { useHeadingParallax, useScrollSkew } from "@/hooks/useScrollSkew";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { OfferCard } from "./OfferCard";

const modules = [Navigation, Mousewheel, Keyboard, Autoplay, A11y];

/** Looping offer rail that advances itself and pauses on hover / while you interact, like a food app's promo row. */
export function OffersSection() {
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useHeadingParallax(headRef, { y: -20 });
  useScrollSkew(trackRef);
  const dragGuard = useDragGuard();

  return (
    <section className="bg-cream-100 py-20 sm:py-24" aria-labelledby="offers-title">
      <div ref={headRef} className="container-x">
        <Reveal variant="zoom">
          <SectionHeading
            title={<span id="offers-title">A little extra for the long way home</span>}
            description="Reveal a code, copy it, apply at checkout."
            action={
              <div className="flex items-center gap-3">
                <Button href="/offers" variant="outline" rightIcon={<ArrowRight className="size-4" />}>
                  All offers
                </Button>
                <CarouselArrows prevClass="offers-prev" nextClass="offers-next" label="offers" />
              </div>
            }
          />
        </Reveal>
      </div>
      <div ref={trackRef} {...dragGuard} className="mt-10 pl-[max(1rem,calc((100vw-82rem)/2+2.5rem))]">
        <Reveal variant="flip" stagger={0.08} selector=".swiper-slide">
          {/* Autoplay cannot be switched on after init, so a reduced-motion change remounts (key).
              max-w keeps loop mode valid on ultrawide screens: loop needs more slides than fit in view. */}
          <Swiper
            key={reduced ? "static" : "auto"}
            modules={modules}
            className="!mx-0 max-w-[1800px] !overflow-visible"
            data-lenis-prevent-horizontal
            loop
            loopPreventsSliding={false} /* an arrow click during an autoplay transition must not be swallowed */
            autoplay={reduced ? false : { delay: 2800, pauseOnMouseEnter: true, disableOnInteraction: false }}
            navigation={{ prevEl: ".offers-prev", nextEl: ".offers-next" }}
            mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            slidesPerView="auto"
            spaceBetween={18}
            speed={650}
            grabCursor
          >
            {offers.map((o) => (
              <SwiperSlide key={o.code} className="!h-auto !w-[320px] sm:!w-[360px]">
                <OfferCard offer={o} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Reveal>
      </div>
    </section>
  );
}
