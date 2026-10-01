import type { Journey } from "@/types";

// Seeded demo PNRs. Any other well-formed 10-digit PNR resolves to one of
// these deterministically so the demo never dead-ends.
export const demoJourneys: Record<string, Journey> = {
  "1234567890": {
    pnr: "1234567890",
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani Express",
    from: "MMCT",
    to: "NDLS",
    date: "2026-10-12",
    travelClass: "3A",
    passengers: [
      { name: "Aarav Mehta", age: 32, gender: "M", coach: "B4", berth: "23", berthType: "Lower", status: "CNF" },
      { name: "Ira Mehta", age: 29, gender: "F", coach: "B4", berth: "24", berthType: "Middle", status: "CNF" },
    ],
    boardingIndex: 0,
    destinationIndex: 6,
    chartPrepared: true,
  },
  "2345678901": {
    pnr: "2345678901",
    trainNumber: "12301",
    trainName: "Howrah Rajdhani Express",
    from: "HWH",
    to: "NDLS",
    date: "2026-10-14",
    travelClass: "2A",
    passengers: [{ name: "Priya Sen", age: 41, gender: "F", coach: "A2", berth: "7", berthType: "Lower", status: "CNF" }],
    boardingIndex: 0,
    destinationIndex: 6,
    chartPrepared: false,
  },
  "3456789012": {
    pnr: "3456789012",
    trainNumber: "12627",
    trainName: "Karnataka Express",
    from: "SBC",
    to: "NDLS",
    date: "2026-10-18",
    travelClass: "SL",
    passengers: [
      { name: "Rohan Kulkarni", age: 24, gender: "M", coach: "S6", berth: "41", berthType: "Side Lower", status: "CNF" },
      { name: "Nikhil Rao", age: 25, gender: "M", coach: "S6", berth: "42", berthType: "Side Upper", status: "RAC" },
    ],
    boardingIndex: 0,
    destinationIndex: 7,
    chartPrepared: true,
  },
  "4567890123": {
    pnr: "4567890123",
    trainNumber: "12163",
    trainName: "Dadar Chennai Superfast",
    from: "DR",
    to: "MAS",
    date: "2026-10-09",
    travelClass: "3A",
    passengers: [{ name: "Lakshmi Iyer", age: 56, gender: "F", coach: "B1", berth: "15", berthType: "Lower", status: "CNF" }],
    boardingIndex: 0,
    destinationIndex: 5,
    chartPrepared: true,
  },
};

export const demoPnrList = Object.keys(demoJourneys);
