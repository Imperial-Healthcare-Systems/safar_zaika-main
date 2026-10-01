import type { Offer } from "@/types";

export const offers: Offer[] = [
  { code: "SAFAR100", title: "₹100 off your first journey", description: "Flat ₹100 off on your first Safar Zaika order above ₹399.", type: "first-order", value: 100, minOrder: 399, accent: "copper" },
  { code: "ZAIKA20", title: "20% off, up to ₹150", description: "On all orders above ₹499. Valid on every station, every train.", type: "percent", value: 20, minOrder: 499, maxDiscount: 150, accent: "cocoa" },
  { code: "FREERIDE", title: "Free delivery to your seat", description: "No delivery charge on orders above ₹299 this week.", type: "free-delivery", value: 0, minOrder: 299, accent: "leaf", expires: "2026-10-31" },
  { code: "BRC50", title: "₹50 off at Vadodara", description: "Station special: ₹50 off any order delivered at Vadodara Jn.", type: "station", value: 50, minOrder: 249, stationCode: "BRC", accent: "gold" },
  { code: "GROUP15", title: "15% off group orders", description: "For 10+ meals in one order. Perfect for families and tour groups.", type: "bulk", value: 15, minOrder: 1500, maxDiscount: 600, accent: "copper" },
  { code: "CHAI", title: "Free masala chai", description: "A hot flask of chai on us with any thali order above ₹350.", type: "flat", value: 59, minOrder: 350, accent: "gold" },
];

export const offerMap: Record<string, Offer> = Object.fromEntries(offers.map((o) => [o.code, o]));
