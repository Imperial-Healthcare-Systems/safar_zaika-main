import type { Order, OrderStatus } from "@/types";
import { dishMap } from "./menu";

// Order flow per the operating model: Safar Zaika receives -> confirms and
// pushes to the vendor -> vendor prepares -> partner delivers at the station.
export const orderStatusSteps: { key: OrderStatus; label: string; description: string }[] = [
  { key: "confirmed", label: "Order received by Safar Zaika", description: "We have your order and matched it to your train and halt." },
  { key: "accepted", label: "Confirmed and sent to the kitchen", description: "The order is confirmed and pushed to the kitchen with your coach and berth." },
  { key: "preparing", label: "Kitchen is preparing it", description: "Cooked fresh, timed to your arrival at the station." },
  { key: "ready", label: "Packed and picked up", description: "Sealed, insulated and handed to the delivery partner." },
  { key: "partner-assigned", label: "Partner heading to your platform", description: "The partner is on the way to the station with your order." },
  { key: "at-station", label: "Waiting on your platform", description: "On the platform, tracking your coach as the train pulls in." },
  { key: "delivered", label: "Handed over at your seat", description: "Enjoy your meal. Bon voyage!" },
];

/** Index into orderStatusSteps; -1 for "cancelled". */
export const statusIndex = (s: OrderStatus) => orderStatusSteps.findIndex((x) => x.key === s);

export const CANCEL_REASONS = ["Changed plans", "Train rescheduled", "Ordered by mistake", "Found another option", "Other"];

// Seeded demo order so /track-order/SZ102948 always works.
export const demoOrder: Order = {
  id: "SZ102948",
  placedAt: "2026-10-12T15:20:00+05:30",
  status: "at-station",
  items: [
    { dish: dishMap["d-deluxe-thali"], quantity: 2 },
    { dish: dishMap["d-masala-chai"], quantity: 1 },
    { dish: dishMap["d-gulab-jamun"], quantity: 1 },
  ],
  restaurantId: "sayaji-thali",
  restaurantName: "Sayaji Thali Ghar",
  trainNumber: "12951",
  trainName: "Mumbai Rajdhani Express",
  journeyDate: "2026-10-12",
  boardingCode: "MMCT",
  deliveryStationCode: "BRC",
  deliveryEta: "21:08",
  passenger: { name: "Aarav Mehta", phone: "98XXXXXX21", coach: "B4", berth: "23" },
  payment: { method: "upi", status: "paid" },
  totals: { itemTotal: 726, discount: 100, deliveryFee: 0, taxes: 31, total: 657, couponCode: "SAFAR100" },
};
