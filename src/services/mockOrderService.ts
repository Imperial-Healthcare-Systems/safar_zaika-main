// MOCK — replace with order, coupon and bulk-request endpoints.
// Payment is UI only: nothing here talks to a gateway.
import { offerMap } from "@/data/offers";
import { demoOrder, orderStatusSteps } from "@/data/orders";
import { sleep } from "@/lib/utils";
import type { BulkOrderRequest, CartItem, Order, OrderStatus, OrderTotals, PaymentMethod, ServiceResult } from "@/types";

export const DELIVERY_FEE = 29;
export const FREE_DELIVERY_ABOVE = 499;
export const TAX_RATE = 0.05;

export interface CouponResult {
  code: string;
  discount: number;
  freeDelivery: boolean;
  label: string;
}

export function evaluateCoupon(code: string, itemTotal: number, stationCode?: string | null): ServiceResult<CouponResult> {
  const offer = offerMap[code.trim().toUpperCase()];
  if (!offer) return { ok: false, error: { code: "INVALID_COUPON", message: "That code isn't valid. Check the spelling or browse offers." } };
  if (offer.minOrder && itemTotal < offer.minOrder) {
    return { ok: false, error: { code: "INVALID_COUPON", message: `Add items worth ₹${offer.minOrder - itemTotal} more to use ${offer.code}.` } };
  }
  if (offer.type === "station" && offer.stationCode && offer.stationCode !== stationCode) {
    return { ok: false, error: { code: "INVALID_COUPON", message: `${offer.code} only works for deliveries at ${offer.stationCode}.` } };
  }
  let discount = 0;
  let freeDelivery = false;
  switch (offer.type) {
    case "percent":
    case "bulk":
      discount = Math.min(Math.round((itemTotal * offer.value) / 100), offer.maxDiscount ?? Infinity);
      break;
    case "flat":
    case "first-order":
    case "station":
      discount = offer.value;
      break;
    case "free-delivery":
      freeDelivery = true;
      break;
  }
  return { ok: true, data: { code: offer.code, discount, freeDelivery, label: offer.title } };
}

export async function validateCoupon(code: string, itemTotal: number, stationCode?: string | null) {
  await sleep(600);
  return evaluateCoupon(code, itemTotal, stationCode);
}

export function computeTotals(items: CartItem[], couponCode?: string | null, stationCode?: string | null): OrderTotals {
  const itemTotal = items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);
  let discount = 0;
  let freeDelivery = itemTotal >= FREE_DELIVERY_ABOVE;
  let applied: string | undefined;
  if (couponCode) {
    const res = evaluateCoupon(couponCode, itemTotal, stationCode);
    if (res.ok) {
      discount = Math.min(res.data.discount, itemTotal);
      freeDelivery = freeDelivery || res.data.freeDelivery;
      applied = res.data.code;
    }
  }
  const deliveryFee = itemTotal === 0 || freeDelivery ? 0 : DELIVERY_FEE;
  const taxes = Math.round((itemTotal - discount) * TAX_RATE);
  return { itemTotal, discount, deliveryFee, taxes, total: Math.max(0, itemTotal - discount + deliveryFee + taxes), couponCode: applied };
}

export interface CreateOrderInput {
  items: CartItem[];
  restaurantId: string;
  restaurantName: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  boardingCode: string;
  deliveryStationCode: string;
  deliveryEta: string;
  passenger: { name: string; phone: string; coach: string; berth: string };
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
}

export async function createMockOrder(input: CreateOrderInput): Promise<ServiceResult<Order>> {
  await sleep(1600 + Math.random() * 600);
  const id = `SZ${Math.floor(100000 + Math.random() * 900000)}`;
  const order: Order = {
    id,
    placedAt: new Date().toISOString(),
    status: "confirmed",
    items: input.items,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    trainNumber: input.trainNumber,
    trainName: input.trainName,
    journeyDate: input.journeyDate,
    boardingCode: input.boardingCode,
    deliveryStationCode: input.deliveryStationCode,
    deliveryEta: input.deliveryEta,
    passenger: input.passenger,
    payment: { method: input.paymentMethod, status: input.paymentMethod === "cod" ? "pending-cod" : "paid" },
    totals: computeTotals(input.items, input.couponCode, input.deliveryStationCode),
  };
  return { ok: true, data: order };
}

/** Demo progression: a fresh order advances one step every ~12s; the seeded demo order holds at "at-station". */
export function mockStatusFor(order: Order, now = Date.now()): OrderStatus {
  if (order.id === demoOrder.id) return demoOrder.status;
  if (order.status === "cancelled") return "cancelled";
  const elapsed = (now - new Date(order.placedAt).getTime()) / 1000;
  const idx = Math.min(orderStatusSteps.length - 1, Math.floor(elapsed / 12));
  return orderStatusSteps[idx].key;
}

export async function getMockOrderStatus(order: Order): Promise<ServiceResult<{ status: OrderStatus; updatedAt: string }>> {
  await sleep(300);
  return { ok: true, data: { status: mockStatusFor(order), updatedAt: new Date().toISOString() } };
}

export function getDemoOrder() {
  return demoOrder;
}

/** Customer cancellation; only allowed before the kitchen starts cooking. A reason is mandatory. */
export async function cancelMockOrder(orderId: string, reason: string): Promise<ServiceResult<{ id: string; status: "cancelled"; reason: string }>> {
  await sleep(800);
  if (!reason.trim()) return { ok: false, error: { code: "NOT_FOUND", message: "Pick a reason so the kitchen knows why." } };
  return { ok: true, data: { id: orderId, status: "cancelled", reason } };
}

export async function submitBulkOrder(req: BulkOrderRequest): Promise<ServiceResult<{ requestId: string; estimatedResponse: string }>> {
  await sleep(1400);
  if (!req.phone || !req.email) return { ok: false, error: { code: "NOT_FOUND", message: "Please add a phone and email so our team can confirm the menu." } };
  return { ok: true, data: { requestId: `BLK-${Math.floor(10000 + Math.random() * 90000)}`, estimatedResponse: "within 2 hours" } };
}
