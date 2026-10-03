"use client";

import { useOptimistic, useTransition, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, MapPin, PackageSearch, Radio, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PnrStatusTool } from "./PnrStatusTool";
import { ScheduleTool } from "./ScheduleTool";
import { LiveStatusTool } from "./LiveStatusTool";

/** `id` is the ?tool= value other pages link to. */
const TOOLS = [
  { id: "pnr-status", label: "PNR status", Icon: Ticket, Panel: PnrStatusTool },
  { id: "schedule", label: "Train schedule", Icon: CalendarClock, Panel: ScheduleTool },
  { id: "live-status", label: "Live train status", Icon: Radio, Panel: LiveStatusTool },
] as const;
type ToolId = (typeof TOOLS)[number]["id"];

const LINKS = [
  { href: "/stations", label: "Stations", Icon: MapPin },
  { href: "/track-order", label: "Track my order", Icon: PackageSearch },
  { href: "/bulk-order", label: "Group order", Icon: Users },
];

export function TrainToolsView() {
  const router = useRouter();
  const params = useSearchParams();
  // The URL is the source of truth (deep links, back/forward); the optimistic value makes a tab switch instant.
  const fromUrl: ToolId = TOOLS.find((t) => t.id === params.get("tool"))?.id ?? "pnr-status";
  const [tool, setTool] = useOptimistic(fromUrl);
  const [, startTransition] = useTransition();

  const select = (id: ToolId) =>
    startTransition(() => {
      setTool(id);
      router.replace(`/train-tools?tool=${id}`, { scroll: false });
    });

  // Tabs pattern: arrows / Home / End move between tabs and activate them.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TOOLS.findIndex((t) => t.id === tool);
    const n = TOOLS.length;
    const to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    select(TOOLS[to].id);
    document.getElementById(`tool-tab-${TOOLS[to].id}`)?.focus();
  };

  return (
    <section className="container-x pb-20 pt-6 sm:pt-8">
      <div role="tablist" aria-label="Train tools" onKeyDown={onKeyDown} className="grid grid-cols-3 gap-1.5 rounded-[1.25rem] bg-cream-200 p-1.5">
        {TOOLS.map(({ id, label, Icon }) => {
          const active = id === tool;
          return (
            <button
              key={id}
              id={`tool-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`tool-panel-${id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(id)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[13px] font-semibold leading-tight transition-[background-color,color,box-shadow] duration-200 sm:flex-row sm:gap-2 sm:text-[15px]",
                active ? "bg-white text-cocoa-900 shadow-card" : "text-muted hover:text-cocoa-800",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-copper-600" : "text-cocoa-400")} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {/* All three stay mounted so a result survives a tab switch. */}
      {TOOLS.map(({ id, Panel }) => (
        <div key={id} id={`tool-panel-${id}`} role="tabpanel" aria-labelledby={`tool-tab-${id}`} hidden={id !== tool} className="mt-6">
          <Panel />
        </div>
      ))}

      <nav aria-label="More you can do" className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {LINKS.map(({ href, label, Icon }) => (
          <Button key={href} href={href} variant="outline" leftIcon={<Icon className="size-4" aria-hidden />}>
            {label}
          </Button>
        ))}
      </nav>
    </section>
  );
}
