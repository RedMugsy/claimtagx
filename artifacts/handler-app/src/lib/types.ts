export type AssetModeId = "vehicles" | "baggage" | "cloakrooms" | "bags";

export type FieldType = "text" | "number" | "select" | "textarea" | "checkbox";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  mono?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  primary?: boolean;
  mono?: boolean;
}

export interface AssetModeConfig {
  id: AssetModeId;
  label: string;
  short: string;
  blurb: string;
  ticketPrefix: string;
  fields: FieldDef[];
  columns: ColumnDef[];
}

export interface CustodyAsset {
  id: string;
  ticketId: string;
  mode: AssetModeId;
  patron: { name: string; phone: string };
  fields: Record<string, string | number | boolean>;
  photos: string[];
  intakeAt: number;
  handler: string;
  status: "active" | "released";
  releasedAt?: number;
}

export interface HandlerSession {
  email: string;
  venueCode: string;
  venueName: string;
  handlerName: string;
}
