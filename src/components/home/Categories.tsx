"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { A11y, FreeMode, Keyboard, Mousewheel, Navigation, Scrollbar } from "swiper/modules";
import "swiper/css";
import { categories } from "@/data/menu";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui";
import { CarouselArrows, SwiperProgress } from "@/components/ui/CarouselArrows";
import { Reveal } from "@/components/animations/Reveal";
import { useCarouselCrawl, useHeadingParallax, useScrollSkew } from "@/hooks/useScrollSkew";
import { useDragGuard } from "@/hooks/useDragGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** Two copies so Swiper's loop always has more slides than fit on screen (ultrawide included); copies are aria-hidden. */
const tickerSlides = [...categories, ...categories];
const modulesLive = [Navigation, Mousewheel, Keyboard, A11y];
const modulesFree = [...modulesLive, FreeMode, Scrollbar];

/**
 * From 640px: an endless, slowly crawling ticker (loop mode + useCarouselCrawl).
 * Below 640px or with reduced motion: a plain free-mode row with momentum and a progress bar.
 */
export function Categories() {
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperClass | null>(null);
  // Server snapshot = desktop: a desktop client then hydrates without remounting, and a phone
  // swaps loop -> free (the free instance sets its own disabled/aria states; the reverse would leave stale ones).
  const desktop = useMediaQuery("(min-width: 640px)", true);
  const reduced = useReducedMotion();
  const live = desktop && !reduced;
  useHeadingParallax(headRef);
  useScrollSkew(trackRef);
  useCarouselCrawl(swiperRef, { enabled: live, pxPerSec: 40 });
  const dragGuard = useDragGuard();

  return (
    <section className="py-20 sm:py-24" aria-labelledby="cat-title">
      <div ref={headRef} className="container-x">
        <Reveal variant="letters">
          <SectionHeading
            title={<span id="cat-title">What are you craving?</span>}
            description="Breakfast, lunch, dinner or just chai. Only kitchens that can reach your train."
            action={<CarouselArrows prevClass="cat-prev" nextClass="cat-next" label="categories" />}
          />
        </Reveal>
      </div>
      <div className="mt-10 pl-[max(1rem,calc((100vw-82rem)/2+2.5rem))]">
        <div ref={trackRef} {...dragGuard}>
          {/* The key remounts the Swiper (loop <-> free) together with its entrance, so the new circles still pop in. */}
          <Reveal key={live ? "live" : "free"} variant="zoom" scale={0.4} ease="back.out(1.6)" stagger={0.06} selector=".swiper-slide">
            <Swiper
              onSwiper={(s) => {
                swiperRef.current = s;
              }}
              modules={live ? modulesLive : modulesFree}
              className="!overflow-visible"
              data-lenis-prevent-horizontal
              slidesPerView="auto"
              spaceBetween={16}
              speed={650}
              grabCursor
              loop={live}
              loopPreventsSliding={false}
              freeMode={live ? false : { enabled: true, momentumRatio: 0.6 }}
              scrollbar={live ? false : { el: ".cat-progress", draggable: true }}
              navigation={{ prevEl: ".cat-prev", nextEl: ".cat-next" }}
              mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
              keyboard={{ enabled: true, onlyInViewport: true }}
            >
              {(live ? tickerSlides : categories).map((c, i) => {
                const copy = i >= categories.length;
                return (
                  <SwiperSlide key={`${c.id}-${copy ? "b" : "a"}`} className="!w-[132px] sm:!w-[150px]" aria-hidden={copy || undefined}>
                    <Link href={`/restaurants?category=${c.id}`} tabIndex={copy ? -1 : undefined} className="group block text-center">
                      <span className="relative mx-auto block size-[116px] overflow-hidden rounded-full border-4 border-white shadow-card transition-[transform,box-shadow] duration-500 ease-(--ease-out-quart) group-hover:-translate-y-1.5 group-hover:shadow-lift sm:size-[132px]">
                        <Image src={c.image} alt="" fill sizes="132px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <span className="absolute inset-0 rounded-full ring-2 ring-inset ring-copper-500/0 transition-[box-shadow] group-hover:ring-copper-500/60" />
                      </span>
                      <span className="mt-3 block text-sm font-semibold text-cocoa-900 transition-colors group-hover:text-copper-700">{c.label}</span>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </Reveal>
        </div>
        <SwiperProgress className={cn("cat-progress mt-6 mr-4", live && "hidden")} />
      </div>
    </section>
  );
}
