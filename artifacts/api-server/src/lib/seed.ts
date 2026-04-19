import type { InsertAssetRow } from "@workspace/db";

export const VENUE_DEFAULTS: Record<string, string> = {
  "VLT-001": "Hotel Meridian — Valet",
  "BAG-002": "Grand Central Left-Luggage",
  "CLK-003": "Théâtre Lumière Cloakroom",
  "RET-004": "Marche Verre Retail Hold",
  DEMO: "ClaimTagX Demo Venue",
};

export interface SeedAsset
  extends Omit<InsertAssetRow, "venueId" | "intakeAt"> {
  intakeAtOffsetMs: number;
}

export function buildSeedAssets(): SeedAsset[] {
  return [
    {
      ticketId: "VAL-4839",
      mode: "vehicles",
      patronName: "Maya Chen",
      patronPhone: "+1 415 555 0182",
      fields: {
        plate: "7XYZ-921",
        make: "Tesla",
        model: "Model Y",
        color: "White",
        keyTag: "Hook 09",
        spot: "B2-104",
      },
      photos: [],
      handlerName: "Alex K.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 38,
    },
    {
      ticketId: "VAL-5102",
      mode: "vehicles",
      patronName: "Daniel Park",
      patronPhone: "+1 408 555 7711",
      fields: {
        plate: "8ABC-554",
        make: "BMW",
        model: "M3",
        color: "Black",
        keyTag: "Hook 14",
        spot: "B1-018",
      },
      photos: [],
      handlerName: "Alex K.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 12,
    },
    {
      ticketId: "BAG-2210",
      mode: "baggage",
      patronName: "Sofia Romero",
      patronPhone: "+34 612 88 04 21",
      fields: {
        pieces: 3,
        size: "Large",
        contents: "Two black hardshell, one duffel",
        shelf: "Aisle 3, Shelf C",
      },
      photos: [],
      handlerName: "Priya N.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 60 * 4,
    },
    {
      ticketId: "BAG-2247",
      mode: "baggage",
      patronName: "Hiro Tanaka",
      patronPhone: "+81 90 1234 5678",
      fields: {
        pieces: 1,
        size: "Carry-on",
        contents: "Navy roller",
        shelf: "Aisle 1, Shelf A",
      },
      photos: [],
      handlerName: "Priya N.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 90,
    },
    {
      ticketId: "CLK-0712",
      mode: "cloakrooms",
      patronName: "Lena Voss",
      patronPhone: "+49 30 555 0119",
      fields: {
        garment: "Coat",
        color: "Camel wool",
        accessories: "Umbrella",
        rack: "Rack 12 · #047",
      },
      photos: [],
      handlerName: "Marco T.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 22,
    },
    {
      ticketId: "CLK-0718",
      mode: "cloakrooms",
      patronName: "Owen Reilly",
      patronPhone: "+1 312 555 9924",
      fields: {
        garment: "Jacket",
        color: "Navy denim",
        accessories: "—",
        rack: "Rack 14 · #053",
      },
      photos: [],
      handlerName: "Marco T.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 8,
    },
    {
      ticketId: "RET-3380",
      mode: "bags",
      patronName: "Kira Osei",
      patronPhone: "+1 646 555 4408",
      fields: { store: "Atelier Nord", count: 2, fragile: false, locker: "Locker 22" },
      photos: [],
      handlerName: "Jules P.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 50,
    },
    {
      ticketId: "RET-3392",
      mode: "bags",
      patronName: "Theo Ng",
      patronPhone: "+1 917 555 2204",
      fields: { store: "Marche Verre", count: 1, fragile: true, locker: "Locker 09" },
      photos: [],
      handlerName: "Jules P.",
      status: "active",
      intakeAtOffsetMs: 1000 * 60 * 18,
    },
  ];
}
