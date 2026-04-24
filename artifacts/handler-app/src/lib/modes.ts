import type { AssetModeConfig, AssetModeId, VenueType } from "./types";
import {
  Car,
  Luggage,
  Shirt,
  ShoppingBag,
  Building2,
  type LucideIcon,
} from "lucide-react";

export const MODE_ICONS: Record<AssetModeId, LucideIcon> = {
  vehicles: Car,
  baggage: Luggage,
  cloakrooms: Shirt,
  bags: ShoppingBag,
};

export const MODES: AssetModeConfig[] = [
  {
    id: "vehicles",
    label: "Vehicles",
    short: "Valet",
    blurb: "Valet parking and vehicle handover",
    ticketPrefix: "VAL",
    fields: [
      { key: "plate", label: "License plate", type: "text", placeholder: "ABC-1234", required: true, mono: true },
      { key: "make", label: "Make", type: "text", placeholder: "Toyota", required: true },
      { key: "model", label: "Model", type: "text", placeholder: "Camry", required: true },
      { key: "color", label: "Color", type: "select", required: true, options: ["Black", "White", "Silver", "Grey", "Red", "Blue", "Green", "Other"] },
      { key: "keyTag", label: "Key tag location", type: "text", placeholder: "Hook 14", required: true, mono: true },
      { key: "spot", label: "Parking spot", type: "text", placeholder: "B2-104", required: true, mono: true },
    ],
    columns: [
      { key: "plate", label: "Plate", primary: true, mono: true },
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "spot", label: "Spot", mono: true },
    ],
  },
  {
    id: "baggage",
    label: "Baggage",
    short: "Luggage",
    blurb: "Hotel left-luggage and bag storage",
    ticketPrefix: "BAG",
    fields: [
      { key: "pieces", label: "Number of pieces", type: "number", placeholder: "2", required: true },
      { key: "size", label: "Size / weight", type: "select", required: true, options: ["Carry-on", "Medium", "Large", "Oversized"] },
      { key: "contents", label: "Contents description", type: "textarea", placeholder: "Two black hardshell suitcases, one duffel" },
      { key: "shelf", label: "Storage location / shelf", type: "text", placeholder: "Aisle 3, Shelf C", required: true, mono: true },
    ],
    columns: [
      { key: "pieces", label: "Pcs", primary: true },
      { key: "size", label: "Size" },
      { key: "shelf", label: "Shelf", mono: true },
    ],
  },
  {
    id: "cloakrooms",
    label: "Cloakrooms",
    short: "Coat check",
    blurb: "Coat check, garments, and accessories",
    ticketPrefix: "CLK",
    fields: [
      { key: "garment", label: "Garment type", type: "select", required: true, options: ["Coat", "Jacket", "Blazer", "Scarf", "Other"] },
      { key: "color", label: "Color", type: "text", placeholder: "Camel" },
      { key: "accessories", label: "Accessories", type: "text", placeholder: "Umbrella, hat" },
      { key: "rack", label: "Hook / rack number", type: "text", placeholder: "Rack 12 · #047", required: true, mono: true },
    ],
    columns: [
      { key: "garment", label: "Garment", primary: true },
      { key: "color", label: "Color" },
      { key: "rack", label: "Rack", mono: true },
    ],
  },
  {
    id: "bags",
    label: "Bags",
    short: "Retail hold",
    blurb: "Shopping bags and retail hold service",
    ticketPrefix: "RET",
    fields: [
      { key: "store", label: "Store / origin", type: "text", placeholder: "Atelier Nord", required: true },
      { key: "count", label: "Bag count", type: "number", placeholder: "1", required: true },
      { key: "fragile", label: "Fragile", type: "checkbox" },
      { key: "locker", label: "Shelf / locker number", type: "text", placeholder: "Locker 22", required: true, mono: true },
    ],
    columns: [
      { key: "store", label: "Store", primary: true },
      { key: "count", label: "Bags" },
      { key: "locker", label: "Locker", mono: true },
    ],
  },
];

export const MODE_BY_ID: Record<AssetModeId, AssetModeConfig> = MODES.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<AssetModeId, AssetModeConfig>
);

// ---------------------------------------------------------------------------
// Venue-type adaptation
//
// A venue's `venueType` drives which AssetMode is the default and how the
// app presents itself. The app used to require handlers to pick a mode from
// a dropdown, which meant a valet stand and a coat check saw identical
// screens until somebody remembered to switch. By keying off venueType we
// can re-skin tiles, headings, and aging thresholds the moment a handler
// switches venues — no per-handler config needed.
// ---------------------------------------------------------------------------

export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  valet: "Valet stand",
  baggage: "Baggage room",
  cloakroom: "Cloakroom",
  retail: "Retail hold",
  other: "Custody desk",
};

export const VENUE_TYPE_BLURB: Record<VenueType, string> = {
  valet: "Park, retrieve, and hand over keys",
  baggage: "Multi-piece luggage stored by stay",
  cloakroom: "Fast scan-and-go for coats and bags",
  retail: "Shopping bags and parcels held in lockers",
  other: "General custody and tagging",
};

export const VENUE_TYPE_ICON: Record<VenueType, LucideIcon> = {
  valet: Car,
  baggage: Luggage,
  cloakroom: Shirt,
  retail: ShoppingBag,
  other: Building2,
};

// Maps a venue type to the AssetMode whose intake fields, ticket columns,
// and ticket-id prefix are the right defaults for that kind of venue.
// `other` falls back to vehicles to preserve the historical default — but
// the owner can switch types from settings to re-skin everything.
export const VENUE_TYPE_TO_MODE: Record<VenueType, AssetModeId> = {
  valet: "vehicles",
  baggage: "baggage",
  cloakroom: "cloakrooms",
  retail: "bags",
  other: "vehicles",
};

// Aging band thresholds, in minutes. Each venue type runs at a different
// pace: valet retrievals turn over in minutes, hotel left-luggage in hours,
// retail holds usually settle within an afternoon. The bands let the
// custody screen highlight what's stale relative to the venue's tempo,
// instead of using one global "<1h vs ≥1h" rule.
export interface AgingBands {
  watchAfterMin: number; // amber once an asset has been in custody this long
  overdueAfterMin: number; // red once it crosses this threshold
  pace: string; // short label for the venue's tempo, shown to handlers
}

export const VENUE_AGING_BANDS: Record<VenueType, AgingBands> = {
  valet: { watchAfterMin: 15, overdueAfterMin: 45, pace: "minutes" },
  baggage: {
    watchAfterMin: 60 * 4,
    overdueAfterMin: 60 * 12,
    pace: "hours",
  },
  cloakroom: { watchAfterMin: 90, overdueAfterMin: 240, pace: "tonight" },
  retail: { watchAfterMin: 60 * 2, overdueAfterMin: 60 * 6, pace: "today" },
  other: { watchAfterMin: 60, overdueAfterMin: 240, pace: "hours" },
};

// Page-specific copy keyed by venue type. Defining it here means each page
// can stay generic and just look up the right wording for the active venue.
export interface VenueCopy {
  homeTitle: string; // headline at the top of Command Center
  intakeAction: string; // primary tile verb ("Park & tag" vs "Check-in")
  releaseAction: string; // primary tile verb ("Retrieve" vs "Check-out")
  custodyHeading: string; // heading on the custody page
  custodyTileLabel: string; // short label for the count tile
  intakeVerb: string; // intake page heading verb
}

export const VENUE_COPY: Record<VenueType, VenueCopy> = {
  valet: {
    homeTitle: "Retrieval queue",
    intakeAction: "Park & tag",
    releaseAction: "Retrieve",
    custodyHeading: "Vehicles parked",
    custodyTileLabel: "Parked",
    intakeVerb: "Park new vehicle",
  },
  baggage: {
    homeTitle: "Baggage room",
    intakeAction: "Stow bags",
    releaseAction: "Return bags",
    custodyHeading: "Bags stored",
    custodyTileLabel: "Stored",
    intakeVerb: "Stow new luggage",
  },
  cloakroom: {
    homeTitle: "Cloakroom",
    intakeAction: "Hang & tag",
    releaseAction: "Return",
    custodyHeading: "On the racks",
    custodyTileLabel: "Hanging",
    intakeVerb: "Hang new garment",
  },
  retail: {
    homeTitle: "Retail hold",
    intakeAction: "Hold bags",
    releaseAction: "Hand back",
    custodyHeading: "Holds in lockers",
    custodyTileLabel: "Holding",
    intakeVerb: "Hold new bags",
  },
  other: {
    homeTitle: "Command Center",
    intakeAction: "Check-in",
    releaseAction: "Check-out",
    custodyHeading: "In custody",
    custodyTileLabel: "Custody",
    intakeVerb: "Intake new asset",
  },
};

// ---------------------------------------------------------------------------
// Asset noun (singular) used in CTAs like "Check-in new vehicle".
// Sourced from the venue's SEP (Service Eligibility Profile). Until the
// backend exposes per-venue overrides we fall back to this venue-type table.
// ---------------------------------------------------------------------------
export const VENUE_ASSET_NOUN: Record<VenueType, string> = {
  valet: "vehicle",
  baggage: "bag",
  cloakroom: "garment",
  retail: "bag",
  other: "asset",
};

// ---------------------------------------------------------------------------
// TA policy (mocked).
//
// These describe choices the Tenant Admin makes at the SEP level: do they
// need to differentiate Service Class (e.g. VIP / Regular), do they
// segment Patron types, and can a handler take in another asset before
// completing the previous capture? The real values will come from the
// backend later — for now we stub realistic defaults so the UI is
// exercised end-to-end.
// ---------------------------------------------------------------------------
export interface TaPolicy {
  /**
   * Up to 6 service-class names defined in the SEP. `undefined` means the
   * SEP has a single class (no chooser shown).
   */
  serviceClasses?: string[];
  /**
   * Patron segmentation defined by the handler/TA. `undefined` means a
   * single bucket (no chooser shown).
   */
  patronTypes?: string[];
  /**
   * If true, a handler may issue another ClaimTag before completing the
   * required capture for the current pending one. The pending asset stays
   * pegged to the handler until they capture details or hand it off.
   */
  allowMultiAssetPending: boolean;
}

export const DEFAULT_TA_POLICY: TaPolicy = {
  serviceClasses: ["VIP", "Regular"],
  patronTypes: ["Hotel guest", "Restaurant", "Drop-off"],
  allowMultiAssetPending: true,
};

export type AgingBand = "fresh" | "watch" | "overdue";

export function classifyAge(
  intakeAt: number,
  bands: AgingBands,
  now: number = Date.now(),
): AgingBand {
  const ageMin = (now - intakeAt) / 60_000;
  if (ageMin >= bands.overdueAfterMin) return "overdue";
  if (ageMin >= bands.watchAfterMin) return "watch";
  return "fresh";
}

export function formatBandThreshold(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const hours = min / 60;
  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return Number.isInteger(days) ? `${days}d` : `${days.toFixed(1)}d`;
}
