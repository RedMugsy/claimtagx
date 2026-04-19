import { createHmac, timingSafeEqual } from "node:crypto";

function payloadFor(venueCode: string, ticketId: string): string {
  return `${venueCode.toUpperCase()}:${ticketId.toUpperCase()}`;
}

export function signTicket(
  secret: string,
  venueCode: string,
  ticketId: string,
): string {
  if (!secret) {
    throw new Error("signTicket requires a non-empty venue signing secret");
  }
  return createHmac("sha256", secret)
    .update(payloadFor(venueCode, ticketId))
    .digest("base64url")
    .slice(0, 22);
}

export function verifyTicket(
  secret: string,
  venueCode: string,
  ticketId: string,
  signature: string | undefined | null,
): boolean {
  if (!signature || !secret) return false;
  const expected = signTicket(secret, venueCode, ticketId);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
