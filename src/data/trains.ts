import type { RouteStop, Train } from "@/types";

const stop = (
  stationCode: string,
  arrival: string | null,
  departure: string | null,
  day: number,
  distanceKm: number,
): RouteStop => {
  let halt = 0;
  if (arrival && departure) {
    const [ah, am] = arrival.split(":").map(Number);
    const [dh, dm] = departure.split(":").map(Number);
    halt = dh * 60 + dm - (ah * 60 + am);
  }
  return { stationCode, arrival, departure, halt, day, distanceKm };
};

// Timetables are approximate demo data, not an official schedule.
export const trains: Train[] = [
  {
    number: "12951",
    name: "Mumbai Rajdhani Express",
    from: "MMCT",
    to: "NDLS",
    runsOn: "Daily",
    classes: ["1A", "2A", "3A"],
    stops: [
      stop("MMCT", null, "17:00", 1, 0),
      stop("BVI", "17:28", "17:30", 1, 30),
      stop("ST", "19:43", "19:48", 1, 263),
      stop("BRC", "21:08", "21:18", 1, 392),
      stop("RTM", "00:55", "01:00", 2, 654),
      stop("KOTA", "03:25", "03:30", 2, 923),
      stop("NDLS", "08:35", null, 2, 1384),
    ],
  },
  {
    number: "12301",
    name: "Howrah Rajdhani Express",
    from: "HWH",
    to: "NDLS",
    runsOn: "Daily",
    classes: ["1A", "2A", "3A"],
    stops: [
      stop("HWH", null, "16:55", 1, 0),
      stop("DHN", "19:38", "19:43", 1, 259),
      stop("GAYA", "21:48", "21:53", 1, 457),
      stop("DDU", "23:40", "23:50", 1, 664),
      stop("PRYJ", "02:00", "02:10", 2, 816),
      stop("CNB", "04:03", "04:08", 2, 1010),
      stop("NDLS", "09:55", null, 2, 1451),
    ],
  },
  {
    number: "12627",
    name: "Karnataka Express",
    from: "SBC",
    to: "NDLS",
    runsOn: "Daily",
    classes: ["2A", "3A", "SL"],
    stops: [
      stop("SBC", null, "19:20", 1, 0),
      stop("GTL", "01:10", "01:15", 2, 325),
      stop("KZJ", "09:30", "09:35", 2, 735),
      stop("NGP", "15:15", "15:25", 2, 1100),
      stop("BPL", "21:35", "21:45", 2, 1490),
      stop("JHS", "02:10", "02:20", 3, 1780),
      stop("AGC", "05:05", "05:10", 3, 1995),
      stop("NDLS", "09:00", null, 3, 2190),
    ],
  },
  {
    number: "12163",
    name: "Dadar Chennai Superfast",
    from: "DR",
    to: "MAS",
    runsOn: "Daily",
    classes: ["2A", "3A", "SL"],
    stops: [
      stop("DR", null, "20:30", 1, 0),
      stop("PUNE", "23:50", "23:55", 1, 182),
      stop("SUR", "04:45", "04:50", 2, 437),
      stop("GTL", "09:45", "09:50", 2, 783),
      stop("RU", "15:15", "15:20", 2, 1140),
      stop("MAS", "19:45", null, 2, 1280),
    ],
  },
  {
    number: "12957",
    name: "Swarna Jayanti Rajdhani",
    from: "ADI",
    to: "NDLS",
    runsOn: "Daily",
    classes: ["1A", "2A", "3A"],
    stops: [
      stop("ADI", null, "17:40", 1, 0),
      stop("BRC", "19:02", "19:12", 1, 100),
      stop("RTM", "22:45", "22:50", 1, 362),
      stop("KOTA", "01:20", "01:25", 2, 631),
      stop("NDLS", "06:50", null, 2, 1092),
    ],
  },
  {
    number: "12015",
    name: "Ajmer Shatabdi Express",
    from: "NDLS",
    to: "JP",
    runsOn: "Daily",
    classes: ["CC", "EC"],
    stops: [
      stop("NDLS", null, "06:10", 1, 0),
      stop("JP", "10:30", null, 1, 308),
    ],
  },
  {
    number: "12003",
    name: "Lucknow Shatabdi Express",
    from: "NDLS",
    to: "LKO",
    runsOn: "Daily",
    classes: ["CC", "EC"],
    stops: [
      stop("NDLS", null, "06:10", 1, 0),
      stop("CNB", "11:00", "11:05", 1, 440),
      stop("LKO", "12:40", null, 1, 511),
    ],
  },
  {
    number: "12309",
    name: "Patna Rajdhani Express",
    from: "PNBE",
    to: "NDLS",
    runsOn: "Daily",
    classes: ["1A", "2A", "3A"],
    stops: [
      stop("PNBE", null, "19:25", 1, 0),
      stop("DDU", "22:55", "23:05", 1, 211),
      stop("PRYJ", "01:05", "01:10", 2, 364),
      stop("CNB", "03:15", "03:20", 2, 557),
      stop("NDLS", "07:40", null, 2, 997),
    ],
  },
];

export const trainMap: Record<string, Train> = Object.fromEntries(trains.map((t) => [t.number, t]));

export function findTrain(query: string): Train[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return trains.filter((t) => t.number.includes(q) || t.name.toLowerCase().includes(q));
}
