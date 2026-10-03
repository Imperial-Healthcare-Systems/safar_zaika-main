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
/** Four coupons across the container on desktop; fewer below, with the next one peeking on phones. */
const breakpoints = { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } };

/** Looping coupon rail that advances itself and pauses on hover / while you interact. */
export function OffersSection() {
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useHeadingParallax(headRef, { y: -14 });
  useScrollSkew(trackRef);
  const dragGuard = useDragGuard();

  return (
    <section className="bg-cream-100 py-14 sm:py-16" aria-labelledby="offers-title">
      <div ref={headRef} className="container-x">
        <Reveal>
          <SectionHeading
            title={<span id="offers-title">Great offers</span>}
            description="Tap a code to reveal it, tap again to copy, then apply it at checkout."
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
      <div ref={trackRef} {...dragGuard} className="container-x mt-8">
        <Reveal variant="flip" stagger={0.08} selector=".swiper-slide">
          {/* Autoplay cannot be switched on after init, so a reduced-motion change remounts (key).
              The Swiper is as wide as the container, so six coupons always outnumber the four in view and loop mode stays valid.
              From 640px the row is clipped to the container (whole coupons only; 4px of padding leaves room for the hover lift). */}
          <Swiper
            key={reduced ? "static" : "auto"}
            modules={modules}
            className="!overflow-visible sm:!-my-1 sm:!overflow-hidden sm:!py-1"
            data-lenis-prevent-horizontal
            loop
            loopPreventsSliding={false} /* an arrow click during an autoplay transition must not be swallowed */
            autoplay={reduced ? false : { delay: 2800, pauseOnMouseEnter: true, disableOnInteraction: false }}
            navigation={{ prevEl: ".offers-prev", nextEl: ".offers-next" }}
            mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
            keyboard={{ enabled: true, onlyInViewport: true }}
            slidesPerView={1.15}
            breakpoints={breakpoints}
            spaceBetween={16}
            speed={650}
            grabCursor
            touchEventsTarget="container" /* a swipe that starts in the gap between two coupons still counts */
          >
            {offers.map((o) => (
              <SwiperSlide key={o.code} className="!h-auto">
                <OfferCard offer={o} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Reveal>
      </div>
    </section>
  );
}
