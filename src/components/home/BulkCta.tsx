"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

const options = ["Fixed meal packages", "Customisable menus", "Veg / Non-veg"];

export function BulkCta() {
  return (
    <section className="container-x py-10" aria-labelledby="bulk-title">
      {/* The dark card wipes open from the left; inside it the photo settles from 1.08 to 1. */}
      <Reveal variant="clip">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-cocoa-900 text-cream-50">
          <div className="grid lg:grid-cols-2">
            <div className="relative p-8 sm:p-12 lg:p-16">
              <h2 id="bulk-title" className="text-balance font-display text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
                Feed the whole group. <span className="text-gold-400">One order.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/70">
                Families, tour groups, office travel, pilgrimage parties. Tell us the headcount and the train; a coordinator confirms the menu, timing and price.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="What you can choose">
                {options.map((o) => (
                  <li key={o} className="signboard">
                    {o}
                  </li>
                ))}
              </ul>
              <Button href="/bulk-order" variant="light" size="lg" className="mt-8" rightIcon={<ArrowRight className="size-4" />}>
                Request a bulk order
              </Button>
            </div>
            <div className="relative min-h-72 lg:min-h-full">
              <Reveal variant="zoom" scale={1.08} ease="power2.out" className="absolute inset-0">
                <Image src="/images/food/biryani-platter.jpg" alt="A festive biryani platter for a group" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </Reveal>
              <div className="absolute inset-0 bg-gradient-to-r from-cocoa-900 via-cocoa-900/20 to-transparent lg:via-transparent" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
