import { Router, type IRouter } from "express";
import { z } from "zod";
import { clerkClient } from "@clerk/express";
import {
  requireAuth,
  requireVenueRole,
} from "../middlewares/requireAuth";
import {
  acceptInvitation,
  createInvitation,
  declineInvitation,
  listPendingInvitationsForEmail,
  listPendingInvitationsForVenue,
  listVenueMembers,
  revokeInvitation,
  revokeMember,
} from "../lib/memberships";

const router: IRouter = Router();

const InviteBody = z.object({
  email: z.string().trim().min(3).max(254),
  role: z.enum(["handler", "supervisor", "owner"]).optional(),
});

// ---------------------------------------------------------------------------
// Handler-facing endpoints (the invited user)
// ---------------------------------------------------------------------------

router.get("/me/invitations", requireAuth, async (req, res, next) => {
  try {
    const list = await listPendingInvitationsForEmail(req.userEmail ?? "");
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/me/invitations/:id/accept",
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await acceptInvitation({
        invitationId: String(req.params.id),
        userId: req.userId!,
        userEmail: req.userEmail ?? "",
      });
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(200).json({ venue: result.venue });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/me/invitations/:id/decline",
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await declineInvitation({
        invitationId: String(req.params.id),
        userEmail: req.userEmail ?? "",
      });
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Owner-facing endpoints (manage who can work the venue)
// ---------------------------------------------------------------------------

const ownerOnly = requireVenueRole(["owner", "supervisor"]);

router.get(
  "/venues/:venueCode/invitations",
  requireAuth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const code = String(req.params.venueCode).toUpperCase();
      const list = await listPendingInvitationsForVenue(code);
      res.json(list);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/venues/:venueCode/invitations",
  requireAuth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const code = String(req.params.venueCode).toUpperCase();
      const parsed = InviteBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        });
        return;
      }
      // Only existing owners can create new owners. Supervisors can invite
      // handlers and other supervisors but cannot grant owner-level access.
      const requestedRole = parsed.data.role ?? "handler";
      const actorRole =
        req.venues?.find((v) => v.code === code)?.role ?? "";
      if (requestedRole === "owner" && actorRole !== "owner") {
        res.status(403).json({
          error: "Only an owner can grant the owner role",
        });
        return;
      }
      const result = await createInvitation({
        venueCode: code,
        email: parsed.data.email,
        role: requestedRole,
        invitedByUserId: req.userId!,
      });
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(201).json(result.invitation);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/venues/:venueCode/invitations/:id",
  requireAuth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const code = String(req.params.venueCode).toUpperCase();
      const result = await revokeInvitation({
        invitationId: String(req.params.id),
        venueCode: code,
      });
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/venues/:venueCode/members",
  requireAuth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const code = String(req.params.venueCode).toUpperCase();
      const members = await listVenueMembers(code);
      // Enrich with display info from Clerk so the owner can identify the
      // person, not just a user id.
      const enriched = await Promise.all(
        members.map(async (m) => {
          try {
            const user = await clerkClient.users.getUser(m.userId);
            const email =
              user.primaryEmailAddress?.emailAddress ??
              user.emailAddresses[0]?.emailAddress ??
              "";
            const name =
              [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
              user.username ||
              email.split("@")[0] ||
              "Handler";
            return { ...m, email, name };
          } catch {
            return { ...m, email: "", name: m.userId };
          }
        }),
      );
      res.json(enriched);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/venues/:venueCode/members/:userId",
  requireAuth,
  ownerOnly,
  async (req, res, next) => {
    try {
      const code = String(req.params.venueCode).toUpperCase();
      const result = await revokeMember({
        venueCode: code,
        targetUserId: String(req.params.userId),
        actingUserId: req.userId!,
      });
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
