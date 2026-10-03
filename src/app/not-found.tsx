import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { TrainIcon } from "@/components/animations/TrainIcon";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[70vh] flex-col items-center justify-center pb-24 pt-40 text-center">
      <div className="relative">
        <span aria-hidden className="absolute inset-x-[-4rem] bottom-[14%] border-t-2 border-dashed border-cocoa-900/20" />
        <TrainIcon className="relative h-16 w-auto text-cocoa-900 sm:h-20" title="A train with nowhere to stop" />
      </div>
      <h1 className="mt-10 text-balance font-display text-[2.125rem] text-cocoa-900 sm:text-[2.75rem]">We can&apos;t find that page.</h1>
      <p className="mt-5 max-w-md text-muted">The link may be old or the address mistyped. Head back home, or start your order from here.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="outline" size="lg">
          Back to home
        </Button>
        <Button href="/order" size="lg" rightIcon={<ArrowRight className="size-4" />}>
          Order food
        </Button>
      </div>
    </section>
  );
}
