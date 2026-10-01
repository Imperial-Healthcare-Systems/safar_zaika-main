// MOCK — replace with catalog endpoints from the Safar Zaika backend.
import { restaurantMap, restaurants, restaurantsByStation } from "@/data/restaurants";
import { MEALS, categoryLabels, dishMap, dishes, mealsForDish, type MealId } from "@/data/menu";
import { stations } from "@/data/stations";
import { sleep } from "@/lib/utils";
import type { Dish, DishCategory, Restaurant, ServiceResult, Station, TimeWindow } from "@/types";

/* ---- Vendor availability (pure; the real backend returns the same shape) ---- */

/** The moment an order would be delivered: scheduled arrival at the halt, or "now" when there is no journey. */
export interface DeliveryMoment {
  /** "HH:mm" 24h */
  hhmm: string;
  /** 0 = Sunday */
  weekday: number;
  source: "arrival" | "now";
}

export interface Availability {
  open: boolean;
  reason?: string;
  /** "HH:mm" of the next service window when closed by time */
  nextOpen?: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function isWithinWindows(hhmm: string, windows: TimeWindow[]) {
  const t = toMin(hhmm);
  return windows.some((w) => t >= toMin(w.from) && t <= toMin(w.to));
}

export function getRestaurantAvailability(r: Restaurant, at: { hhmm: string; weekday: number }): Availability {
  if (!r.live) return { open: false, reason: r.pausedReason ?? "Paused by the kitchen today" };
  if (r.closedDays?.includes(at.weekday)) return { open: false, reason: `Closed on ${DAY_NAMES[at.weekday]}s` };
  if (isWithinWindows(at.hhmm, r.serviceWindows)) return { open: true };
  const t = toMin(at.hhmm);
  const starts = r.serviceWindows.map((w) => toMin(w.from)).sort((a, b) => a - b);
  const next = starts.find((m) => m > t) ?? starts[0];
  return { open: false, reason: "Closed at this time", nextOpen: fromMin(next) };
}

export interface RestaurantFilters {
  pureVeg?: boolean;
  category?: string;
  sort?: "recommended" | "rating" | "prep" | "price";
  query?: string;
  /** Keep kitchens with at least one dish of this meal; kitchens open for the whole meal window are listed first. */
  meal?: MealId;
}

export interface MenuSection {
  id: string;
  label: string;
  dishes: Dish[];
}

export interface RestaurantMenu {
  restaurant: Restaurant;
  sections: MenuSection[];
}

const matchesCategory = (r: Restaurant, cat: string) => {
  if (cat === "veg") return r.pureVeg;
  if (cat === "non-veg") return !r.pureVeg;
  if (cat === "jain") return r.tags.some((t) => t.toLowerCase().includes("jain")) || r.menu.some((id) => dishMap[id]?.jain);
  return r.menu.some((id) => dishMap[id]?.category === cat);
};

const covers = (windows: TimeWindow[], w: TimeWindow) => windows.some((s) => toMin(s.from) <= toMin(w.from) && toMin(s.to) >= toMin(w.to));

export async function getRestaurants(stationCode: string, filters: RestaurantFilters = {}): Promise<ServiceResult<Restaurant[]>> {
  await sleep(600 + Math.random() * 400);
  let list = restaurantsByStation(stationCode);
  const meal = MEALS.find((m) => m.id === filters.meal);
  if (filters.pureVeg) list = list.filter((r) => r.pureVeg);
  if (meal) list = list.filter((r) => r.menu.some((id) => dishMap[id] && mealsForDish(dishMap[id]).includes(meal.id)));
  if (filters.category && filters.category !== "all") list = list.filter((r) => matchesCategory(r, filters.category!));
  if (filters.query) {
    const q = filters.query.toLowerCase();
    list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisines.some((c) => c.toLowerCase().includes(q)));
  }
  const sorted = [...list];
  switch (filters.sort) {
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "prep":
      sorted.sort((a, b) => a.prepTimeMin - b.prepTimeMin);
      break;
    case "price":
      sorted.sort((a, b) => a.priceForTwo - b.priceForTwo);
      break;
    default:
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.deliveryConfidence - a.deliveryConfidence);
  }
  // Stable: kitchens open for the whole meal window first, the chosen order within each group.
  if (meal) sorted.sort((a, b) => Number(covers(b.serviceWindows, meal.window)) - Number(covers(a.serviceWindows, meal.window)));
  return { ok: true, data: sorted };
}

export async function getRestaurant(id: string): Promise<ServiceResult<Restaurant>> {
  await sleep(300);
  const r = restaurantMap[id];
  return r ? { ok: true, data: r } : { ok: false, error: { code: "NOT_FOUND", message: "We couldn't find that restaurant." } };
}

export async function getMenu(restaurantId: string): Promise<ServiceResult<RestaurantMenu>> {
  await sleep(500 + Math.random() * 300);
  const restaurant = restaurantMap[restaurantId];
  if (!restaurant) return { ok: false, error: { code: "NOT_FOUND", message: "We couldn't find that restaurant." } };
  const items = restaurant.menu.map((id) => dishMap[id]).filter(Boolean);
  const popular = items.filter((d) => d.bestseller);
  const byCategory = new Map<DishCategory, Dish[]>();
  for (const d of items) {
    const list = byCategory.get(d.category) ?? [];
    list.push(d);
    byCategory.set(d.category, list);
  }
  const sections: MenuSection[] = [];
  if (popular.length) sections.push({ id: "popular", label: "Popular", dishes: popular });
  const order: DishCategory[] = ["thali", "biryani", "north-indian", "south-indian", "combos", "snacks", "breakfast", "chinese", "jain", "beverages", "desserts"];
  for (const cat of order) {
    const list = byCategory.get(cat);
    if (list?.length) sections.push({ id: cat, label: categoryLabels[cat], dishes: list });
  }
  const jain = items.filter((d) => d.jain);
  if (jain.length && !byCategory.has("jain")) sections.push({ id: "jain", label: "Jain", dishes: jain });
  return { ok: true, data: { restaurant, sections } };
}

export interface SearchResults {
  restaurants: Restaurant[];
  dishes: { dish: Dish; restaurant: Restaurant }[];
  stations: Station[];
}

export async function searchAll(query: string): Promise<SearchResults> {
  await sleep(180);
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { restaurants: [], dishes: [], stations: [] };
  const matchedStations = stations.filter((s) => `${s.name} ${s.city} ${s.code}`.toLowerCase().includes(q)).slice(0, 5);
  const matchedRestaurants = restaurants.filter((r) => `${r.name} ${r.cuisines.join(" ")}`.toLowerCase().includes(q)).slice(0, 6);
  const matchedDishes = dishes
    .filter((d) => `${d.name} ${d.category}`.toLowerCase().includes(q))
    .slice(0, 6)
    .map((dish) => ({ dish, restaurant: restaurants.find((r) => r.menu.includes(dish.id))! }))
    .filter((x) => x.restaurant);
  return { restaurants: matchedRestaurants, dishes: matchedDishes, stations: matchedStations };
}
