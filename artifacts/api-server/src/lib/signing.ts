import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

const FALLBACK_SECRET = "claimtagx-dev-signing-secret-do-not-use-in-prod";
let warnedFallback = false;

function getSecret(): string {
  const s = process.env["CLAIMTAG_SIG_SECRET"];
  if (s && s.length > 0) return s;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "CLAIMTAG_SIG_SECRET must be set in production to sign claim-tag QR codes.",
    );
  }
  if (!warnedFallback) {
    warnedFallback = true;
    logger.warn(
      "CLAIMTAG_SIG_SECRET is not set; using insecure development fallback. Set it before deploying.",
    );
  }
  return FALLBACK_SECRET;
}

function payloadFor(venueCode: string, ticketId: string): string {
  return `${venueCode.toUpperCase()}:${ticketId.toUpperCase()}`;
}

export function signTicket(venueCode: string, ticketId: string): string {
  return createHmac("sha256", getSecret())
    .update(payloadFor(venueCode, ticketId))
    .digest("base64url")
    .slice(0, 22);
}

export function verifyTicket(
  venueCode: string,
  ticketId: string,
  signature: string | undefined | null,
): boolean {
  if (!signature) return false;
  const expected = signTicket(venueCode, ticketId);
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
