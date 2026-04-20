import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, shiftsTable, type Shift } from "@workspace/db";
import { requireAuth, requireVenueMembership } from "../middlewares/requireAuth";
import { ensureVenue } from "../lib/assets";
import { getMembership } from "../lib/memberships";

const router: IRouter = Router();

const StartBody = z.object({
  venueCode: z.string().trim().min(1).max(64),
  targetMinutes: z.number().int().min(30).max(1440).optional(),
});

function serialize(row: Shift) {
  return {
    id: row.id,
    venueCode: row.venueCode,
    handlerUserId: row.handlerUserId,
    handlerEmail: row.handlerEmail,
    handlerName: row.handlerName,
    role: row.role,
    targetMinutes: row.targetMinutes,
    startedAt: row.startedAt.getTime(),
    endedAt: row.endedAt ? row.endedAt.getTime() : null,
  };
}

router.get("/me/shift/active", requireAuth, async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(shiftsTable)
      .where(
        and(
          eq(shiftsTable.handlerUserId, req.userId!),
          isNull(shiftsTable.endedAt),
        ),
      )
      .orderBy(desc(shiftsTable.startedAt))
      .limit(1);
    res.json({ shift: row ? serialize(row) : null });
  } catch (err) {
    next(err);
  }
});

router.post("/me/shifts/start", requireAuth, async (req, res, next) => {
  try {
    const parsed = StartBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    const venueCode = parsed.data.venueCode.toUpperCase();
    const membership = await getMembership(req.userId!, venueCode);
    if (!membership) {
      res.status(403).json({ error: "Not a member of this venue" });
      return;
    }
    await ensureVenue(venueCode);

    // A handler can only have one active shift at a time, across all venues.
    // The DB enforces this with a partial unique index; we check first so we
    // can return a friendly message that names the venue they're on shift at.
    const [existing] = await db
      .select()
      .from(shiftsTable)
      .where(
        and(
          eq(shiftsTable.handlerUserId, req.userId!),
          isNull(shiftsTable.endedAt),
        ),
      )
      .limit(1);
    if (existing) {
      const sameVenue = existing.venueCode === venueCode;
      res.status(409).json({
        error: sameVenue
          ? "You already have an active shift here"
          : `You already have an active shift at ${existing.venueCode}; end it before starting a new one`,
      });
      return;
    }

    const [inserted] = await db
      .insert(shiftsTable)
      .values({
        venueCode,
        handlerUserId: req.userId!,
        handlerEmail: req.userEmail ?? "",
        handlerName: req.userName ?? "Handler",
        role: membership.role,
        targetMinutes: parsed.data.targetMinutes ?? 480,
      })
      .returning();
    res.status(201).json(serialize(inserted));
  } catch (err) {
    next(err);
  }
});

router.post("/me/shifts/:shiftId/end", requireAuth, async (req, res, next) => {
  try {
    const shiftId = String(req.params.shiftId);
    const [updated] = await db
      .update(shiftsTable)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(shiftsTable.id, shiftId),
          eq(shiftsTable.handlerUserId, req.userId!),
          isNull(shiftsTable.endedAt),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "No active shift with that id" });
      return;
    }
    res.json(serialize(updated));
  } catch (err) {
    next(err);
  }
});

router.get(
  "/venues/:venueCode/shifts/active",
  requireAuth,
  requireVenueMembership(),
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const rows = await db
        .select()
        .from(shiftsTable)
        .where(
          and(
            eq(shiftsTable.venueCode, venueCode),
            isNull(shiftsTable.endedAt),
          ),
        )
        .orderBy(desc(shiftsTable.startedAt));
      res.json(rows.map(serialize));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
