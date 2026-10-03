"use client";

import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AlertCircle, Info, Search } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { searchTrains } from "@/services";
import { cn } from "@/lib/utils";
import type { Train } from "@/types";

/** Every tool says where its numbers come from. */
export function DemoNote({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-[13px] leading-snug", dark ? "text-cream-50/70" : "text-muted", className)}>
      <Info className={cn("mt-0.5 size-4 shrink-0", dark ? "text-gold-300" : "text-rail-500")} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** What a tool will show, before anything has been looked up. */
export function IdleHint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-cocoa-300 bg-cream-100/60 px-6 py-10 text-center">
      <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-full bg-rail-50 text-rail-500">
        {icon}
      </span>
      <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

/** A service error, in the service's own words. */
export function ToolError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-chili-500/30 bg-chili-50 px-4 py-3.5 text-sm font-medium text-chili-600">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}

/**
 * Train search field with suggestions (number or name), shared by the schedule and
 * live-status tools. A combobox: arrows move through the list, Enter picks, Esc closes.
 */
export function TrainSearch({ action, loading, note, onSearch }: { action: string; loading?: boolean; note: ReactNode; onSearch: (query: string) => void }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Train[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const list = await searchTrains(query);
      if (alive) setSuggestions(list);
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const shown = open && query.trim() ? suggestions : [];

  const run = (q: string) => {
    setOpen(false);
    setActive(-1);
    if (q) onSearch(q);
  };
  const pick = (t: Train) => {
    setQuery(`${t.number} ${t.name}`);
    run(t.number);
  };
  const submit = () => {
    if (shown[active]) return pick(shown[active]);
    const q = query.trim();
    // A picked suggestion reads "12951 Mumbai Rajdhani Express": search by its number.
    run(/^\d{5}\b/.test(q) ? q.slice(0, 5) : q);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = suggestions.length;
      if (!n) return;
      setOpen(true);
      setActive((a) => (e.key === "ArrowDown" ? (a + 1) % n : a <= 0 ? n - 1 : a - 1));
    }
  };

  return (
    <form
      role="search"
      className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id} className="text-[13px] font-semibold text-cocoa-800">
        Train number or name
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            id={id}
            role="combobox"
            aria-expanded={shown.length > 0}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={shown[active] ? `${id}-opt-${active}` : undefined}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="e.g. 12951 or Rajdhani"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            leftIcon={<Search className="size-4" aria-hidden />}
            inputClassName="h-14 rounded-2xl text-base"
          />
          {shown.length > 0 && (
            <ul id={`${id}-list`} role="listbox" aria-label="Matching trains" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-line bg-white py-1 text-cocoa-900 shadow-lift">
              {shown.map((t, i) => (
                <li
                  key={t.number}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  // keep focus in the field so the list does not close before the click lands
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(t)}
                  className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-sm", i === active ? "bg-cream-200" : "hover:bg-cream-100")}
                >
                  <span className="min-w-0 truncate">
                    <span className="font-semibold">{t.number}</span> &middot; {t.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {t.from} &rarr; {t.to}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" size="xl" loading={loading} className="sm:min-w-44">
          {action}
        </Button>
      </div>
      <DemoNote className="mt-3">{note}</DemoNote>
    </form>
  );
}
