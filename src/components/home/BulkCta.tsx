import Image from "next/image";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui";
import { Reveal } from "@/components/animations/Reveal";

/** The group-order box: a bordered panel that wipes open from the left; on lg the photo beside it settles from 1.08 to 1. */
export function BulkCta() {
  return (
    <section className="container-x py-14 sm:py-16" aria-labelledby="bulk-title">
      <Reveal variant="clip">
        <div className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-card lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 lg:py-12">
            <h2 id="bulk-title" className="max-w-xl text-balance text-[2rem] text-cocoa-900 sm:text-4xl lg:text-[2.75rem]">
              Travelling as a group of 10 or more?
            </h2>
            <p className="mt-3 max-w-md text-pretty text-base leading-relaxed text-muted">Fixed meal packages or a customised menu, veg and non-veg, planned with you for the whole group.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href="/bulk-order" size="lg" rightIcon={<ArrowRight className="size-4" />}>
                Plan a group order
              </Button>
              <Button href="/help" variant="outline" size="lg" leftIcon={<MessageCircleQuestion className="size-4" />}>
                Help and support
              </Button>
            </div>
          </div>
          <div className="relative hidden overflow-hidden lg:block">
            <Reveal variant="zoom" scale={1.08} ease="power2.out" className="absolute inset-0">
              <Image src="/images/food/biryani-platter.jpg" alt="A biryani platter laid out for a group" fill sizes="(max-width: 1024px) 0px, 33vw" className="object-cover" />
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
