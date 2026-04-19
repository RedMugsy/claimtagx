import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import {
  listDemoVenues,
  listMemberships,
  redeemInvite,
  removeMembership,
} from "../lib/memberships";

const router: IRouter = Router();

const JoinBody = z.object({
  inviteToken: z.string().trim().min(4).max(128),
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    userId: req.userId,
    email: req.userEmail,
    name: req.userName,
    venues: req.venues ?? [],
  });
});

router.get("/me/venues/available", requireAuth, async (_req, res, next) => {
  try {
    // Demo invite tokens are only exposed when explicitly enabled. In
    // production tenants this endpoint returns an empty list so handlers
    // can only join via real invites issued out-of-band.
    const demosEnabled =
      process.env.NODE_ENV !== "production" ||
      process.env.ENABLE_DEMO_VENUES === "true";
    if (!demosEnabled) {
      res.json([]);
      return;
    }
    const list = await listDemoVenues();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/me/venues", requireAuth, async (req, res, next) => {
  try {
    const parsed = JoinBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    const result = await redeemInvite(req.userId!, parsed.data.inviteToken);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    const venues = await listMemberships(req.userId!);
    res.status(201).json({ venues, joined: result.venue });
  } catch (err) {
    next(err);
  }
});

router.delete("/me/venues/:code", requireAuth, async (req, res, next) => {
  try {
    const code = String(req.params.code ?? "").toUpperCase();
    await removeMembership(req.userId!, code);
    const venues = await listMemberships(req.userId!);
    res.json({ venues });
  } catch (err) {
    next(err);
  }
});

export default router;
