import type { Restaurant, TimeWindow } from "@/types";
import { packs } from "./menu";

const scene = (name: string) => `/images/scenes/${name}.jpg`;
const food = (name: string) => `/images/food/${name}.jpg`;

const uniq = (...lists: string[][]) => Array.from(new Set(lists.flat()));

interface Seed {
  id: string;
  name: string;
  station: string;
  cuisines: string[];
  rating: number;
  count: number;
  veg?: boolean;
  prep: number;
  forTwo: number;
  tags: string[];
  km: number;
  image: string;
  conf: number;
  hours?: string;
  /** vendor switched off for the day */
  paused?: string;
  /** 0 = Sunday */
  closedDays?: number[];
  featured?: boolean;
  menu: string[];
}

/** "6:00 AM" -> "06:00" */
const to24 = (t: string) => {
  const [time, ampm] = t.trim().split(" ");
  const [h, m] = time.split(":").map(Number);
  const hour = (h % 12) + (ampm === "PM" ? 12 : 0);
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** "11:00 AM – 1:00 AM" -> two windows; "24 hours" -> all day. */
export function windowsFromHours(hours: string): TimeWindow[] {
  if (/24 hours/i.test(hours)) return [{ from: "00:00", to: "23:59" }];
  const [from, to] = hours.split(/\s[–-]\s/).map(to24);
  return to > from ? [{ from, to }] : [{ from, to: "23:59" }, { from: "00:00", to }];
}

const r = (s: Seed): Restaurant => {
  const openHours = s.hours ?? "6:00 AM – 11:30 PM";
  return {
    id: s.id,
    name: s.name,
    stationCode: s.station,
    cuisines: s.cuisines,
    rating: s.rating,
    ratingCount: s.count,
    pureVeg: Boolean(s.veg),
    prepTimeMin: s.prep,
    priceForTwo: s.forTwo,
    tags: s.tags,
    distanceKm: s.km,
    image: s.image,
    deliveryConfidence: s.conf,
    openHours,
    live: !s.paused,
    pausedReason: s.paused,
    serviceWindows: windowsFromHours(openHours),
    closedDays: s.closedDays,
    featured: s.featured,
    menu: s.menu,
  };
};

// All restaurant names are fictional demo partners.
export const restaurants: Restaurant[] = [
  // ---- Mumbai Rajdhani route (demo PNR 1234567890) ----
  r({ id: "surti-rasoi", name: "Surti Rasoi", station: "ST", cuisines: ["Gujarati", "Thali", "Jain"], rating: 4.6, count: 2140, veg: true, prep: 20, forTwo: 400, tags: ["Pure Veg", "Jain friendly"], km: 1.2, image: food("thali-steel"), conf: 96, featured: true, menu: uniq(packs.vegThali, packs.street, packs.bev, packs.dessert) }),
  r({ id: "tapi-kitchen", name: "Tapi Riverside Kitchen", station: "ST", cuisines: ["North Indian", "Biryani"], rating: 4.4, count: 980, prep: 25, forTwo: 550, tags: ["Biryani", "Late night"], km: 2.0, image: scene("restaurant-2"), conf: 92, hours: "11:00 AM – 1:00 AM", menu: uniq(packs.biryani, packs.north, packs.bev) }),
  r({ id: "locho-house", name: "Locho House Express", station: "ST", cuisines: ["Snacks", "Street Food"], rating: 4.3, count: 640, veg: true, prep: 15, forTwo: 250, tags: ["Pure Veg", "Quick bites"], km: 0.6, image: food("samosa"), conf: 94, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),

  r({ id: "sayaji-thali", name: "Sayaji Thali Ghar", station: "BRC", cuisines: ["Gujarati", "Thali", "Jain"], rating: 4.7, count: 3310, veg: true, prep: 18, forTwo: 420, tags: ["Pure Veg", "Bestseller", "Jain friendly"], km: 0.9, image: food("thali-overhead"), conf: 97, featured: true, menu: uniq(packs.vegThali, packs.bowls, packs.bev, packs.dessert) }),
  r({ id: "biryani-darbar", name: "Biryani Darbar", station: "BRC", cuisines: ["Biryani", "Mughlai", "Kebabs"], rating: 4.5, count: 1870, prep: 25, forTwo: 600, tags: ["Biryani", "Kebabs"], km: 1.8, image: food("chicken-biryani"), conf: 93, featured: true, hours: "11:00 AM – 12:30 AM", menu: uniq(packs.biryani, packs.kebabs, packs.bev, packs.dessert) }),
  r({ id: "makhani-co", name: "Makhani & Co.", station: "BRC", cuisines: ["North Indian", "Punjabi"], rating: 4.4, count: 1210, prep: 22, forTwo: 520, tags: ["Butter chicken", "Family packs"], km: 2.4, image: food("butter-chicken"), conf: 91, closedDays: [1], menu: uniq(packs.north, packs.thali, packs.bev, packs.dessert) }),
  r({ id: "vadodara-cafe", name: "Platform 1 Café", station: "BRC", cuisines: ["Café", "Continental", "Snacks"], rating: 4.2, count: 540, prep: 15, forTwo: 350, tags: ["Coffee", "Light meals"], km: 0.3, image: scene("restaurant-5"), conf: 95, paused: "Paused by the kitchen today", menu: uniq(packs.cafe, packs.bev) }),

  r({ id: "ratlami-zaika", name: "Ratlami Zaika", station: "RTM", cuisines: ["Snacks", "North Indian"], rating: 4.3, count: 420, veg: true, prep: 20, forTwo: 300, tags: ["Pure Veg", "Local special"], km: 0.8, image: food("misal-pav"), conf: 90, menu: uniq(packs.street, packs.vegThali, packs.bev) }),
  r({ id: "midnight-dhaba", name: "Midnight Dhaba", station: "RTM", cuisines: ["Punjabi", "Dhaba"], rating: 4.1, count: 310, prep: 25, forTwo: 450, tags: ["Open late", "Dhaba style"], km: 1.5, image: scene("restaurant-4"), conf: 88, hours: "24 hours", paused: "Kitchen closed for maintenance today", menu: uniq(packs.north, packs.biryani, packs.bev) }),

  r({ id: "kota-kachori", name: "Kota Kachori Corner", station: "KOTA", cuisines: ["Rajasthani", "Snacks"], rating: 4.5, count: 1120, veg: true, prep: 15, forTwo: 250, tags: ["Pure Veg", "Breakfast"], km: 0.5, image: food("papdi-chaat"), conf: 95, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "chambal-grill", name: "Chambal Grill House", station: "KOTA", cuisines: ["Mughlai", "Kebabs", "Biryani"], rating: 4.4, count: 760, prep: 28, forTwo: 650, tags: ["Kebabs", "Tandoor"], km: 2.1, image: food("tandoori-chicken"), conf: 90, menu: uniq(packs.kebabs, packs.biryani, packs.north, packs.bev) }),
  r({ id: "dal-baati-house", name: "Dal Baati House", station: "KOTA", cuisines: ["Rajasthani", "Thali"], rating: 4.6, count: 1490, veg: true, prep: 20, forTwo: 400, tags: ["Pure Veg", "Thali"], km: 1.1, image: food("curry-spread"), conf: 94, featured: true, menu: uniq(packs.vegThali, packs.bowls, packs.bev, packs.dessert) }),

  // ---- Popular stations ----
  r({ id: "delhi-kebab-co", name: "Old Delhi Kebab Co.", station: "NDLS", cuisines: ["Mughlai", "Kebabs"], rating: 4.6, count: 5230, prep: 25, forTwo: 700, tags: ["Kebabs", "Bestseller"], km: 1.4, image: food("seekh-kebab"), conf: 95, featured: true, menu: uniq(packs.kebabs, packs.biryani, packs.north, packs.bev, packs.dessert) }),
  r({ id: "paharganj-thali", name: "Paharganj Thali Junction", station: "NDLS", cuisines: ["North Indian", "Thali"], rating: 4.4, count: 2870, veg: true, prep: 18, forTwo: 380, tags: ["Pure Veg", "Thali"], km: 0.4, image: food("thali-overhead"), conf: 96, menu: uniq(packs.vegThali, packs.north, packs.bev, packs.dessert) }),
  r({ id: "chole-bhature-express", name: "Chole Bhature Express", station: "NDLS", cuisines: ["Snacks", "Punjabi"], rating: 4.5, count: 3980, veg: true, prep: 15, forTwo: 260, tags: ["Pure Veg", "Breakfast"], km: 0.7, image: food("pav-bhaji"), conf: 97, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "capital-cafe", name: "Capital Café & Bakery", station: "NDLS", cuisines: ["Café", "Continental"], rating: 4.3, count: 1120, prep: 15, forTwo: 420, tags: ["Coffee", "Sandwiches"], km: 1.0, image: scene("restaurant-1"), conf: 93, closedDays: [0], menu: uniq(packs.cafe, packs.bev) }),

  r({ id: "bombay-biryani-house", name: "Bombay Biryani House", station: "MMCT", cuisines: ["Biryani", "Mughlai"], rating: 4.5, count: 4120, prep: 25, forTwo: 600, tags: ["Biryani"], km: 1.2, image: food("biryani-platter"), conf: 94, featured: true, menu: uniq(packs.biryani, packs.kebabs, packs.bev, packs.dessert) }),
  r({ id: "chowpatty-chaat", name: "Chowpatty Chaat & Pav", station: "MMCT", cuisines: ["Street Food", "Snacks"], rating: 4.6, count: 5560, veg: true, prep: 12, forTwo: 220, tags: ["Pure Veg", "Quick bites"], km: 0.5, image: food("pav-bhaji"), conf: 97, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "ghar-ka-khana", name: "Ghar Ka Khana", station: "MMCT", cuisines: ["Home-style", "Thali"], rating: 4.4, count: 1980, veg: true, prep: 20, forTwo: 360, tags: ["Pure Veg", "Jain friendly"], km: 1.6, image: food("thali-steel"), conf: 95, menu: uniq(packs.vegThali, packs.bowls, packs.bev) }),

  r({ id: "kolkata-kathi", name: "Kolkata Kathi & Curry", station: "HWH", cuisines: ["Bengali", "Rolls"], rating: 4.5, count: 3350, prep: 20, forTwo: 450, tags: ["Rolls", "Fish curry"], km: 0.9, image: food("fish-curry"), conf: 93, featured: true, menu: uniq(packs.bengali, packs.north, packs.bev, packs.dessert) }),
  r({ id: "mishti-ghar", name: "Mishti Ghar", station: "HWH", cuisines: ["Sweets", "Snacks"], rating: 4.7, count: 2110, veg: true, prep: 10, forTwo: 200, tags: ["Pure Veg", "Desserts"], km: 0.6, image: food("gulab-jamun"), conf: 96, menu: uniq(packs.dessert, packs.snacks, packs.bev) }),
  r({ id: "howrah-biryani", name: "Howrah Biryani Mahal", station: "HWH", cuisines: ["Biryani", "Mughlai"], rating: 4.3, count: 1760, prep: 25, forTwo: 520, tags: ["Biryani"], km: 1.8, image: food("biryani-copper"), conf: 90, menu: uniq(packs.biryani, packs.kebabs, packs.bev) }),

  r({ id: "udupi-express", name: "Udupi Express Kitchen", station: "SBC", cuisines: ["South Indian", "Breakfast"], rating: 4.6, count: 4480, veg: true, prep: 15, forTwo: 280, tags: ["Pure Veg", "Breakfast"], km: 0.7, image: food("idli-vada"), conf: 97, featured: true, menu: uniq(packs.vegSouth, packs.bev, packs.dessert) }),
  r({ id: "nagarjuna-andhra", name: "Nagarjuna Andhra Meals", station: "SBC", cuisines: ["Andhra", "Biryani"], rating: 4.4, count: 2230, prep: 22, forTwo: 480, tags: ["Spicy", "Biryani"], km: 1.4, image: food("curry-lime"), conf: 92, menu: uniq(packs.south, packs.biryani, packs.bev) }),
  r({ id: "bengaluru-bowls", name: "Bengaluru Bowl Co.", station: "SBC", cuisines: ["Bowls", "Healthy"], rating: 4.3, count: 980, prep: 15, forTwo: 420, tags: ["Healthy", "Light meals"], km: 2.2, image: food("buddha-bowl"), conf: 94, menu: uniq(packs.bowls, packs.cafe, packs.bev) }),

  r({ id: "chettinad-kitchen", name: "Chettinad Kitchen", station: "MAS", cuisines: ["Chettinad", "South Indian"], rating: 4.5, count: 3010, prep: 22, forTwo: 500, tags: ["Spicy", "Non-veg special"], km: 1.1, image: food("prawn-curry"), conf: 93, featured: true, menu: uniq(packs.south, packs.biryani, packs.bev) }),
  r({ id: "saravana-tiffin", name: "Saravana Tiffin Room", station: "MAS", cuisines: ["South Indian", "Tiffin"], rating: 4.6, count: 5120, veg: true, prep: 12, forTwo: 240, tags: ["Pure Veg", "Breakfast"], km: 0.4, image: food("idli-leaf"), conf: 97, menu: uniq(packs.vegSouth, packs.bev, packs.dessert) }),
  r({ id: "marina-cafe", name: "Marina Café", station: "MAS", cuisines: ["Café", "Snacks"], rating: 4.2, count: 760, prep: 15, forTwo: 380, tags: ["Coffee", "Sandwiches"], km: 1.9, image: scene("restaurant-3"), conf: 92, paused: "Paused by the kitchen today", menu: uniq(packs.cafe, packs.bev) }),

  r({ id: "gordhan-thal", name: "Gordhan Thal Express", station: "ADI", cuisines: ["Gujarati", "Thali", "Jain"], rating: 4.7, count: 6230, veg: true, prep: 20, forTwo: 450, tags: ["Pure Veg", "Jain friendly", "Bestseller"], km: 1.0, image: food("thali-overhead"), conf: 97, featured: true, menu: uniq(packs.vegThali, packs.street, packs.bev, packs.dessert) }),
  r({ id: "manek-chowk-bites", name: "Manek Chowk Bites", station: "ADI", cuisines: ["Street Food", "Snacks"], rating: 4.4, count: 2140, veg: true, prep: 15, forTwo: 240, tags: ["Pure Veg", "Late night"], km: 2.6, image: food("samosa"), conf: 93, hours: "7:00 AM – 1:30 AM", menu: uniq(packs.street, packs.snacks, packs.chinese, packs.bev) }),
  r({ id: "amdavad-biryani", name: "Amdavad Biryani Works", station: "ADI", cuisines: ["Biryani", "Mughlai"], rating: 4.3, count: 1320, prep: 25, forTwo: 550, tags: ["Biryani"], km: 1.7, image: food("veg-biryani"), conf: 90, menu: uniq(packs.biryani, packs.kebabs, packs.bev) }),

  r({ id: "pink-city-rasoi", name: "Pink City Rasoi", station: "JP", cuisines: ["Rajasthani", "Thali"], rating: 4.6, count: 3870, veg: true, prep: 20, forTwo: 420, tags: ["Pure Veg", "Thali", "Dal baati"], km: 0.8, image: food("curry-spread"), conf: 96, featured: true, menu: uniq(packs.vegThali, packs.bowls, packs.bev, packs.dessert) }),
  r({ id: "laal-maas-junction", name: "Laal Maas Junction", station: "JP", cuisines: ["Rajasthani", "Mughlai"], rating: 4.4, count: 1450, prep: 28, forTwo: 650, tags: ["Spicy", "Non-veg special"], km: 1.9, image: food("rogan-josh"), conf: 90, menu: uniq(packs.kebabs, packs.north, packs.biryani, packs.bev) }),
  r({ id: "jaipur-cafe", name: "Jaipur Junction Café", station: "JP", cuisines: ["Café", "Snacks"], rating: 4.2, count: 620, prep: 15, forTwo: 360, tags: ["Coffee", "Light meals"], km: 0.4, image: scene("restaurant-5"), conf: 94, menu: uniq(packs.cafe, packs.bev) }),

  r({ id: "awadhi-dastarkhwan", name: "Awadhi Dastarkhwan", station: "LKO", cuisines: ["Awadhi", "Kebabs", "Biryani"], rating: 4.7, count: 4120, prep: 25, forTwo: 700, tags: ["Kebabs", "Bestseller"], km: 1.2, image: food("kebab-plate"), conf: 95, featured: true, menu: uniq(packs.kebabs, packs.biryani, packs.north, packs.bev, packs.dessert) }),
  r({ id: "hazratganj-thali", name: "Hazratganj Thali", station: "LKO", cuisines: ["North Indian", "Thali"], rating: 4.4, count: 1980, veg: true, prep: 18, forTwo: 380, tags: ["Pure Veg", "Thali"], km: 2.3, image: food("thali-steel"), conf: 94, menu: uniq(packs.vegThali, packs.north, packs.bev, packs.dessert) }),
  r({ id: "charbagh-chaat", name: "Charbagh Chaat House", station: "LKO", cuisines: ["Street Food", "Snacks"], rating: 4.3, count: 1120, veg: true, prep: 12, forTwo: 220, tags: ["Pure Veg", "Quick bites"], km: 0.3, image: food("papdi-chaat"), conf: 96, menu: uniq(packs.street, packs.snacks, packs.bev) }),

  r({ id: "litti-chokha-ghar", name: "Litti Chokha Ghar", station: "PNBE", cuisines: ["Bihari", "Snacks"], rating: 4.5, count: 2210, veg: true, prep: 18, forTwo: 260, tags: ["Pure Veg", "Local special"], km: 0.6, image: food("misal-pav"), conf: 94, featured: true, menu: uniq(packs.street, packs.vegThali, packs.bev, packs.dessert) }),
  r({ id: "patna-biryani", name: "Patna Biryani Point", station: "PNBE", cuisines: ["Biryani", "Mughlai"], rating: 4.3, count: 1340, prep: 25, forTwo: 500, tags: ["Biryani"], km: 1.5, image: food("chicken-biryani"), conf: 90, menu: uniq(packs.biryani, packs.kebabs, packs.bev) }),

  r({ id: "misal-house", name: "Pune Misal House", station: "PUNE", cuisines: ["Maharashtrian", "Snacks"], rating: 4.6, count: 3560, veg: true, prep: 15, forTwo: 240, tags: ["Pure Veg", "Spicy"], km: 0.7, image: food("misal-pav"), conf: 96, featured: true, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "deccan-thali", name: "Deccan Thali Bhavan", station: "PUNE", cuisines: ["Maharashtrian", "Thali", "Jain"], rating: 4.5, count: 2230, veg: true, prep: 20, forTwo: 400, tags: ["Pure Veg", "Jain friendly"], km: 1.3, image: food("thali-overhead"), conf: 95, menu: uniq(packs.vegThali, packs.bowls, packs.bev, packs.dessert) }),
  r({ id: "koregaon-grill", name: "Koregaon Grill & Bowls", station: "PUNE", cuisines: ["Grill", "Bowls", "Continental"], rating: 4.3, count: 980, prep: 20, forTwo: 520, tags: ["Healthy", "Grill"], km: 2.8, image: food("chicken-tikka-bowl"), conf: 91, menu: uniq(packs.bowls, packs.cafe, packs.kebabs, packs.bev) }),

  // ---- Other route stations ----
  r({ id: "taj-mughlai", name: "Taj Mughlai Kitchen", station: "AGC", cuisines: ["Mughlai", "North Indian"], rating: 4.4, count: 1780, prep: 25, forTwo: 600, tags: ["Kebabs", "Bedai"], km: 1.6, image: food("tikka-masala"), conf: 92, menu: uniq(packs.north, packs.kebabs, packs.biryani, packs.bev, packs.dessert) }),
  r({ id: "petha-wala", name: "Petha Wala & Breakfast", station: "AGC", cuisines: ["Snacks", "Sweets", "Breakfast"], rating: 4.5, count: 2410, veg: true, prep: 12, forTwo: 220, tags: ["Pure Veg", "Breakfast"], km: 0.5, image: food("samosa"), conf: 95, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "jhansi-dhaba", name: "Rani Dhaba", station: "JHS", cuisines: ["Dhaba", "North Indian"], rating: 4.2, count: 540, prep: 25, forTwo: 400, tags: ["Open late", "Dhaba style"], km: 1.1, image: scene("restaurant-4"), conf: 88, hours: "24 hours", menu: uniq(packs.north, packs.thali, packs.bev) }),
  r({ id: "bhopal-poha", name: "Bhopal Poha & Jalebi", station: "BPL", cuisines: ["Breakfast", "Snacks"], rating: 4.5, count: 1870, veg: true, prep: 12, forTwo: 200, tags: ["Pure Veg", "Breakfast"], km: 0.4, image: food("papdi-chaat"), conf: 95, menu: uniq(packs.street, packs.snacks, packs.bev, packs.dessert) }),
  r({ id: "bhopali-gosht", name: "Bhopali Gosht House", station: "BPL", cuisines: ["Mughlai", "Biryani"], rating: 4.4, count: 1290, prep: 28, forTwo: 620, tags: ["Non-veg special"], km: 2.0, image: food("rogan-josh"), conf: 90, menu: uniq(packs.kebabs, packs.biryani, packs.north, packs.bev) }),
  r({ id: "orange-city-thali", name: "Orange City Thali", station: "NGP", cuisines: ["Maharashtrian", "Thali"], rating: 4.4, count: 1560, veg: true, prep: 20, forTwo: 380, tags: ["Pure Veg", "Thali"], km: 0.9, image: food("thali-steel"), conf: 94, menu: uniq(packs.vegThali, packs.bowls, packs.bev, packs.dessert) }),
  r({ id: "saoji-bhojnalaya", name: "Saoji Bhojnalaya", station: "NGP", cuisines: ["Saoji", "Spicy"], rating: 4.5, count: 2010, prep: 25, forTwo: 500, tags: ["Very spicy", "Local special"], km: 1.7, image: food("curry-lime"), conf: 91, menu: uniq(packs.north, packs.kebabs, packs.biryani, packs.bev) }),
  r({ id: "kazipet-tiffins", name: "Kazipet Tiffins", station: "KZJ", cuisines: ["South Indian", "Breakfast"], rating: 4.3, count: 680, veg: true, prep: 15, forTwo: 220, tags: ["Pure Veg", "Breakfast"], km: 0.3, image: food("idli-vada"), conf: 93, menu: uniq(packs.vegSouth, packs.bev) }),
  r({ id: "guntakal-meals", name: "Guntakal Meals Point", station: "GTL", cuisines: ["Andhra", "Meals"], rating: 4.2, count: 410, prep: 20, forTwo: 320, tags: ["Spicy", "Meals"], km: 0.6, image: food("tomato-rice"), conf: 89, menu: uniq(packs.south, packs.bev) }),
  r({ id: "solapur-bhakri", name: "Solapur Bhakri House", station: "SUR", cuisines: ["Maharashtrian", "Thali"], rating: 4.3, count: 520, veg: true, prep: 20, forTwo: 300, tags: ["Pure Veg", "Local special"], km: 0.8, image: food("curry-spread"), conf: 90, menu: uniq(packs.vegThali, packs.street, packs.bev) }),
  r({ id: "tirupati-prasadam", name: "Tirupati Tiffin & Meals", station: "RU", cuisines: ["South Indian", "Tiffin"], rating: 4.4, count: 930, veg: true, prep: 15, forTwo: 240, tags: ["Pure Veg", "Breakfast"], km: 0.5, image: food("idli-leaf"), conf: 94, menu: uniq(packs.vegSouth, packs.bev, packs.dessert) }),
  r({ id: "kanpur-kebabs", name: "Kanpur Kebab Corner", station: "CNB", cuisines: ["Kebabs", "Mughlai"], rating: 4.5, count: 2230, prep: 22, forTwo: 550, tags: ["Kebabs", "Bestseller"], km: 1.0, image: food("seekh-kebab"), conf: 93, menu: uniq(packs.kebabs, packs.biryani, packs.north, packs.bev) }),
  r({ id: "thaggu-sweets", name: "Thaggu Sweets & Thali", station: "CNB", cuisines: ["North Indian", "Thali", "Sweets"], rating: 4.4, count: 1540, veg: true, prep: 18, forTwo: 360, tags: ["Pure Veg", "Desserts"], km: 1.4, image: food("gulab-jamun"), conf: 94, menu: uniq(packs.vegThali, packs.dessert, packs.bev) }),
  r({ id: "sangam-thali", name: "Sangam Thali House", station: "PRYJ", cuisines: ["North Indian", "Thali"], rating: 4.3, count: 1120, veg: true, prep: 20, forTwo: 340, tags: ["Pure Veg", "Thali"], km: 0.7, image: food("thali-overhead"), conf: 92, menu: uniq(packs.vegThali, packs.north, packs.bev, packs.dessert) }),
  r({ id: "prayag-biryani", name: "Prayag Biryani Centre", station: "PRYJ", cuisines: ["Biryani", "Mughlai"], rating: 4.2, count: 860, prep: 25, forTwo: 480, tags: ["Biryani"], km: 1.6, image: food("biryani-copper"), conf: 89, paused: "Not taking orders today", menu: uniq(packs.biryani, packs.bev) }),
  r({ id: "ddu-dhaba", name: "Highway Dhaba DDU", station: "DDU", cuisines: ["Dhaba", "North Indian"], rating: 4.1, count: 380, prep: 25, forTwo: 380, tags: ["Open late"], km: 1.2, image: scene("restaurant-4"), conf: 86, hours: "24 hours", menu: uniq(packs.north, packs.thali, packs.bev) }),
  r({ id: "dhanbad-tiffin", name: "Dhanbad Tiffin Service", station: "DHN", cuisines: ["Home-style", "Thali"], rating: 4.2, count: 460, veg: true, prep: 20, forTwo: 300, tags: ["Pure Veg", "Home-style"], km: 0.9, image: food("thali-steel"), conf: 90, menu: uniq(packs.vegThali, packs.bev) }),
  // GAYA intentionally has no partners -> "no-food" state in the journey flow.
];

export const restaurantMap: Record<string, Restaurant> = Object.fromEntries(restaurants.map((x) => [x.id, x]));

export const restaurantsByStation = (code: string) => restaurants.filter((x) => x.stationCode === code);
