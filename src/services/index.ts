/* ------------------------------------------------------------------
   Service interface. Components import from "@/services" only.
   To go live, point these exports at real API-client implementations
   (same function names, same ServiceResult shapes) and delete the mocks.
------------------------------------------------------------------- */
export {
  getPNRJourney,
  getTrain,
  searchTrains,
  getJourneyByTrain,
  getEligibleStations,
  computeEligibleStations,
  PNR_REGEX,
  MIN_LEAD_MINUTES,
} from "./mockRailwayService";

export { getRestaurants, getRestaurant, getMenu, searchAll, getRestaurantAvailability, isWithinWindows } from "./mockRestaurantService";
export type { RestaurantFilters, RestaurantMenu, MenuSection, SearchResults, Availability, DeliveryMoment } from "./mockRestaurantService";
export { MEALS, mealsForDish, dishesForMeal } from "@/data/menu";
export type { MealId } from "@/data/menu";

export {
  createMockOrder,
  getMockOrderStatus,
  mockStatusFor,
  getDemoOrder,
  cancelMockOrder,
  validateCoupon,
  evaluateCoupon,
  computeTotals,
  submitBulkOrder,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
} from "./mockOrderService";
export type { CreateOrderInput, CouponResult } from "./mockOrderService";

export { sendMockOTP, verifyMockOTP, DEMO_OTP, PHONE_REGEX } from "./mockAuthService";
