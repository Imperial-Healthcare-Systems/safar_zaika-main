/* ------------------------------------------------------------------
   Domain types. These are the contract between the UI and the service
   layer; the real backend should return data in these shapes (or be
   mapped into them inside /services).
------------------------------------------------------------------- */

export type VegType = "veg" | "non-veg" | "egg";

/** Operating regions from the business plan; each is a fixed list of states. */
export type Region = "North" | "East" | "West" | "South";

/** "HH:mm" 24h, inclusive. A window crossing midnight is stored as two. */
export interface TimeWindow {
  from: string;
  to: string;
}

export interface Station {
  code: string;
  name: string;
  city: string;
  state: string;
  /** Every seeded station sets it; optional only because the railway mock synthesises unknown stops. */
  region?: Region;
  lat: number;
  lng: number;
  /** Shown in the explorer as a featured station. */
  popular?: boolean;
  image?: string;
  tagline?: string;
}

export interface RouteStop {
  stationCode: string;
  /** "HH:mm" 24h, null for origin */
  arrival: string | null;
  /** "HH:mm" 24h, null for destination */
  departure: string | null;
  /** halt in minutes */
  halt: number;
  /** day of journey, 1-based */
  day: number;
  distanceKm: number;
}

export interface Train {
  number: string;
  name: string;
  from: string;
  to: string;
  stops: RouteStop[];
  /** e.g. ["Mon","Tue"] — purely informational in the mock */
  runsOn: string;
  classes: string[];
}

export interface Passenger {
  name: string;
  age: number;
  gender: "M" | "F" | "O";
  coach: string;
  berth: string;
  berthType: string;
  status: "CNF" | "RAC" | "WL";
}

export interface Journey {
  pnr: string | null;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  /** ISO date of boarding */
  date: string;
  travelClass: string;
  passengers: Passenger[];
  /** index into train.stops for the boarding station */
  boardingIndex: number;
  /** index into train.stops for the destination */
  destinationIndex: number;
  chartPrepared: boolean;
}

export type StationAvailability = "available" | "too-soon" | "no-food" | "passed" | "destination";

export interface EligibleStation {
  station: Station;
  stop: RouteStop;
  availability: StationAvailability;
  restaurantCount: number;
  /** minutes from boarding departure to arrival here */
  minutesFromBoarding: number;
}

export type DishCategory =
  | "thali"
  | "biryani"
  | "north-indian"
  | "south-indian"
  | "snacks"
  | "breakfast"
  | "jain"
  | "chinese"
  | "beverages"
  | "desserts"
  | "combos";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  /** strike-through price when discounted */
  mrp?: number;
  veg: VegType;
  category: DishCategory;
  image: string;
  rating?: number;
  bestseller?: boolean;
  spicy?: 0 | 1 | 2 | 3;
  serves?: number;
  jain?: boolean;
  tags?: string[];
  /** Unset = available whenever the kitchen is. */
  availableWindows?: TimeWindow[];
}

export interface Restaurant {
  id: string;
  name: string;
  stationCode: string;
  cuisines: string[];
  rating: number;
  ratingCount: number;
  pureVeg: boolean;
  prepTimeMin: number;
  priceForTwo: number;
  tags: string[];
  distanceKm: number;
  image: string;
  /** 0-100, derived from on-time history in a real system */
  deliveryConfidence: number;
  openHours: string;
  /** Vendor toggle: false = the kitchen switched itself off for the day. */
  live: boolean;
  pausedReason?: string;
  /** Derived from openHours; evaluated against the arrival time at the station. */
  serviceWindows: TimeWindow[];
  /** 0 = Sunday */
  closedDays?: number[];
  featured?: boolean;
  /** ids into the dish catalog */
  menu: string[];
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export type OfferType = "flat" | "percent" | "free-delivery" | "first-order" | "station" | "bulk";

export interface Offer {
  code: string;
  title: string;
  description: string;
  type: OfferType;
  /** rupees for flat, percentage for percent */
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  stationCode?: string;
  expires?: string;
  accent: "copper" | "leaf" | "cocoa" | "gold";
}

export type OrderStatus =
  | "confirmed"
  | "accepted"
  | "preparing"
  | "ready"
  | "partner-assigned"
  | "at-station"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

export interface OrderTotals {
  itemTotal: number;
  discount: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  couponCode?: string;
}

export interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  items: CartItem[];
  restaurantId: string;
  restaurantName: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  boardingCode: string;
  deliveryStationCode: string;
  /** scheduled arrival at delivery station, "HH:mm" */
  deliveryEta: string;
  passenger: { name: string; phone: string; coach: string; berth: string };
  payment: { method: PaymentMethod; status: "paid" | "pending-cod" };
  totals: OrderTotals;
  /** Set when status is "cancelled". */
  cancelReason?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  route: string;
  station: string;
  dish: string;
  rating: number;
  quote: string;
}

export interface User {
  name: string;
  phone: string;
  email?: string;
}

export interface BulkOrderRequest {
  groupSize: number;
  journeyDate: string;
  trainNumber: string;
  pnr?: string;
  boardingCode: string;
  deliveryCode: string;
  preference: "veg" | "non-veg" | "mixed" | "jain";
  mealPackage: string;
  requirements?: string;
  phone: string;
  email: string;
}

export interface Category {
  id: DishCategory | "veg" | "non-veg";
  label: string;
  image: string;
}

/* Service result envelope — same shape for mock and real implementations. */
export type ServiceErrorCode =
  | "INVALID_PNR"
  | "NOT_FOUND"
  | "TRAIN_NOT_FOUND"
  | "SERVICE_UNAVAILABLE"
  | "NO_FOOD"
  | "TOO_LATE"
  | "INVALID_OTP"
  | "INVALID_COUPON";

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
}

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError };
