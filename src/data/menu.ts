import type { Category, Dish, DishCategory, TimeWindow } from "@/types";

const img = (name: string) => `/images/food/${name}.jpg`;

// Shared dish catalog. Restaurants reference dishes by id; prices are
// Safar Zaika selling prices (vendor margin is never exposed here).
export const dishes: Dish[] = [
  // Thali
  { id: "d-veg-thali", name: "Classic Veg Thali", description: "Dal tadka, seasonal sabzi, paneer curry, 3 rotis, jeera rice, salad, pickle & sweet.", price: 219, mrp: 249, veg: "veg", category: "thali", image: img("thali-steel"), rating: 4.5, bestseller: true, serves: 1, tags: ["Most ordered"] },
  { id: "d-deluxe-thali", name: "Deluxe Festive Thali", description: "Paneer butter masala, dal makhani, mix veg, 2 butter rotis, pulao, raita, gulab jamun.", price: 289, mrp: 329, veg: "veg", category: "thali", image: img("thali-overhead"), rating: 4.7, bestseller: true, serves: 1 },
  { id: "d-chicken-thali", name: "Chicken Curry Thali", description: "Home-style chicken curry, dal, 3 rotis, steamed rice, salad & pickle.", price: 269, veg: "non-veg", category: "thali", image: img("chicken-curry-naan"), rating: 4.4, spicy: 2, serves: 1 },
  { id: "d-jain-thali", name: "Jain Thali", description: "No onion, no garlic, no root vegetables. Dal, lauki sabzi, 3 phulkas, rice, curd & sweet.", price: 229, veg: "veg", category: "jain", jain: true, image: img("curry-spread"), rating: 4.3, serves: 1, tags: ["Jain"] },
  // Biryani
  { id: "d-chicken-biryani", name: "Hyderabadi Chicken Biryani", description: "Long-grain basmati, slow-cooked dum chicken, fried onions, mint. Served with raita.", price: 279, mrp: 319, veg: "non-veg", category: "biryani", image: img("chicken-biryani"), rating: 4.7, bestseller: true, spicy: 2, serves: 1, tags: ["Chef special"] },
  { id: "d-veg-biryani", name: "Veg Dum Biryani", description: "Garden vegetables and paneer layered with saffron rice. With mirchi ka salan.", price: 229, veg: "veg", category: "biryani", image: img("veg-biryani"), rating: 4.4, spicy: 1, serves: 1 },
  { id: "d-mutton-biryani", name: "Lucknowi Mutton Biryani", description: "Awadhi-style, delicately spiced, tender mutton on fragrant rice.", price: 349, veg: "non-veg", category: "biryani", image: img("biryani-platter"), rating: 4.6, spicy: 2, serves: 1 },
  { id: "d-egg-biryani", name: "Egg Biryani", description: "Boiled eggs tossed in masala, layered with basmati and fried onions.", price: 199, veg: "egg", category: "biryani", image: img("biryani-copper"), rating: 4.2, spicy: 1, serves: 1 },
  // North Indian
  { id: "d-butter-chicken", name: "Butter Chicken", description: "Tandoor-charred chicken in a silky tomato-butter gravy. Pairs with naan.", price: 299, mrp: 339, veg: "non-veg", category: "north-indian", image: img("butter-chicken"), rating: 4.8, bestseller: true, spicy: 1, serves: 1 },
  { id: "d-paneer-butter-masala", name: "Paneer Butter Masala", description: "Soft paneer in rich makhani gravy, finished with cream and kasuri methi.", price: 249, veg: "veg", category: "north-indian", image: img("paneer-butter-masala"), rating: 4.6, bestseller: true, spicy: 1, serves: 1 },
  { id: "d-dal-makhani", name: "Dal Makhani & Rice", description: "Overnight-simmered black dal with butter, served with jeera rice.", price: 189, veg: "veg", category: "north-indian", image: img("dal-soup"), rating: 4.5, serves: 1 },
  { id: "d-rogan-josh", name: "Mutton Rogan Josh", description: "Kashmiri-style slow-cooked mutton, aromatic and deeply red.", price: 359, veg: "non-veg", category: "north-indian", image: img("rogan-josh"), rating: 4.5, spicy: 2, serves: 1 },
  { id: "d-tikka-masala", name: "Chicken Tikka Masala", description: "Smoky tikka pieces in a spiced onion-tomato masala.", price: 289, veg: "non-veg", category: "north-indian", image: img("tikka-masala"), rating: 4.5, spicy: 2, serves: 1 },
  { id: "d-paneer-tikka", name: "Tandoori Paneer Tikka", description: "Char-grilled paneer with peppers and onion, mint chutney on the side.", price: 239, veg: "veg", category: "north-indian", image: img("paneer-tikka"), rating: 4.6, spicy: 1, serves: 1 },
  { id: "d-tandoori-chicken", name: "Tandoori Chicken (Half)", description: "Marinated overnight in yogurt and spices, roasted in a clay oven.", price: 319, veg: "non-veg", category: "north-indian", image: img("tandoori-chicken"), rating: 4.6, spicy: 2, serves: 1 },
  { id: "d-seekh-kebab", name: "Mutton Seekh Kebab", description: "Hand-rolled minced mutton kebabs, grilled over charcoal. 4 pieces.", price: 279, veg: "non-veg", category: "north-indian", image: img("seekh-kebab"), rating: 4.4, spicy: 2 },
  { id: "d-kebab-platter", name: "Galouti Kebab Platter", description: "Melt-in-the-mouth Lucknowi kebabs with ulte tawe ka paratha.", price: 329, veg: "non-veg", category: "north-indian", image: img("kebab-plate"), rating: 4.7, spicy: 1, availableWindows: [{ from: "18:00", to: "23:30" }] },
  { id: "d-fish-curry", name: "Bengali Fish Curry & Rice", description: "Mustard-spiced rohu curry, served with steamed rice.", price: 269, veg: "non-veg", category: "north-indian", image: img("fish-curry"), rating: 4.3, spicy: 2 },
  { id: "d-prawn-curry", name: "Coastal Prawn Curry", description: "Coconut-rich Mangalorean prawn curry with rice.", price: 329, veg: "non-veg", category: "south-indian", image: img("prawn-curry"), rating: 4.4, spicy: 2 },
  { id: "d-creamy-curry", name: "Shahi Paneer Bowl", description: "Cashew-cream gravy with paneer, served over fragrant rice.", price: 239, veg: "veg", category: "north-indian", image: img("creamy-curry"), rating: 4.3 },
  { id: "d-paneer-rice-bowl", name: "Paneer Makhani Rice Bowl", description: "One-bowl meal: makhani paneer on buttered basmati.", price: 219, veg: "veg", category: "combos", image: img("paneer-rice-bowl"), rating: 4.4, bestseller: true },
  { id: "d-chicken-tikka-bowl", name: "Chicken Tikka Rice Bowl", description: "Grilled tikka, peppers and herbed rice. High protein, no mess.", price: 249, veg: "non-veg", category: "combos", image: img("chicken-tikka-bowl"), rating: 4.5, spicy: 1 },
  // South Indian
  { id: "d-masala-dosa", name: "Masala Dosa", description: "Crisp dosa with potato masala, sambar and two chutneys.", price: 149, veg: "veg", category: "south-indian", image: img("idli-vada"), rating: 4.5, bestseller: true },
  { id: "d-idli-vada", name: "Idli Vada Combo", description: "2 idlis, 1 medu vada, sambar, coconut chutney.", price: 119, veg: "veg", category: "breakfast", image: img("idli-leaf"), rating: 4.4, availableWindows: [{ from: "06:00", to: "11:00" }] },
  { id: "d-lemon-rice", name: "Lemon Rice & Papad", description: "Tangy tempered rice with peanuts and curry leaves.", price: 129, veg: "veg", category: "south-indian", image: img("lemon-rice"), rating: 4.2, jain: false },
  { id: "d-curry-lime", name: "Chettinad Chicken Curry", description: "Fiery pepper-forward curry with parotta.", price: 279, veg: "non-veg", category: "south-indian", image: img("curry-lime"), rating: 4.5, spicy: 3 },
  // Snacks / street
  { id: "d-samosa", name: "Punjabi Samosa (2 pc)", description: "Flaky pastry, spiced potato-pea filling, with tamarind chutney.", price: 69, veg: "veg", category: "snacks", image: img("samosa"), rating: 4.4, bestseller: true },
  { id: "d-pav-bhaji", name: "Mumbai Pav Bhaji", description: "Buttery mashed-veg bhaji with 2 toasted pavs, onion & lemon.", price: 149, veg: "veg", category: "snacks", image: img("pav-bhaji"), rating: 4.6, bestseller: true, spicy: 1 },
  { id: "d-misal-pav", name: "Kolhapuri Misal Pav", description: "Spicy sprouted-moth curry topped with farsan, with pav.", price: 139, veg: "veg", category: "snacks", image: img("misal-pav"), rating: 4.3, spicy: 3 },
  { id: "d-papdi-chaat", name: "Papdi Chaat", description: "Crisp papdi, chickpeas, yogurt, chutneys and sev.", price: 99, veg: "veg", category: "snacks", image: img("papdi-chaat"), rating: 4.3 },
  { id: "d-momos", name: "Steamed Veg Momos (8 pc)", description: "Hand-pleated dumplings with fiery red chutney.", price: 129, veg: "veg", category: "chinese", image: img("momos"), rating: 4.4, spicy: 2 },
  { id: "d-momo-platter", name: "Chicken Momo Platter", description: "Steamed and pan-fried chicken momos with two dips.", price: 179, veg: "non-veg", category: "chinese", image: img("momo-platter"), rating: 4.5, spicy: 2, availableWindows: [{ from: "17:00", to: "23:00" }] },
  { id: "d-noodle-soup", name: "Veg Hakka Noodles", description: "Wok-tossed noodles with crunchy vegetables and soy.", price: 159, veg: "veg", category: "chinese", image: img("noodle-soup"), rating: 4.2 },
  { id: "d-kebab-peppers", name: "Paneer Kebab & Pepper Roll", description: "Grilled paneer and peppers rolled in a soft rumali roti.", price: 169, veg: "veg", category: "snacks", image: img("kebab-peppers"), rating: 4.3, spicy: 1 },
  { id: "d-chicken-burger", name: "Crispy Chicken Burger", description: "Crunchy fried chicken, slaw, and house sauce in a brioche bun.", price: 189, veg: "non-veg", category: "snacks", image: img("chicken-burger"), rating: 4.4 },
  { id: "d-veg-burger", name: "Aloo Tikki Burger (2 pc)", description: "Two mini tikki burgers with mint mayo. Great for sharing.", price: 149, veg: "veg", category: "snacks", image: img("burger-duo"), rating: 4.2 },
  { id: "d-pizza", name: "Margherita Pizza (8\")", description: "Thin crust, tomato, mozzarella, basil. Travels well.", price: 249, veg: "veg", category: "snacks", image: img("pizza-margherita"), rating: 4.3 },
  { id: "d-pizza-basil", name: "Paneer Tikka Pizza (8\")", description: "Desi-style pizza with tandoori paneer and peppers.", price: 279, veg: "veg", category: "snacks", image: img("pizza-basil"), rating: 4.4 },
  // Breakfast
  { id: "d-avocado-toast", name: "Avocado & Egg Toast", description: "Sourdough, smashed avocado, boiled egg, chilli flakes.", price: 189, veg: "egg", category: "breakfast", image: img("avocado-toast"), rating: 4.3, availableWindows: [{ from: "06:00", to: "11:00" }] },
  { id: "d-veg-pulao", name: "Veg Pulao & Raita", description: "Light peas pulao with boondi raita. Easy on the stomach.", price: 159, veg: "veg", category: "combos", image: img("veg-pulao"), rating: 4.2 },
  { id: "d-tomato-rice", name: "Tomato Rice Bowl", description: "Tangy South-Indian tomato rice with roasted cashews.", price: 139, veg: "veg", category: "south-indian", image: img("tomato-rice"), rating: 4.1 },
  { id: "d-garden-salad", name: "Garden Salad Bowl", description: "Crunchy greens, chickpeas, feta, lemon-olive dressing.", price: 169, veg: "veg", category: "breakfast", image: img("garden-salad"), rating: 4.2, tags: ["Light"] },
  { id: "d-buddha-bowl", name: "Protein Buddha Bowl", description: "Quinoa, roasted veg, avocado, chickpeas and tahini.", price: 219, veg: "veg", category: "breakfast", image: img("buddha-bowl"), rating: 4.3, tags: ["Light"] },
  // Beverages
  { id: "d-masala-chai", name: "Masala Chai (Flask, 2 cups)", description: "Cardamom-ginger chai in a sealed insulated flask.", price: 59, veg: "veg", category: "beverages", image: img("masala-chai"), rating: 4.7, bestseller: true, jain: true },
  { id: "d-chai-biscuits", name: "Chai & Biscuit Box", description: "Hot chai with 4 assorted butter biscuits.", price: 79, veg: "veg", category: "beverages", image: img("chai-biscuits"), rating: 4.4, jain: true },
  { id: "d-orange-juice", name: "Fresh Orange Juice (300 ml)", description: "Cold-pressed, no sugar added. Served chilled.", price: 89, veg: "veg", category: "beverages", image: img("orange-juice"), rating: 4.5, jain: true },
  // Desserts
  { id: "d-gulab-jamun", name: "Gulab Jamun (4 pc)", description: "Soft khoya dumplings in warm cardamom syrup.", price: 89, veg: "veg", category: "desserts", image: img("gulab-jamun"), rating: 4.8, bestseller: true, jain: true },
  { id: "d-pizza-slice", name: "Cheesy Garlic Bread", description: "Warm, cheese-loaded garlic bread. 4 slices.", price: 129, veg: "veg", category: "snacks", image: img("pizza-slice"), rating: 4.3 },
];

export const dishMap: Record<string, Dish> = Object.fromEntries(dishes.map((d) => [d.id, d]));

export const categoryLabels: Record<DishCategory, string> = {
  thali: "Thali",
  biryani: "Biryani",
  "north-indian": "North Indian",
  "south-indian": "South Indian",
  snacks: "Snacks",
  breakfast: "Breakfast",
  jain: "Jain",
  chinese: "Chinese",
  beverages: "Beverages",
  desserts: "Desserts",
  combos: "Combos",
};

export const categories: Category[] = [
  { id: "thali", label: "Thali", image: img("thali-overhead") },
  { id: "biryani", label: "Biryani", image: img("chicken-biryani") },
  { id: "north-indian", label: "North Indian", image: img("butter-chicken") },
  { id: "south-indian", label: "South Indian", image: img("idli-vada") },
  { id: "snacks", label: "Snacks", image: img("samosa") },
  { id: "breakfast", label: "Breakfast", image: img("avocado-toast") },
  { id: "jain", label: "Jain", image: img("curry-spread") },
  { id: "veg", label: "Veg", image: img("veg-biryani") },
  { id: "non-veg", label: "Non-Veg", image: img("tandoori-chicken") },
  { id: "chinese", label: "Chinese", image: img("momos") },
  { id: "beverages", label: "Beverages", image: img("masala-chai") },
  { id: "desserts", label: "Desserts", image: img("gulab-jamun") },
];

// Menu "packs" compose restaurant menus without repeating ids everywhere.
export const packs = {
  north: ["d-butter-chicken", "d-paneer-butter-masala", "d-dal-makhani", "d-tikka-masala", "d-paneer-tikka", "d-tandoori-chicken", "d-creamy-curry"],
  thali: ["d-veg-thali", "d-deluxe-thali", "d-chicken-thali", "d-jain-thali"],
  vegThali: ["d-veg-thali", "d-deluxe-thali", "d-jain-thali"],
  biryani: ["d-chicken-biryani", "d-veg-biryani", "d-mutton-biryani", "d-egg-biryani"],
  vegBiryani: ["d-veg-biryani"],
  south: ["d-masala-dosa", "d-idli-vada", "d-lemon-rice", "d-tomato-rice", "d-curry-lime", "d-prawn-curry"],
  vegSouth: ["d-masala-dosa", "d-idli-vada", "d-lemon-rice", "d-tomato-rice"],
  snacks: ["d-samosa", "d-pav-bhaji", "d-papdi-chaat", "d-kebab-peppers", "d-pizza-slice"],
  street: ["d-pav-bhaji", "d-misal-pav", "d-samosa", "d-papdi-chaat"],
  kebabs: ["d-seekh-kebab", "d-kebab-platter", "d-tandoori-chicken", "d-rogan-josh"],
  chinese: ["d-momos", "d-momo-platter", "d-noodle-soup"],
  cafe: ["d-chicken-burger", "d-veg-burger", "d-pizza", "d-pizza-basil", "d-avocado-toast", "d-garden-salad", "d-buddha-bowl", "d-pizza-slice"],
  bowls: ["d-paneer-rice-bowl", "d-chicken-tikka-bowl", "d-veg-pulao"],
  bev: ["d-masala-chai", "d-chai-biscuits", "d-orange-juice"],
  dessert: ["d-gulab-jamun"],
  bengali: ["d-fish-curry", "d-mutton-biryani", "d-kebab-peppers", "d-veg-thali"],
};

/* ---- Meals ---------------------------------------------------------------
   Meal windows are delivery windows: a halt inside one gets that meal's
   kitchens. "Chai & snacks" runs all day and is last so the timed meals win
   when a moment matches several. */
export const MEALS = [
  { id: "breakfast", label: "Breakfast", window: { from: "06:00", to: "11:00" }, image: img("idli-vada"), blurb: "Idli, dosa, toast and a chai flask before the morning halt." },
  { id: "lunch", label: "Lunch", window: { from: "11:30", to: "15:30" }, image: img("thali-overhead"), blurb: "Thalis, bowls and curries packed hot for the midday stop." },
  { id: "dinner", label: "Dinner", window: { from: "18:30", to: "23:00" }, image: img("chicken-biryani"), blurb: "Biryani, kebabs and curries handed over at your berth." },
  { id: "snacks", label: "Chai & snacks", window: { from: "00:00", to: "23:59" }, image: img("masala-chai"), blurb: "Anytime" },
] as const;

export type MealId = (typeof MEALS)[number]["id"];

const MEAL_CATEGORIES: Record<MealId, DishCategory[]> = {
  breakfast: ["breakfast"],
  lunch: ["thali", "combos", "north-indian", "south-indian", "jain"],
  dinner: ["biryani", "north-indian", "thali", "chinese", "jain"],
  snacks: ["snacks", "beverages", "desserts"],
};
/** South Indian morning plates sit in "south-indian" without a window; they still belong to breakfast. */
const MORNING = /idli|dosa|vada|poha|upma/i;
// "HH:mm" zero-padded strings compare correctly as strings.
const overlaps = (a: TimeWindow, b: TimeWindow) => a.from <= b.to && b.from <= a.to;

/** Meals a dish belongs to: by its availability windows when it has them, else by category. Most dishes belong to several. */
export function mealsForDish(dish: Dish): MealId[] {
  return MEALS.filter((m) => {
    if (m.id === "snacks") return MEAL_CATEGORIES.snacks.includes(dish.category);
    if (dish.availableWindows) return dish.availableWindows.some((w) => overlaps(w, m.window));
    return MEAL_CATEGORIES[m.id].includes(dish.category) || (m.id === "breakfast" && MORNING.test(dish.name));
  }).map((m) => m.id);
}

export function dishesForMeal(mealId: MealId): Dish[] {
  return dishes.filter((d) => mealsForDish(d).includes(mealId));
}
