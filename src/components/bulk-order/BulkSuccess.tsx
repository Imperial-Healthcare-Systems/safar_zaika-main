"use client";

import { useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { formatDate, formatINR, prefersReducedMotion } from "@/lib/utils";
import { Button } from "@/components/ui";
import { getStation } from "@/data/stations";
import type { BulkOrderRequest, Train } from "@/types";
import { packagePrice, PREFERENCES, type MealPackage } from "./constants";

const station = (code: string) => getStation(code)?.name ?? code;

export function BulkSuccess({ requestId, estimatedResponse, req, train, pkg }: { requestId: string; estimatedResponse: string; req: BulkOrderRequest; train: Train | null; pkg: MealPackage }) {
  const ref = useRef<HTMLDivElement>(null);
  const price = packagePrice(pkg, req.preference);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current.children, { y: 24, autoAlpha: 0, duration: 0.7, ease: "expo.out", stagger: 0.08 });
    },
    { scope: ref },
  );

  const rows: { k: string; v: string }[] = [
    { k: "Request ID", v: requestId },
    { k: "Group size", v: `${req.groupSize} people` },
    { k: "Train", v: train ? `${train.number} · ${train.name}` : req.trainNumber },
    { k: "Journey date", v: formatDate(req.journeyDate) },
    ...(req.pnr ? [{ k: "PNR", v: req.pnr }] : []),
    { k: "Route", v: `${station(req.boardingCode)} → ${station(req.deliveryCode)}` },
    { k: "Preference", v: PREFERENCES.find((p) => p.value === req.preference)?.label ?? req.preference },
    { k: "Meal package", v: price === null ? `${pkg.name} · quoted by your coordinator` : `${pkg.name} · ${formatINR(price)}/head` },
    { k: "Indicative total", v: price === null ? "Quoted" : formatINR(req.groupSize * price) },
    ...(req.requirements ? [{ k: "Customisation", v: req.requirements }] : []),
    { k: "Contact", v: `+91 ${req.phone} · ${req.email}` },
  ];

  return (
    <div ref={ref} className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8" role="status">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-cocoa-900 sm:text-4xl">The group is on the list.</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Request {requestId} is with a coordinator, who will confirm the menu {estimatedResponse} on the number and email below. Nothing is charged until you approve the final quote.
      </p>

      <table className="mt-8 w-full text-sm">
        <caption className="sr-only">Summary of your bulk order request</caption>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.k} className="align-top">
              <th scope="row" className="w-36 py-3 pr-4 text-left font-semibold text-muted max-sm:w-28 sm:w-44">
                {r.k}
              </th>
              <td className="py-3 text-cocoa-900">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/" variant="outline" size="lg">
          Back to home
        </Button>
        <Button href="/order" size="lg" rightIcon={<ArrowRight className="size-4" />}>
          Order for yourself
        </Button>
      </div>
    </div>
  );
}
