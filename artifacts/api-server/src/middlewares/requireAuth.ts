import type { NextFunction, Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { listMemberships, type MembershipRow } from "../lib/memberships";

export type VenueMembership = MembershipRow;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userName?: string;
      venues?: VenueMembership[];
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await clerkClient.users.getUser(userId);
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      email.split("@")[0] ||
      "Handler";
    req.userId = userId;
    req.userEmail = email;
    req.userName = fullName;
    req.venues = await listMemberships(userId);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireVenueMembership(
  paramName = "venueCode",
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const code = String(req.params[paramName] ?? "").toUpperCase();
    if (!code) {
      res.status(400).json({ error: "Venue code required" });
      return;
    }
    const venues = req.venues ?? [];
    if (!venues.some((v) => v.code === code)) {
      res.status(403).json({ error: "Not a member of this venue" });
      return;
    }
    next();
  };
}

export function requireVenueRole(
  roles: string[],
  paramName = "venueCode",
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const code = String(req.params[paramName] ?? "").toUpperCase();
    const venue = (req.venues ?? []).find((v) => v.code === code);
    if (!venue) {
      res.status(403).json({ error: "Not a member of this venue" });
      return;
    }
    if (!roles.includes(venue.role)) {
      res.status(403).json({ error: "Insufficient role for this venue" });
      return;
    }
    next();
  };
}
