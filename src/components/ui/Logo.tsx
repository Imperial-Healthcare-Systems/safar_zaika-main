import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand marks from the supplied kit.
 *  - "horizontal-white" / "horizontal-color": the horizontal lockup on a transparent background (navbar)
 *  - "stacked-white" / "stacked-color": the stacked lockup on a transparent background (footer, dark panels)
 *  - "horizontal": the horizontal master on its cream plate, cropped to the artwork band
 *  - "badge": the stacked master as a square cream plate
 *  - "mark": emblem only, for tiny decorative use
 * Size with a height class (e.g. h-12); width follows the artwork ratio.
 */
type Variant = "horizontal-white" | "horizontal-color" | "stacked-white" | "stacked-color" | "horizontal" | "badge" | "mark" | "stacked";

const flat: Record<"horizontal-white" | "horizontal-color" | "stacked-white" | "stacked-color", { src: string; w: number; h: number }> = {
  "horizontal-white": { src: "/brand/logo-horizontal-white.svg", w: 1052, h: 412 },
  "horizontal-color": { src: "/brand/logo-horizontal.svg", w: 1052, h: 412 },
  "stacked-white": { src: "/brand/logo-stacked-white.svg", w: 978, h: 844 },
  "stacked-color": { src: "/brand/logo-stacked.svg", w: 978, h: 844 },
};

export function Logo({
  variant = "horizontal-color",
  tone = "color",
  className,
  href = "/",
  priority,
  rounded = "rounded-xl",
}: {
  variant?: Variant;
  tone?: "color" | "white";
  className?: string;
  href?: string | null;
  priority?: boolean;
  rounded?: string;
}) {
  let img: React.ReactNode;
  if (variant in flat) {
    const f = flat[variant as keyof typeof flat];
    img = <Image src={f.src} alt="Safar Zaika" width={f.w} height={f.h} priority={priority} className={cn("h-12 w-auto", className)} />;
  } else if (variant === "mark") {
    img = <Image src={tone === "white" ? "/brand/mark-white.svg" : "/brand/mark.svg"} alt="Safar Zaika" width={810} height={797} priority={priority} className={cn("h-full w-auto", className)} />;
  } else if (variant === "horizontal") {
    // Artwork band of the 1080x1080 master: x 28-1045, y 332-733.
    img = (
      <span className={cn("relative block h-14 overflow-hidden bg-[#f3e5cb]", rounded, className)} style={{ aspectRatio: "1017 / 401" }}>
        <Image
          src="/brand/safar-zaika-horizontal.png"
          alt="Safar Zaika"
          width={1081}
          height={1081}
          priority={priority}
          sizes="320px"
          className="absolute max-w-none"
          style={{ width: "106.245%", height: "auto", left: "-2.753%", top: "-82.79%" }}
        />
      </span>
    );
  } else {
    // Stacked master: the square plate is the artwork.
    img = (
      <span className={cn("relative block aspect-square h-14 overflow-hidden bg-[#f3e5cb]", rounded, className)}>
        <Image src="/brand/safar-zaika-logo.png" alt="Safar Zaika" fill priority={priority} sizes="320px" className="object-cover" />
      </span>
    );
  }
  if (!href) return img;
  return (
    <Link href={href} aria-label="Safar Zaika home" className="inline-flex items-center">
      {img}
    </Link>
  );
}
