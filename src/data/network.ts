import { stations } from "@/data/stations";

export interface NetworkPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Decorative city points (real coordinates of their main stations) that pad
// the station master into a recognisable rail network. Nothing here is
// serviceable; the map is drawn as a network on purpose, never as an outline.
export const cities: NetworkPoint[] = [
  { id: "SC", name: "Hyderabad", lat: 17.434, lng: 78.501 },
  { id: "GHY", name: "Guwahati", lat: 26.182, lng: 91.753 },
  { id: "BBS", name: "Bhubaneswar", lat: 20.265, lng: 85.839 },
  { id: "VSKP", name: "Visakhapatnam", lat: 17.721, lng: 83.289 },
  { id: "ERS", name: "Kochi", lat: 9.969, lng: 76.291 },
  { id: "TVC", name: "Thiruvananthapuram", lat: 8.487, lng: 76.952 },
  { id: "CBE", name: "Coimbatore", lat: 11.001, lng: 76.966 },
  { id: "MDU", name: "Madurai", lat: 9.919, lng: 78.119 },
  { id: "INDB", name: "Indore", lat: 22.714, lng: 75.866 },
  { id: "JU", name: "Jodhpur", lat: 26.288, lng: 73.021 },
  { id: "UDZ", name: "Udaipur", lat: 24.584, lng: 73.712 },
  { id: "CDG", name: "Chandigarh", lat: 30.711, lng: 76.804 },
  { id: "ASR", name: "Amritsar", lat: 31.634, lng: 74.872 },
  { id: "BSB", name: "Varanasi", lat: 25.327, lng: 82.986 },
  { id: "RNC", name: "Ranchi", lat: 23.364, lng: 85.325 },
  { id: "R", name: "Raipur", lat: 21.248, lng: 81.635 },
  { id: "MAO", name: "Madgaon", lat: 15.271, lng: 73.957 },
  { id: "MAQ", name: "Mangaluru", lat: 12.864, lng: 74.843 },
  { id: "UBL", name: "Hubballi", lat: 15.35, lng: 75.139 },
  { id: "BZA", name: "Vijayawada", lat: 16.518, lng: 80.62 },
  { id: "JBP", name: "Jabalpur", lat: 23.166, lng: 79.951 },
  { id: "GWL", name: "Gwalior", lat: 26.214, lng: 78.182 },
  { id: "NJP", name: "New Jalpaiguri", lat: 26.685, lng: 88.429 },
  { id: "RJT", name: "Rajkot", lat: 22.3, lng: 70.8 },
];

/** Every dot on the network map: real stations first, then the decorative cities. */
export const networkPoints: NetworkPoint[] = [
  ...stations.map((s) => ({ id: s.code, name: s.name, lat: s.lat, lng: s.lng })),
  ...cities,
];

/** Faint main-line corridors between hubs (ids are station codes or city ids above). */
export const corridors: [string, string][] = [
  // Western line
  ["MMCT", "BVI"], ["BVI", "ST"], ["ST", "BRC"], ["BRC", "RTM"], ["RTM", "KOTA"], ["KOTA", "NDLS"], ["ADI", "BRC"],
  // Central trunk and the south-east spur
  ["NDLS", "AGC"], ["AGC", "GWL"], ["GWL", "JHS"], ["JHS", "BPL"], ["BPL", "NGP"], ["NGP", "KZJ"], ["KZJ", "BZA"], ["BZA", "MAS"], ["KZJ", "SC"],
  // Deccan
  ["SBC", "GTL"], ["SC", "SUR"], ["DR", "PUNE"], ["PUNE", "SUR"], ["SUR", "GTL"], ["GTL", "RU"], ["RU", "MAS"],
  // Grand Chord and the Ganga belt
  ["HWH", "DHN"], ["DHN", "GAYA"], ["GAYA", "DDU"], ["DDU", "PRYJ"], ["PRYJ", "CNB"], ["CNB", "NDLS"],
  ["PNBE", "DDU"], ["CNB", "LKO"], ["LKO", "BSB"], ["BSB", "DDU"],
  // North and west
  ["NDLS", "JP"], ["JP", "JU"], ["JP", "UDZ"], ["ADI", "UDZ"], ["JU", "ADI"], ["ADI", "RJT"], ["NDLS", "CDG"], ["NDLS", "ASR"],
  // Konkan and the south-west
  ["MMCT", "MAO"], ["MAO", "MAQ"], ["MAQ", "ERS"], ["ERS", "TVC"], ["MAO", "UBL"], ["UBL", "SBC"], ["UBL", "PUNE"],
  ["SBC", "CBE"], ["CBE", "ERS"], ["SBC", "MAS"], ["MAS", "MDU"], ["MDU", "TVC"],
  // East coast and the centre
  ["BZA", "VSKP"], ["VSKP", "BBS"], ["BBS", "HWH"], ["NGP", "R"], ["R", "HWH"], ["DHN", "RNC"],
  ["BPL", "JBP"], ["JBP", "PRYJ"], ["BPL", "INDB"], ["INDB", "RTM"],
  // North-east
  ["HWH", "NJP"], ["NJP", "GHY"],
];
