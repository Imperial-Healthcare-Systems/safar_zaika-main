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
        <TrainIcon className="relative size-28 text-cocoa-900 sm:size-36" title="A train with nowhere to stop" />
      </div>
      <h1 className="mt-10 text-balance font-display text-[2.75rem] text-cocoa-900 sm:text-7xl">
        Platform <span className="signboard mx-1 align-[0.08em] text-[0.42em]">404</span> doesn&apos;t exist.
      </h1>
      <p className="mt-5 max-w-md text-muted">The page you&apos;re looking for isn&apos;t on this route. Check the address, or head back to a station we know.</p>
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
