import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section title + one supporting line. No eyebrow, no italics, no gradients:
 * the title has to carry the section on its own.
 */
export function SectionHeading({
  title,
  description,
  align = "left",
  dark,
  className,
  action,
  as: Tag = "h2",
  size = "md",
}: {
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-[1.75rem] sm:text-3xl",
    md: "text-[2.25rem] sm:text-5xl lg:text-[3.25rem]",
    lg: "text-[2.6rem] sm:text-6xl lg:text-[4.25rem]",
  };
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", align === "center" && "md:flex-col md:items-center md:text-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
        <Tag className={cn("text-balance font-display leading-[0.95]", sizes[size], dark ? "text-cream-50" : "text-cocoa-900")}>{title}</Tag>
        {description && <p className={cn("mt-3 max-w-xl text-pretty text-base leading-relaxed sm:text-lg", align === "center" && "mx-auto", dark ? "text-cream-50/70" : "text-muted")}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
