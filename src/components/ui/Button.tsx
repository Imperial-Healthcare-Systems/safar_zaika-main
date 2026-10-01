"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "light" | "glass" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary:
    "gradient-brand text-cream-50 shadow-[0_10px_24px_-10px_rgba(184,110,36,0.75)] hover:shadow-[0_16px_34px_-10px_rgba(184,110,36,0.85)] hover:-translate-y-0.5",
  secondary: "bg-cocoa-900 text-cream-50 hover:bg-cocoa-800 hover:-translate-y-0.5 shadow-[0_10px_24px_-12px_rgba(42,20,7,0.6)]",
  outline: "border border-cocoa-900/15 bg-white/70 text-cocoa-900 hover:border-cocoa-900/30 hover:bg-white",
  ghost: "text-cocoa-900 hover:bg-cocoa-900/6",
  light: "bg-cream-50 text-cocoa-900 hover:bg-white hover:-translate-y-0.5 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]",
  glass: "glass text-cream-50 hover:bg-cream-50/15",
  danger: "bg-chili-500 text-white hover:bg-chili-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5 max-lg:h-10",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-[15px] gap-2",
  xl: "h-14 px-8 text-base gap-2.5",
  icon: "h-11 w-11 p-0",
  "icon-sm": "h-9 w-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  href?: string;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leftIcon, rightIcon, href, full, className, children, disabled, type, onClick, ...rest },
  ref,
) {
  const classes = cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[transform,box-shadow,background-color,border-color] duration-300 ease-(--ease-out-quart) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    full && "w-full",
    className,
  );
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || loading}
        // Link buttons still get their click handler (e.g. "close the drawer, then navigate").
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type ?? "button"} className={classes} disabled={disabled || loading} aria-busy={loading} onClick={onClick} {...rest}>
      {content}
    </button>
  );
});
