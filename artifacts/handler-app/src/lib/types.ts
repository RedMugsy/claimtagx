export type AssetModeId = "vehicles" | "baggage" | "cloakrooms" | "bags";

// Venue type drives the handler app's defaults — intake fields, aging
// thresholds, and tile copy all key off this. "other" is the fallback when
// an owner hasn't picked a type yet.
export type VenueType = "valet" | "baggage" | "cloakroom" | "retail" | "other";
export const VENUE_TYPES: VenueType[] = [
  "valet",
  "baggage",
  "cloakroom",
  "retail",
  "other",
];

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
  releasedBy?: string | null;
  signature: string;
}

export interface VenueMembership {
  code: string;
  name: string;
  role?: string;
  venueType?: VenueType;
  stationCapabilities?: AssetModeId[];
  handlerAuthorizations?: AssetModeId[];
}

export interface AvailableVenue {
  code: string;
  name: string;
  inviteToken: string;
}

export interface PendingInvitation {
  id: string;
  venueCode: string;
  venueName: string;
  email: string;
  role: string;
  invitedByUserId: string;
  createdAt: number;
}

export interface VenueMemberInfo {
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: number;
}

export interface HandlerSession {
  email: string;
  handlerName: string;
  venueCode: string;
  venueName: string;
}
