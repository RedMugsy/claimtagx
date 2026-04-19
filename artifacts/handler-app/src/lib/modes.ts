import type { AssetModeConfig, AssetModeId } from "./types";
import { Car, Luggage, Shirt, ShoppingBag, type LucideIcon } from "lucide-react";

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
