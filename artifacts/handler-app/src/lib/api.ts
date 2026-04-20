import type {
  AvailableVenue,
  PendingInvitation,
  VenueMemberInfo,
  VenueMembership,
  VenueType,
} from "./types";

export interface MeResponse {
  userId: string;
  email: string;
  name: string;
  venues: VenueMembership[];
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", accept: "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = String(data.error);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export const fetchMe = (): Promise<MeResponse> => jsonFetch<MeResponse>("/api/me");

export const fetchAvailableVenues = (): Promise<AvailableVenue[]> =>
  jsonFetch<AvailableVenue[]>("/api/me/venues/available");

export const joinVenue = (
  inviteToken: string,
): Promise<{ venues: VenueMembership[]; joined: VenueMembership }> =>
  jsonFetch<{ venues: VenueMembership[]; joined: VenueMembership }>(
    "/api/me/venues",
    {
      method: "POST",
      body: JSON.stringify({ inviteToken }),
    },
  );

export const leaveVenue = (
  code: string,
): Promise<{ venues: VenueMembership[] }> =>
  jsonFetch<{ venues: VenueMembership[] }>(
    `/api/me/venues/${encodeURIComponent(code)}`,
    { method: "DELETE" },
  );

// Email-targeted invitations -------------------------------------------------

export const fetchMyInvitations = (): Promise<PendingInvitation[]> =>
  jsonFetch<PendingInvitation[]>("/api/me/invitations");

export const acceptInvitation = (
  id: string,
): Promise<{ venue: VenueMembership }> =>
  jsonFetch<{ venue: VenueMembership }>(
    `/api/me/invitations/${encodeURIComponent(id)}/accept`,
    { method: "POST" },
  );

export const declineInvitation = (id: string): Promise<null> =>
  jsonFetch<null>(
    `/api/me/invitations/${encodeURIComponent(id)}/decline`,
    { method: "POST" },
  );

// Owner-managed venue admin --------------------------------------------------

export const fetchVenueInvitations = (
  code: string,
): Promise<PendingInvitation[]> =>
  jsonFetch<PendingInvitation[]>(
    `/api/venues/${encodeURIComponent(code)}/invitations`,
  );

export const createVenueInvitation = (
  code: string,
  body: { email: string; role?: "handler" | "supervisor" | "owner" },
): Promise<PendingInvitation> =>
  jsonFetch<PendingInvitation>(
    `/api/venues/${encodeURIComponent(code)}/invitations`,
    { method: "POST", body: JSON.stringify(body) },
  );

export const revokeVenueInvitation = (
  code: string,
  id: string,
): Promise<null> =>
  jsonFetch<null>(
    `/api/venues/${encodeURIComponent(code)}/invitations/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

export const fetchVenueMembers = (
  code: string,
): Promise<VenueMemberInfo[]> =>
  jsonFetch<VenueMemberInfo[]>(
    `/api/venues/${encodeURIComponent(code)}/members`,
  );

// Update a venue's classification (valet/baggage/cloakroom/retail). The
// server enforces owner-only access; the handler app uses the response to
// re-skin Command Center, intake, and aging bands without a manual mode
// toggle.
export const updateVenueSettings = (
  code: string,
  body: { venueType: VenueType },
): Promise<{ venueCode: string; venueType: VenueType }> =>
  jsonFetch<{ venueCode: string; venueType: VenueType }>(
    `/api/venues/${encodeURIComponent(code)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );

export const updateVenueMemberRole = (
  code: string,
  userId: string,
  role: "handler" | "supervisor" | "owner",
): Promise<{ venueCode: string; userId: string; role: string }> =>
  jsonFetch<{ venueCode: string; userId: string; role: string }>(
    `/api/venues/${encodeURIComponent(code)}/members/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
  );

export const revokeVenueMember = (
  code: string,
  userId: string,
): Promise<null> =>
  jsonFetch<null>(
    `/api/venues/${encodeURIComponent(code)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
