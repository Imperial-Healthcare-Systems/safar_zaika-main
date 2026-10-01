import type { BulkOrderRequest } from "@/types";

export const AUDIENCES = ["Families", "Corporate groups", "Wedding parties", "School & college groups", "Tours", "Pilgrimage groups"];

export const MIN_GROUP = 10;
export const MAX_GROUP = 500;
export const MIN_MEALS_NOTE = "Minimum 10 meals per order (tentative, final policy to be confirmed).";

// Fixed packages, priced per head; non-veg is +40. "Custom menu" is quoted by a coordinator.
export const MEAL_PACKAGES = [
  { id: "breakfast-box", name: "Breakfast box", vegPrice: 149, nonVegPrice: 189, desc: "Poha or upma, a snack, fruit and a cup of chai. Non-veg adds an egg bhurji." },
  { id: "lunch-thali", name: "Lunch thali", vegPrice: 229, nonVegPrice: 269, desc: "Dal, seasonal sabzi, rotis, rice, salad, pickle and a sweet. Non-veg swaps in chicken curry." },
  { id: "dinner-thali", name: "Dinner thali", vegPrice: 249, nonVegPrice: 289, desc: "Paneer or chicken curry, dal, rotis, rice and dessert." },
  { id: "full-day", name: "Full-day plan", vegPrice: 549, nonVegPrice: 589, desc: "Breakfast, lunch and dinner, each timed to a halt." },
  { id: "custom", name: "Custom menu", vegPrice: null, nonVegPrice: null, desc: "Tell us what the group wants; a coordinator quotes it dish by dish." },
] as const;

export type MealPackage = (typeof MEAL_PACKAGES)[number];

export const PREFERENCES: { value: BulkOrderRequest["preference"]; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-veg" },
  { value: "mixed", label: "Mixed" },
  { value: "jain", label: "Jain" },
];

/** Per-head price for a preference; null = quoted. Mixed groups are estimated at the non-veg price. */
export function packagePrice(pkg: MealPackage, pref: BulkOrderRequest["preference"]): number | null {
  return pref === "non-veg" || pref === "mixed" ? pkg.nonVegPrice : pkg.vegPrice;
}
