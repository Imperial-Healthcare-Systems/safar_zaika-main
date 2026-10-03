"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, LogOut, Package, Route, Zap } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";
import { Button, Logo, Skeleton } from "@/components/ui";
import { toast, useAuthStore } from "@/stores";
import { LoginForm } from "./LoginForm";

const benefits = [
  { icon: Zap, t: "Faster checkout", d: "Your number and preferences, remembered." },
  { icon: Package, t: "Track every order", d: "All your journeys and meals in one place." },
  { icon: Route, t: "Saved journeys", d: "Re-order on a route you travel often." },
];

export function LoginPageView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <section className="container-x pb-20 pt-32 sm:pt-40">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2.5rem] border border-line bg-white shadow-card lg:grid-cols-[1fr_1.1fr]">
        <div className="relative gradient-cocoa p-8 text-cream-50 sm:p-10">
          <div aria-hidden className="absolute inset-0 map-grid-dark opacity-50" />
          <div className="relative">
            <Logo variant="badge" href={null} className="h-24 sm:h-32" />
            <h1 className="mt-8 text-balance font-display text-[1.875rem] leading-[1.08] sm:text-[2.25rem]">
              One account. <span className="text-gold-400">Every journey.</span>
            </h1>
            <ul className="mt-8 space-y-4">
              {benefits.map((b) => (
                <li key={b.t} className="flex gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-cream-50/8 text-gold-400">
                    <b.icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{b.t}</p>
                    <p className="text-[13px] text-cream-50/60">{b.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {!hydrated ? (
            <div className="space-y-4" aria-busy aria-label="Loading">
              <Skeleton className="h-11 w-full rounded-full" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : user ? (
            <div className="flex h-full flex-col justify-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
                <CheckCircle2 className="size-7" />
              </span>
              <h2 className="mt-5 font-display text-3xl text-cocoa-900">You&apos;re logged in as {user.name}</h2>
              <p className="mt-2 text-sm text-muted">
                +91 {user.phone}
                {user.email && ` · ${user.email}`}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/order" size="lg">
                  Order food
                </Button>
                <Button href="/track-order" variant="outline" size="lg">
                  Track an order
                </Button>
              </div>
              <Button
                variant="ghost"
                className="mt-4 self-start"
                leftIcon={<LogOut className="size-4" />}
                onClick={() => {
                  logout();
                  toast({ title: "Logged out", description: "See you on the next journey." });
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <LoginForm compact onDone={() => router.push("/")} />
          )}
        </div>
      </div>
    </section>
  );
}
