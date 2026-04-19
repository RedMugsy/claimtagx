import { Router, type IRouter } from "express";
import { db, assetsTable, eventsTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { CreateAssetBody, ReleaseAssetBody } from "@workspace/api-zod";
import {
  createTicketId,
  ensureHandler,
  ensureVenue,
  seedVenueIfEmpty,
  serializeAsset,
} from "../lib/assets";
import { verifyTicket } from "../lib/signing";
import {
  requireAuth,
  requireVenueMembership,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use("/venues/:venueCode", requireAuth, requireVenueMembership());

router.get("/venues/:venueCode/assets", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    await ensureVenue(venueCode);
    await seedVenueIfEmpty(venueCode);
    const rows = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.venueId, venueCode))
      .orderBy(desc(assetsTable.intakeAt));
    res.json(rows.map(serializeAsset));
  } catch (err) {
    next(err);
  }
});

router.post("/venues/:venueCode/assets", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    const parsed = CreateAssetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
      return;
    }
    const body = parsed.data;
    const handlerEmail = req.userEmail || body.handlerEmail;
    const handlerName = req.userName || body.handlerName;
    await ensureVenue(venueCode, body.venueName ?? undefined);
    const handlerId = await ensureHandler(venueCode, handlerEmail, handlerName);
    const ticketId = await createTicketId(venueCode, body.mode);
    const now = new Date();
    const [inserted] = await db
      .insert(assetsTable)
      .values({
        venueId: venueCode,
        ticketId,
        mode: body.mode,
        patronName: body.patron.name,
        patronPhone: body.patron.phone,
        fields: (body.fields ?? {}) as Record<string, string | number | boolean>,
        photos: (body.photos ?? []) as string[],
        handlerId,
        handlerName,
        status: "active",
        intakeAt: now,
      })
      .returning();
    if (!inserted) {
      res.status(500).json({ error: "Failed to create asset" });
      return;
    }
    await db.insert(eventsTable).values({
      venueId: venueCode,
      assetId: inserted.id,
      handlerId,
      type: "intake",
      at: now,
    });
    res.status(201).json(serializeAsset(inserted));
  } catch (err) {
    next(err);
  }
});

router.get("/venues/:venueCode/assets/:ticketId", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    const ticketId = req.params.ticketId;
    const [row] = await db
      .select()
      .from(assetsTable)
      .where(
        and(
          eq(assetsTable.venueId, venueCode),
          sql`upper(${assetsTable.ticketId}) = upper(${ticketId})`,
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    res.json(serializeAsset(row));
  } catch (err) {
    next(err);
  }
});

router.post("/venues/:venueCode/assets/:ticketId/release", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    const ticketId = req.params.ticketId;
    const parsed = ReleaseAssetBody.safeParse(req.body ?? {});
    const body = parsed.success ? parsed.data : {};
    const handlerEmail = req.userEmail || body.handlerEmail;
    const handlerName = req.userName || body.handlerName;
    // Releases originating from a QR scan MUST present a valid signature.
    // Manual typed entry (`source: "manual"` or omitted with no signature)
    // is the explicit fallback and bypasses signature verification.
    const hasSignature = typeof body.signature === "string" && body.signature.length > 0;
    if (body.source === "scan") {
      if (!hasSignature || !verifyTicket(venueCode, ticketId, body.signature!)) {
        res.status(403).json({ error: "Invalid or missing tag signature" });
        return;
      }
    } else if (hasSignature) {
      if (!verifyTicket(venueCode, ticketId, body.signature!)) {
        res.status(403).json({ error: "Invalid tag signature" });
        return;
      }
    }
    let handlerId: string | null = null;
    if (handlerEmail && handlerName) {
      handlerId = await ensureHandler(venueCode, handlerEmail, handlerName);
    }
    const now = new Date();
    const [updated] = await db
      .update(assetsTable)
      .set({ status: "released", releasedAt: now })
      .where(
        and(
          eq(assetsTable.venueId, venueCode),
          sql`upper(${assetsTable.ticketId}) = upper(${ticketId})`,
          eq(assetsTable.status, "active"),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "No active ticket with that id" });
      return;
    }
    await db.insert(eventsTable).values({
      venueId: venueCode,
      assetId: updated.id,
      handlerId,
      type: "release",
      at: now,
    });
    res.json(serializeAsset(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
