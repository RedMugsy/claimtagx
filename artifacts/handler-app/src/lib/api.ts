import type { AvailableVenue, VenueMembership } from "./types";

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
