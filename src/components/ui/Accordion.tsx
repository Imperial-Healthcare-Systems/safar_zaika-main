import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  q: string;
  a: string;
}

/** Native <details> — keyboard, screen reader and no-JS friendly. */
export function Accordion({ items, className, dark }: { items: AccordionItem[]; className?: string; dark?: boolean }) {
  return (
    <div className={cn("divide-y", dark ? "divide-cream-50/10" : "divide-line", className)}>
      {items.map((item, i) => (
        <details key={i} className="group py-1" open={i === 0}>
          <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold marker:content-none [&::-webkit-details-marker]:hidden", dark ? "text-cream-50" : "text-cocoa-900")}>
            {item.q}
            <ChevronDown className={cn("size-5 shrink-0 transition-transform duration-300 group-open:rotate-180", dark ? "text-gold-400" : "text-copper-600")} />
          </summary>
          <p className={cn("pb-5 pr-8 text-[15px] leading-relaxed", dark ? "text-cream-50/70" : "text-muted")}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
