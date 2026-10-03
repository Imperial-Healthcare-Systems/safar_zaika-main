"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Hash, Mail, Minus, Phone, Plus, Ticket } from "lucide-react";
import { clamp, cn } from "@/lib/utils";
import { Button, Chip, Input, Select, Textarea } from "@/components/ui";
import { PHONE_REGEX, PNR_REGEX, searchTrains, submitBulkOrder } from "@/services";
import { toast } from "@/stores";
import { getStation } from "@/data/stations";
import type { BulkOrderRequest, Train } from "@/types";
import { MAX_GROUP, MEAL_PACKAGES, MIN_GROUP, MIN_MEALS_NOTE, packagePrice, PREFERENCES } from "./constants";
import { BulkSidebar } from "./BulkSidebar";
import { BulkSuccess } from "./BulkSuccess";

type Field = "date" | "train" | "pnr" | "boarding" | "delivery" | "phone" | "email";
type Errors = Partial<Record<Field, string>>;

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const stopLabel = (code: string) => `${getStation(code)?.name ?? code} (${code})`;

function Section({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl font-semibold text-cocoa-900">
        <span className="mr-2 text-copper-700">{step}</span>
        {title}
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

const stepBtn = "inline-flex h-full w-12 items-center justify-center transition-colors hover:bg-copper-100 active:bg-copper-200 disabled:pointer-events-none disabled:opacity-40";

export function BulkOrderForm() {
  const [sizeInput, setSizeInput] = useState(String(MIN_GROUP));
  const [date, setDate] = useState("");
  const [trainQuery, setTrainQuery] = useState("");
  const [train, setTrain] = useState<Train | null>(null);
  const [suggestions, setSuggestions] = useState<Train[]>([]);
  const [pnr, setPnr] = useState("");
  const [boarding, setBoarding] = useState("");
  const [delivery, setDelivery] = useState("");
  const [preference, setPreference] = useState<BulkOrderRequest["preference"]>("veg");
  const [packageId, setPackageId] = useState<string>(MEAL_PACKAGES[1].id);
  const [requirements, setRequirements] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ requestId: string; estimatedResponse: string; req: BulkOrderRequest } | null>(null);

  const groupSize = clamp(parseInt(sizeInput, 10) || MIN_GROUP, MIN_GROUP, MAX_GROUP);
  const pkg = MEAL_PACKAGES.find((p) => p.id === packageId) ?? MEAL_PACKAGES[1];
  const today = new Date().toISOString().slice(0, 10);

  // Debounced train lookup, same pattern as PnrModule.
  useEffect(() => {
    if (train) return;
    let alive = true;
    const t = setTimeout(async () => {
      const list = await searchTrains(trainQuery);
      if (alive) setSuggestions(list);
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [trainQuery, train]);

  const clear = (k: Field) => setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  const setSize = (n: number) => setSizeInput(String(clamp(n, MIN_GROUP, MAX_GROUP)));

  const pickTrain = (t: Train) => {
    setTrain(t);
    setTrainQuery(`${t.number} ${t.name}`);
    setSuggestions([]);
    setBoarding(t.stops[0].stationCode);
    setDelivery("");
    clear("train");
  };

  const boardingIdx = train ? train.stops.findIndex((s) => s.stationCode === boarding) : -1;
  const boardingOptions = train ? train.stops.slice(0, -1).map((s) => ({ value: s.stationCode, label: stopLabel(s.stationCode) })) : [];
  const deliveryOptions = train ? train.stops.slice(boardingIdx + 1).map((s) => ({ value: s.stationCode, label: stopLabel(s.stationCode) })) : [];

  const validate = (): Errors => {
    const e: Errors = {};
    if (!date) e.date = "Pick the journey date.";
    else if (date < today) e.date = "The journey date can't be in the past.";
    if (!train) e.train = "Pick a train from the suggestions.";
    if (pnr && !PNR_REGEX.test(pnr)) e.pnr = "A PNR is exactly 10 digits.";
    if (train && !boarding) e.boarding = "Choose the boarding station.";
    if (train && !delivery) e.delivery = "Choose where we should deliver.";
    if (!PHONE_REGEX.test(phone)) e.phone = "Enter a valid 10-digit mobile number.";
    if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email address.";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.values(e).some(Boolean) || !train) {
      toast({ title: "A few details are missing", description: "Check the highlighted fields and try again.", tone: "error" });
      return;
    }
    const req: BulkOrderRequest = {
      groupSize,
      journeyDate: date,
      trainNumber: train.number,
      pnr: pnr || undefined,
      boardingCode: boarding,
      deliveryCode: delivery,
      preference,
      mealPackage: pkg.id,
      requirements: requirements.trim() || undefined,
      phone,
      email,
    };
    setLoading(true);
    const res = await submitBulkOrder(req);
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Couldn't send the request", description: res.error.message, tone: "error" });
      return;
    }
    setResult({ ...res.data, req });
    toast({ title: "Request received", description: `Reference ${res.data.requestId}`, tone: "success" });
  };

  return (
    <div className="container-x grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
      {result ? (
        <BulkSuccess requestId={result.requestId} estimatedResponse={result.estimatedResponse} req={result.req} train={train} pkg={pkg} />
      ) : (
        <form
          noValidate
          className="space-y-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8 max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Section step="01" title="The group">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="group-size" className="text-[13px] font-semibold text-cocoa-800">
                Group size
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex h-12 items-center overflow-hidden rounded-full border border-copper-500 bg-copper-50 text-copper-700" role="group" aria-label="Group size">
                  <button type="button" onClick={() => setSize(groupSize - 1)} disabled={groupSize <= MIN_GROUP} aria-label="Decrease group size" className={stepBtn}>
                    <Minus className="size-4" />
                  </button>
                  <input
                    id="group-size"
                    type="number"
                    inputMode="numeric"
                    min={MIN_GROUP}
                    max={MAX_GROUP}
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onBlur={() => setSizeInput(String(groupSize))}
                    className="h-full w-16 bg-transparent text-center font-display text-xl font-semibold tabular-nums text-cocoa-900 outline-none"
                  />
                  <button type="button" onClick={() => setSize(groupSize + 1)} disabled={groupSize >= MAX_GROUP} aria-label="Increase group size" className={stepBtn}>
                    <Plus className="size-4" />
                  </button>
                </div>
                <p className="text-[13px] text-muted">
                  {MIN_MEALS_NOTE} Up to {MAX_GROUP} here; bigger than that, mention it below.
                </p>
              </div>
            </div>
            <Input
              label="Journey date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                setDate(e.target.value);
                clear("date");
              }}
              leftIcon={<CalendarDays className="size-4" />}
              error={errors.date}
              className="sm:max-w-xs"
            />
          </Section>

          <Section step="02" title="The journey">
            <div className="relative">
              <Input
                label="Train number or name"
                placeholder="e.g. 12951 or Rajdhani"
                value={trainQuery}
                autoComplete="off"
                onChange={(e) => {
                  setTrainQuery(e.target.value);
                  setTrain(null);
                  setBoarding("");
                  setDelivery("");
                  clear("train");
                }}
                leftIcon={<Hash className="size-4" />}
                error={errors.train}
              />
              {!train && suggestions.length > 0 && trainQuery.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-white text-cocoa-900 shadow-lift" role="listbox">
                  {suggestions.map((t) => (
                    <li key={t.number}>
                      <button type="button" role="option" aria-selected={false} onClick={() => pickTrain(t)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-cream-100">
                        <span>
                          <span className="font-semibold">{t.number}</span> · {t.name}
                        </span>
                        <span className="text-xs text-muted">
                          {t.from} → {t.to}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Input
              label="PNR (optional)"
              placeholder="10 digits, if the tickets are booked"
              inputMode="numeric"
              maxLength={10}
              value={pnr}
              onChange={(e) => {
                setPnr(e.target.value.replace(/\D/g, "").slice(0, 10));
                clear("pnr");
              }}
              leftIcon={<Ticket className="size-4" />}
              hint="Helps the coordinator map coaches for seat delivery."
              error={errors.pnr}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Boarding station"
                placeholder={train ? "Choose station" : "Pick a train first"}
                value={boarding}
                disabled={!train}
                onChange={(e) => {
                  setBoarding(e.target.value);
                  setDelivery("");
                  clear("boarding");
                }}
                options={boardingOptions}
                error={errors.boarding}
              />
              <Select
                label="Delivery station"
                placeholder={train ? "Choose station" : "Pick a train first"}
                value={delivery}
                disabled={!train}
                onChange={(e) => {
                  setDelivery(e.target.value);
                  clear("delivery");
                }}
                options={deliveryOptions}
                error={errors.delivery}
              />
            </div>
          </Section>

          <Section step="03" title="The food">
            <div className="flex flex-col gap-1.5">
              <p id="pref-label" className="text-[13px] font-semibold text-cocoa-800">
                Preference
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="pref-label">
                {PREFERENCES.map((p) => (
                  <Chip key={p.value} active={preference === p.value} onClick={() => setPreference(p.value)}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </div>
            <fieldset>
              <legend className="text-[13px] font-semibold text-cocoa-800">Meal package</legend>
              <p className="mt-0.5 text-[13px] text-muted">Fixed packages priced per head for your preference; veg and non-veg are packed separately.</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {MEAL_PACKAGES.map((p) => {
                  const active = p.id === packageId;
                  const price = packagePrice(p, preference);
                  return (
                    <label
                      key={p.id}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-copper-500/15",
                        active ? "border-copper-500 bg-copper-50" : "border-line bg-white hover:border-cocoa-900/30",
                      )}
                    >
                      <input type="radio" name="meal-package" value={p.id} checked={active} onChange={() => setPackageId(p.id)} className="sr-only" />
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-cocoa-900">{p.name}</span>
                        <span className="shrink-0 text-right font-bold tabular-nums text-copper-700">
                          {price === null ? (
                            "Quoted"
                          ) : (
                            <>
                              ₹{price}
                              <span className="text-xs font-medium text-muted">/head</span>
                            </>
                          )}
                          {p.vegPrice !== null && (
                            <span className="block text-[11px] font-medium text-muted max-sm:text-xs">
                              Veg ₹{p.vegPrice} · Non-veg ₹{p.nonVegPrice}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-[13px] leading-snug text-muted">{p.desc}</span>
                      {active && <CheckCircle2 className="absolute -right-2 -top-2 size-6 rounded-full bg-white text-copper-700" aria-hidden />}
                    </label>
                  );
                })}
              </div>
              {/* the sidebar estimate sits below the form on phones; echo it here */}
              <p className="mt-3 text-[13px] text-muted lg:hidden">
                Live estimate: <span className="font-bold text-cocoa-900">{(() => { const p = packagePrice(pkg, preference); return p === null ? "quoted by your coordinator" : `${groupSize} × ₹${p} = ₹${(groupSize * p).toLocaleString("en-IN")}`; })()}</span>
              </p>
            </fieldset>
            <Textarea
              label={pkg.id === "custom" ? "Describe the menu" : "Customise the package (optional)"}
              placeholder={pkg.id === "custom" ? "e.g. 40 veg thalis with jeera rice, 20 chicken biryanis, kids' portions for 6, fruit instead of sweet…" : "Swap the sweet for fruit, Jain versions for 6, kids' portions, allergies, a birthday cake, invoice details…"}
              hint="Every package can be tweaked dish by dish; the coordinator quotes exactly what you describe."
              rows={4}
              maxLength={500}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </Section>

          <Section step="04" title="Contact">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Mobile number"
                placeholder="10-digit number"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  clear("phone");
                }}
                leftIcon={<Phone className="size-4" />}
                error={errors.phone}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear("email");
                }}
                leftIcon={<Mail className="size-4" />}
                error={errors.email}
              />
            </div>
          </Section>

          <div className="pt-2">
            <Button type="submit" size="xl" full loading={loading} className="uppercase tracking-[0.1em]" rightIcon={<ArrowRight className="size-4" />}>
              Request bulk order
            </Button>
            <p className="mt-3 text-center text-[13px] text-muted">No payment now. A coordinator confirms the menu, timing and final price with you first.</p>
          </div>
        </form>
      )}
      <BulkSidebar groupSize={groupSize} pkg={pkg} preference={preference} className="lg:sticky lg:top-28" />
    </div>
  );
}
