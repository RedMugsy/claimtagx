import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  assetsTable,
  db,
  serviceRequestsTable,
  type ServiceRequest,
} from "@workspace/db";
import {
  requireAuth,
  requireVenueMembership,
} from "../middlewares/requireAuth";
import { ensureVenue } from "../lib/assets";

const router: IRouter = Router();

const SERVICE_KINDS = [
  "bring_my_car",
  "fetch_my_coat",
  "repack_my_bag",
  "deliver_to_table",
  "other",
] as const;

const CreateBody = z.object({
  ticketId: z.string().trim().min(1).max(64),
  kind: z.enum(SERVICE_KINDS),
  notes: z.string().trim().max(500).optional(),
  requestedByName: z.string().trim().max(120).optional(),
});

function serialize(row: ServiceRequest) {
  return {
    id: row.id,
    venueCode: row.venueCode,
    ticketId: row.ticketId,
    assetId: row.assetId ?? null,
    kind: row.kind,
    notes: row.notes,
    status: row.status,
    requestedByName: row.requestedByName,
    claimedByUserId: row.claimedByUserId ?? null,
    claimedByName: row.claimedByName ?? null,
    createdAt: row.createdAt.getTime(),
    claimedAt: row.claimedAt ? row.claimedAt.getTime() : null,
    completedAt: row.completedAt ? row.completedAt.getTime() : null,
  };
}

router.use(
  "/venues/:venueCode/services",
  requireAuth,
  requireVenueMembership(),
);
router.use(
  "/venues/:venueCode/service-requests",
  requireAuth,
  requireVenueMembership(),
);

router.get(
  "/venues/:venueCode/services",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      await ensureVenue(venueCode);
      const status =
        typeof req.query.status === "string" ? req.query.status : null;
      const conds = [eq(serviceRequestsTable.venueCode, venueCode)];
      if (status) conds.push(eq(serviceRequestsTable.status, status));
      const rows = await db
        .select()
        .from(serviceRequestsTable)
        .where(and(...conds))
        .orderBy(desc(serviceRequestsTable.createdAt))
        .limit(200);
      res.json(rows.map(serialize));
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/venues/:venueCode/services/open-count",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      await ensureVenue(venueCode);
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(serviceRequestsTable)
        .where(
          and(
            eq(serviceRequestsTable.venueCode, venueCode),
            sql`${serviceRequestsTable.status} in ('open','claimed')`,
          ),
        );
      res.json({ count: Number(row?.count ?? 0) });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/venues/:venueCode/services",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const parsed = CreateBody.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message ?? "Invalid request",
        });
        return;
      }
      await ensureVenue(venueCode);
      // Resolve the asset for this ticket (case-insensitive). Service
      // requests must be tied to a real ticket so handlers can act on them.
      const [asset] = await db
        .select({ id: assetsTable.id, ticketId: assetsTable.ticketId })
        .from(assetsTable)
        .where(
          and(
            eq(assetsTable.venueId, venueCode),
            sql`upper(${assetsTable.ticketId}) = upper(${parsed.data.ticketId})`,
          ),
        )
        .limit(1);
      if (!asset) {
        res.status(404).json({ error: "Ticket not found in this venue" });
        return;
      }
      const [inserted] = await db
        .insert(serviceRequestsTable)
        .values({
          venueCode,
          ticketId: asset.ticketId,
          assetId: asset.id,
          kind: parsed.data.kind,
          notes: parsed.data.notes ?? "",
          requestedByName:
            parsed.data.requestedByName?.trim() ||
            req.userName ||
            "Patron",
          status: "open",
        })
        .returning();
      res.status(201).json(serialize(inserted));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/venues/:venueCode/services/:id/claim",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const id = String(req.params.id);
      const [updated] = await db
        .update(serviceRequestsTable)
        .set({
          status: "claimed",
          claimedByUserId: req.userId!,
          claimedByName: req.userName ?? "Handler",
          claimedAt: new Date(),
        })
        .where(
          and(
            eq(serviceRequestsTable.id, id),
            eq(serviceRequestsTable.venueCode, venueCode),
            eq(serviceRequestsTable.status, "open"),
          ),
        )
        .returning();
      if (!updated) {
        res.status(409).json({ error: "Already claimed or no longer open" });
        return;
      }
      res.json(serialize(updated));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/venues/:venueCode/services/:id/complete",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const id = String(req.params.id);
      const [updated] = await db
        .update(serviceRequestsTable)
        .set({ status: "done", completedAt: new Date() })
        .where(
          and(
            eq(serviceRequestsTable.id, id),
            eq(serviceRequestsTable.venueCode, venueCode),
            sql`${serviceRequestsTable.status} in ('open','claimed')`,
          ),
        )
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Request not found or already closed" });
        return;
      }
      res.json(serialize(updated));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/venues/:venueCode/services/:id/cancel",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const id = String(req.params.id);
      const [updated] = await db
        .update(serviceRequestsTable)
        .set({ status: "cancelled", completedAt: new Date() })
        .where(
          and(
            eq(serviceRequestsTable.id, id),
            eq(serviceRequestsTable.venueCode, venueCode),
            sql`${serviceRequestsTable.status} in ('open','claimed')`,
          ),
        )
        .returning();
      if (!updated) {
        res.status(404).json({ error: "Request not found or already closed" });
        return;
      }
      res.json(serialize(updated));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
