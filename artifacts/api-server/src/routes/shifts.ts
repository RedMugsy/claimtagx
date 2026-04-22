import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq, gte, isNull, lt, or } from "drizzle-orm";
import { db, shiftsTable, type Shift } from "@workspace/db";
import {
  requireAuth,
  requireVenueMembership,
  requireVenueRole,
} from "../middlewares/requireAuth";
import { ensureVenue } from "../lib/assets";
import { getMembership } from "../lib/memberships";

// Owners are typically interested in a Mon–Sun calendar week. We compute it
// in UTC so the boundary is deterministic regardless of where the API server
// happens to be running.
const OVERTIME_MINUTES = 40 * 60;

function startOfIsoWeekUtc(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  // getUTCDay: 0 = Sunday, 1 = Monday, ... 6 = Saturday. We want Monday.
  const dow = d.getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - back);
  return d;
}

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

// Per-handler weekly hours for a venue. Reads straight from the existing
// `shifts` table — no new entities. Shifts that span the week boundary are
// clipped to the week range; shifts still in progress count up to "now".
router.get(
  "/venues/:venueCode/shifts/report",
  requireAuth,
  requireVenueRole(["owner"]),
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const now = new Date();
      const weekStart = startOfIsoWeekUtc(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

      // Any shift that overlaps [weekStart, weekEnd) qualifies. That means
      // startedAt < weekEnd AND (endedAt IS NULL OR endedAt >= weekStart).
      const rows = await db
        .select()
        .from(shiftsTable)
        .where(
          and(
            eq(shiftsTable.venueCode, venueCode),
            lt(shiftsTable.startedAt, weekEnd),
            or(
              isNull(shiftsTable.endedAt),
              gte(shiftsTable.endedAt, weekStart),
            ),
          ),
        );

      type Bucket = {
        handlerUserId: string;
        handlerName: string;
        handlerEmail: string;
        role: string;
        minutes: number;
        activeShiftId: string | null;
      };
      const buckets = new Map<string, Bucket>();
      const weekStartMs = weekStart.getTime();
      const weekEndMs = weekEnd.getTime();
      const nowMs = now.getTime();

      for (const row of rows) {
        const startMs = Math.max(row.startedAt.getTime(), weekStartMs);
        const endMs = Math.min(
          row.endedAt ? row.endedAt.getTime() : nowMs,
          weekEndMs,
        );
        const minutes = Math.max(0, Math.round((endMs - startMs) / 60000));
        const existing = buckets.get(row.handlerUserId);
        if (existing) {
          existing.minutes += minutes;
          // Refresh display fields with the most recent shift's values so
          // renames/role changes show up.
          existing.handlerName = row.handlerName;
          existing.handlerEmail = row.handlerEmail;
          existing.role = row.role;
          if (!row.endedAt) existing.activeShiftId = row.id;
        } else {
          buckets.set(row.handlerUserId, {
            handlerUserId: row.handlerUserId,
            handlerName: row.handlerName,
            handlerEmail: row.handlerEmail,
            role: row.role,
            minutes,
            activeShiftId: row.endedAt ? null : row.id,
          });
        }
      }

      const handlers = [...buckets.values()]
        .map((b) => ({
          ...b,
          overtime: b.minutes > OVERTIME_MINUTES,
          overtimeMinutes: Math.max(0, b.minutes - OVERTIME_MINUTES),
        }))
        .sort((a, b) => b.minutes - a.minutes);

      res.json({
        venueCode,
        weekStart: weekStart.getTime(),
        weekEnd: weekEnd.getTime(),
        overtimeThresholdMinutes: OVERTIME_MINUTES,
        handlers,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
