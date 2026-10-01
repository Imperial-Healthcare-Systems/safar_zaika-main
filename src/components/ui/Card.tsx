import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  tone?: "white" | "cream" | "dark" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
}

const tones = {
  white: "bg-white border border-line/80 shadow-card",
  cream: "bg-cream-100 border border-line/70",
  dark: "bg-cocoa-900 text-cream-50 border border-cream-50/10",
  glass: "glass text-cream-50",
};
const paddings = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export function Card({ interactive, tone = "white", padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        tones[tone],
        paddings[padding],
        interactive && "transition-[transform,box-shadow] duration-400 ease-(--ease-out-quart) hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      {...rest}
    />
  );
}
