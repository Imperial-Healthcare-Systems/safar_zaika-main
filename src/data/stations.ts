import type { Region, Station } from "@/types";

/** The four operating regions and their states, from the business plan. */
export const REGIONS: { id: Region; states: string[] }[] = [
  { id: "North", states: ["Uttar Pradesh", "Haryana", "Punjab", "Rajasthan", "Uttarakhand", "Jammu & Kashmir", "Delhi"] },
  { id: "East", states: ["Bihar", "West Bengal", "Jharkhand", "Odisha", "Assam"] },
  { id: "West", states: ["Madhya Pradesh", "Chhattisgarh", "Maharashtra", "Goa", "Gujarat"] },
  { id: "South", states: ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana"] },
];

const regionOfState: Record<string, Region> = Object.fromEntries(REGIONS.flatMap((r) => r.states.map((s) => [s, r.id])));

/** Planned size of the network; the seeded list below is only the demo subset. */
export const PLANNED_STATIONS = 450;

// Mock station master. Coordinates are real so a map provider can be
// dropped in later; vendor availability is demo data only.
const seeded: Omit<Station, "region">[] = [
  { code: "NDLS", name: "New Delhi", city: "New Delhi", state: "Delhi", lat: 28.643, lng: 77.219, popular: true, image: "/images/stations/new-delhi.jpg", tagline: "Chole bhature, kebabs & kulfi" },
  { code: "MMCT", name: "Mumbai Central", city: "Mumbai", state: "Maharashtra", lat: 18.969, lng: 72.819, popular: true, image: "/images/stations/mumbai.jpg", tagline: "Pav bhaji, vada pav & biryani" },
  { code: "HWH", name: "Howrah Jn", city: "Kolkata", state: "West Bengal", lat: 22.583, lng: 88.342, popular: true, tagline: "Kathi rolls, fish curry & mishti" },
  { code: "SBC", name: "KSR Bengaluru", city: "Bengaluru", state: "Karnataka", lat: 12.978, lng: 77.571, popular: true, tagline: "Bisi bele bath, dosa & filter coffee" },
  { code: "MAS", name: "Chennai Central", city: "Chennai", state: "Tamil Nadu", lat: 13.083, lng: 80.275, popular: true, tagline: "Idli, pongal & Chettinad curries" },
  { code: "ADI", name: "Ahmedabad Jn", city: "Ahmedabad", state: "Gujarat", lat: 23.026, lng: 72.601, popular: true, tagline: "Gujarati thali, dhokla & fafda" },
  { code: "JP", name: "Jaipur Jn", city: "Jaipur", state: "Rajasthan", lat: 26.919, lng: 75.788, popular: true, tagline: "Dal baati, laal maas & ghewar" },
  { code: "LKO", name: "Lucknow Charbagh", city: "Lucknow", state: "Uttar Pradesh", lat: 26.832, lng: 80.922, popular: true, tagline: "Galouti kebab & Awadhi biryani" },
  { code: "PNBE", name: "Patna Jn", city: "Patna", state: "Bihar", lat: 25.603, lng: 85.137, popular: true, tagline: "Litti chokha & sattu paratha" },
  { code: "PUNE", name: "Pune Jn", city: "Pune", state: "Maharashtra", lat: 18.529, lng: 73.874, popular: true, tagline: "Misal pav & Maharashtrian thali" },
  { code: "AGC", name: "Agra Cantt", city: "Agra", state: "Uttar Pradesh", lat: 27.157, lng: 77.993, image: "/images/stations/agra.jpg", tagline: "Petha, bedai & Mughlai curries" },
  { code: "BVI", name: "Borivali", city: "Mumbai", state: "Maharashtra", lat: 19.229, lng: 72.857 },
  { code: "ST", name: "Surat", city: "Surat", state: "Gujarat", lat: 21.206, lng: 72.841, tagline: "Locho, undhiyu & Surti thali" },
  { code: "BRC", name: "Vadodara Jn", city: "Vadodara", state: "Gujarat", lat: 22.31, lng: 73.181, tagline: "Sev usal & Gujarati thali" },
  { code: "RTM", name: "Ratlam Jn", city: "Ratlam", state: "Madhya Pradesh", lat: 23.331, lng: 75.04, tagline: "Ratlami sev & poha" },
  { code: "KOTA", name: "Kota Jn", city: "Kota", state: "Rajasthan", lat: 25.179, lng: 75.845, tagline: "Kota kachori & dal baati" },
  { code: "DHN", name: "Dhanbad Jn", city: "Dhanbad", state: "Jharkhand", lat: 23.795, lng: 86.43 },
  { code: "GAYA", name: "Gaya Jn", city: "Gaya", state: "Bihar", lat: 24.803, lng: 84.998 },
  { code: "DDU", name: "Pt. DD Upadhyaya Jn", city: "Mughalsarai", state: "Uttar Pradesh", lat: 25.283, lng: 83.119 },
  { code: "PRYJ", name: "Prayagraj Jn", city: "Prayagraj", state: "Uttar Pradesh", lat: 25.446, lng: 81.825 },
  { code: "CNB", name: "Kanpur Central", city: "Kanpur", state: "Uttar Pradesh", lat: 26.454, lng: 80.351, tagline: "Thaggu ke laddu & kebabs" },
  { code: "GTL", name: "Guntakal Jn", city: "Guntakal", state: "Andhra Pradesh", lat: 15.171, lng: 77.368 },
  { code: "KZJ", name: "Kazipet Jn", city: "Warangal", state: "Telangana", lat: 17.971, lng: 79.483 },
  { code: "NGP", name: "Nagpur Jn", city: "Nagpur", state: "Maharashtra", lat: 21.152, lng: 79.088, tagline: "Saoji curries & orange barfi" },
  { code: "BPL", name: "Bhopal Jn", city: "Bhopal", state: "Madhya Pradesh", lat: 23.267, lng: 77.412, tagline: "Poha jalebi & Bhopali gosht" },
  { code: "JHS", name: "Jhansi Jn", city: "Jhansi", state: "Uttar Pradesh", lat: 25.448, lng: 78.578 },
  { code: "DR", name: "Dadar", city: "Mumbai", state: "Maharashtra", lat: 19.018, lng: 72.843 },
  { code: "SUR", name: "Solapur Jn", city: "Solapur", state: "Maharashtra", lat: 17.669, lng: 75.907 },
  { code: "RU", name: "Renigunta Jn", city: "Tirupati", state: "Andhra Pradesh", lat: 13.651, lng: 79.512 },
];

export const stations: Station[] = seeded.map((s) => ({ ...s, region: regionOfState[s.state] }));

export const stationMap: Record<string, Station> = Object.fromEntries(stations.map((s) => [s.code, s]));

export function getStation(code: string): Station | undefined {
  return stationMap[code];
}
