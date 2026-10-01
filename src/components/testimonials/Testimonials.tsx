"use client";

import { useEffect, useRef } from "react";
import Slider, { type Settings } from "react-slick";
import { Quote, Star } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { SectionHeading } from "@/components/ui";
import { CarouselArrows } from "@/components/ui/CarouselArrows";
import { Reveal, staggerIn, useReveal } from "@/components/animations/Reveal";
import { useHeadingParallax } from "@/hooks/useScrollSkew";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { testimonials } from "@/data/testimonials";

/**
 * react-slick here, Swiper everywhere else. The other rails are scrollers (variable-width slides,
 * free-mode momentum, mousewheel, a loop ticker), which is Swiper's strength.
 * This one is a classic centre-stage slider: centerMode + centerPadding, autoplay that pauses on
 * hover/focus, keyboard support and dots. That is Slick's native vocabulary and it fits in one
 * settings object. Dots are rendered through appendDots/customPaging and styled as copper bars in
 * src/app/carousels.css (which also imports slick.css).
 * Breakpoints are passed as props from useMediaQuery rather than Slick's `responsive` option:
 * react-slick 0.31 only listens for matchMedia *changes*, so `responsive` never applies on first load.
 */
const settings: Settings = {
  centerMode: true,
  infinite: true,
  speed: 700,
  autoplaySpeed: 4200,
  pauseOnHover: true,
  pauseOnFocus: true,
  swipeToSlide: true,
  accessibility: true,
  arrows: false,
  dots: true,
  appendDots: (dots) => <ul>{dots}</ul>,
  customPaging: (i) => <button type="button" aria-label={`Go to review ${i + 1}`} />,
};

export function Testimonials() {
  const headRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<Slider>(null);
  const reduced = useReducedMotion();
  const xl = useMediaQuery("(min-width: 1280px)", true);
  const lg = useMediaQuery("(min-width: 1024px)", true);
  const sm = useMediaQuery("(min-width: 640px)", true);
  const layout = xl ? { slidesToShow: 3, centerPadding: "0px" } : { slidesToShow: 1, centerPadding: lg ? "160px" : sm ? "72px" : "20px" };
  const sliderBox = useRef<HTMLDivElement>(null);
  useHeadingParallax(headRef, { y: 16 });

  // Cards rise in with a slight tilt that alternates left / right (the figure, not the .slick-slide, which carries Slick's own transform).
  useReveal(sliderBox, (el) => {
    const cards = Array.from(el.querySelectorAll(".slick-slide figure"));
    gsap.set(cards, { autoAlpha: 0, y: 56, rotate: (i: number) => (i % 2 ? 4 : -4), transformOrigin: "50% 100%" });
    return () => staggerIn(cards, { autoAlpha: 1, y: 0, rotate: 0 }, 0.1);
  });

  // react-slick calls preventDefault() on touchend without checking `cancelable`; on mobile Chrome the
  // touch sequence already counts as a scroll, so every swipe logged an "Ignored attempt to cancel a
  // touchend" console error. Neuter preventDefault on non-cancelable touchends before React dispatches.
  useEffect(() => {
    const box = sliderBox.current;
    if (!box) return;
    const guard = (e: TouchEvent) => {
      if (!e.cancelable) e.preventDefault = () => {};
    };
    box.addEventListener("touchend", guard, { capture: true });
    return () => box.removeEventListener("touchend", guard, { capture: true });
  }, []);

  return (
    <section className="py-20 sm:py-24" aria-labelledby="testimonials-title">
      <div ref={headRef} className="container-x">
        <Reveal variant="clip-up">
          <SectionHeading
            title={<span id="testimonials-title">Stories from the window seat</span>}
            description="Demo reviews for the prototype. Real ones will come from real journeys."
            action={<CarouselArrows onPrev={() => sliderRef.current?.slickPrev()} onNext={() => sliderRef.current?.slickNext()} label="reviews" />}
          />
        </Reveal>
      </div>
      <div ref={sliderBox} className="container-x mt-10">
        <Slider ref={sliderRef} {...settings} {...layout} autoplay={!reduced} className="testimonial-slider">
          {testimonials.map((t) => (
            <div key={t.id} className="flex h-full px-2.5 sm:px-3">
              <figure className="flex flex-1 flex-col rounded-3xl border border-line bg-white p-6 shadow-card">
                <Quote className="size-6 text-copper-300" aria-hidden />
                <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-cocoa-800">{t.quote}</blockquote>
                <figcaption className="mt-5 border-t border-line pt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-cocoa-900">{t.name}</p>
                    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < t.rating ? "fill-gold-500 text-gold-500" : "text-cream-300"}`} />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                    <span>{t.route}</span>
                    <span className="signboard !text-[10px]">{t.station}</span>
                    <span className="font-semibold text-copper-600">{t.dish}</span>
                  </p>
                </figcaption>
              </figure>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
