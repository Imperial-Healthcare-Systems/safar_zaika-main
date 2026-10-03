"use client";

import Image from "next/image";
import { useRef } from "react";
import { Armchair, Box, Store, TrainFront } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/utils";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

const chain = [
  { title: "Restaurant", desc: "Verified partner accepts your order", image: "/images/scenes/restaurant-serving.jpg", icon: Store },
  { title: "Kitchen", desc: "Cooked fresh, timed to your ETA", image: "/images/scenes/kitchen-cooking.jpg", icon: null },
  { title: "Packaging", desc: "Sealed, insulated, tamper-evident", image: null, icon: Box },
  { title: "Delivery partner", desc: "Tracks your train in real time", image: "/images/scenes/delivery-rider.jpg", icon: null },
  { title: "Station", desc: "Waits on the right platform", image: null, icon: null, mark: true },
  { title: "Train", desc: "Finds your coach as it halts", image: null, icon: TrainFront },
  { title: "You", desc: "Hot meal, at your berth", image: "/images/scenes/friends-eating.jpg", icon: Armchair },
];

/** Two rails and sleepers, painted in currentColor so one style serves both the idle and the lit track. */
const TRACK = {
  backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 22px), linear-gradient(currentColor, currentColor), linear-gradient(currentColor, currentColor)",
  backgroundSize: "100% 100%, 100% 3px, 100% 3px",
  backgroundPosition: "0 0, 0 0, 0 100%",
  backgroundRepeat: "repeat-x, no-repeat, no-repeat",
} as const;

/** The operational chain on a railway track: the track lights up with the scroll, the stops drop onto it and bounce. */
export function FoodJourney() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(
        el.querySelector("[data-line]"),
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 60%", scrub: 0.6 } },
      );
    },
    { scope: ref },
  );

  return (
    <section className="py-20 sm:py-24" aria-labelledby="chain-title">
      <div className="container-x">
        <Reveal variant="letters">
          <SectionHeading align="center" title={<span id="chain-title">Kitchen to berth in seven hand-offs.</span>} description="Each one is timed to your train's live position, not the printed timetable." />
        </Reveal>
        <div ref={ref} className="relative mt-14">
          <div aria-hidden className="absolute inset-x-0 top-[45px] hidden h-3.5 lg:block">
            <div className="absolute inset-0 text-cream-300" style={TRACK} />
            <div data-line className="absolute inset-0 text-copper-600" style={TRACK} />
          </div>
          <Reveal y={-64} ease="bounce.out" stagger={0.1} selector="[data-node]" start="top 80%">
            <ol className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 lg:grid-cols-7">
              {chain.map((c, i) => (
                <li key={c.title} data-node className="flex flex-col items-center text-center">
                  <div className="relative z-10">
                    <div className="relative flex size-[104px] items-center justify-center overflow-hidden rounded-full border-4 border-cream-50 bg-white shadow-card">
                      {c.image ? (
                        <Image src={c.image} alt="" fill sizes="104px" className="object-cover" />
                      ) : c.mark ? (
                        <Image src="/brand/mark.svg" alt="" width={64} height={64} className="size-14" />
                      ) : c.icon ? (
                        <c.icon className="size-9 text-copper-700" />
                      ) : null}
                    </div>
                    <span aria-hidden className="signboard absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg text-cocoa-900">{c.title}</h3>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{c.desc}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
