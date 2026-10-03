import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * First block of every inner page. Carries the top padding the fixed navbar (100px on lg, 88px below)
 * needs, so pages never have to think about it. Title + one line, nothing above it.
 */
export function PageHeader({
  title,
  description,
  actions,
  dark,
  compact,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  dark?: boolean;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section className={cn("relative overflow-hidden", dark ? "gradient-cocoa text-cream-50" : "bg-cream-100", compact ? "pb-8 pt-30 sm:pt-32 lg:pt-36" : "pb-12 pt-30 sm:pb-16 sm:pt-36 lg:pt-40", className)}>
      <div aria-hidden className={cn("absolute inset-0 opacity-60", dark ? "map-grid-dark" : "map-grid")} />
      <div aria-hidden className={cn("absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent", dark ? "from-cocoa-950/40" : "from-cream-50")} />
      <div className="container-x relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h1 className={cn("text-balance font-display leading-[0.95]", compact ? "text-[2.5rem] sm:text-5xl lg:text-6xl" : "text-[2.75rem] sm:text-6xl lg:text-7xl")}>{title}</h1>
            {description && <p className={cn("mt-4 max-w-2xl text-pretty text-base leading-relaxed sm:text-lg", dark ? "text-cream-50/70" : "text-muted")}>{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
