import { Router, type IRouter } from "express";
import { db, assetsTable, eventsTable, handlersTable } from "@workspace/db";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { CreateAssetBody, ReleaseAssetBody } from "@workspace/api-zod";
import {
  createTicketId,
  ensureHandler,
  ensureVenue,
  getVenueSigningSecret,
  rotateVenueSigningSecret,
  seedVenueIfEmpty,
  serializeAsset,
  serializeTamperEvent,
} from "../lib/assets";
import { verifyTicket } from "../lib/signing";
import { publish, subscribe } from "../lib/sse";
import { maybeAlertOnTamperSpike } from "../lib/tamperAlerts";
import {
  requireAuth,
  requireVenueMembership,
  requireVenueRole,
} from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use("/venues/:venueCode", requireAuth, requireVenueMembership());

router.get("/venues/:venueCode/events", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    await ensureVenue(venueCode);
    const unsubscribe = subscribe(venueCode, res);
    req.on("close", () => {
      unsubscribe();
      try {
        res.end();
      } catch {
        // ignore
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/venues/:venueCode/tamper-events", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    await ensureVenue(venueCode);
    const limitRaw = Number(req.query.limit);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(200, Math.floor(limitRaw))
        : 50;
    const rows = await db
      .select()
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.venueId, venueCode),
          eq(eventsTable.type, "signature_invalid"),
        ),
      )
      .orderBy(desc(eventsTable.at))
      .limit(limit);
    res.json(rows.map((row) => serializeTamperEvent(row)));
  } catch (err) {
    next(err);
  }
});

const ALLOWED_STATUSES = new Set(["active", "released"]);
const ALLOWED_MODES = new Set(["vehicles", "baggage", "cloakrooms", "bags"]);

function parseEpochMs(raw: unknown): Date | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return new Date(n);
}

router.get("/venues/:venueCode/assets", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    await ensureVenue(venueCode);
    await seedVenueIfEmpty(venueCode);
    const venueSecret = await getVenueSigningSecret(venueCode);

    const statusParam = typeof req.query.status === "string" ? req.query.status : null;
    const modeParam = typeof req.query.mode === "string" ? req.query.mode : null;
    const handlerParam =
      typeof req.query.handler === "string" && req.query.handler.trim().length > 0
        ? req.query.handler.trim()
        : null;
    const fromDate = parseEpochMs(req.query.from);
    const toDate = parseEpochMs(req.query.to);

    if (statusParam && !ALLOWED_STATUSES.has(statusParam)) {
      res.status(400).json({ error: "Invalid status filter" });
      return;
    }
    if (modeParam && !ALLOWED_MODES.has(modeParam)) {
      res.status(400).json({ error: "Invalid mode filter" });
      return;
    }

    const conditions = [eq(assetsTable.venueId, venueCode)];
    if (statusParam) conditions.push(eq(assetsTable.status, statusParam));
    if (modeParam) conditions.push(eq(assetsTable.mode, modeParam));

    // When filtering released history, range refers to release time.
    const dateColumn =
      statusParam === "released" ? assetsTable.releasedAt : assetsTable.intakeAt;
    if (fromDate) conditions.push(gte(dateColumn, fromDate));
    if (toDate) conditions.push(lte(dateColumn, toDate));

    if (handlerParam) {
      const pattern = `%${handlerParam}%`;
      conditions.push(
        or(
          ilike(assetsTable.handlerName, pattern),
          ilike(handlersTable.name, pattern),
        )!,
      );
    }

    const orderColumn =
      statusParam === "released" ? assetsTable.releasedAt : assetsTable.intakeAt;

    const rows = await db
      .select({
        asset: assetsTable,
        releasedBy: handlersTable.name,
      })
      .from(assetsTable)
      .leftJoin(
        eventsTable,
        and(
          eq(eventsTable.assetId, assetsTable.id),
          eq(eventsTable.type, "release"),
        ),
      )
      .leftJoin(handlersTable, eq(handlersTable.id, eventsTable.handlerId))
      .where(and(...conditions))
      .orderBy(desc(orderColumn));

    res.json(
      rows.map((r) => serializeAsset(r.asset, venueSecret, r.releasedBy ?? null)),
    );
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
    const venueSecret = await getVenueSigningSecret(venueCode);
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
    const serialized = serializeAsset(inserted, venueSecret);
    publish(venueCode, {
      type: "asset.created",
      asset: serialized,
      actorEmail: handlerEmail ?? null,
    });
    res.status(201).json(serialized);
  } catch (err) {
    next(err);
  }
});

router.get("/venues/:venueCode/assets/:ticketId", async (req, res, next) => {
  try {
    const venueCode = req.params.venueCode.toUpperCase();
    const ticketId = req.params.ticketId;
    const venueSecret = await getVenueSigningSecret(venueCode);
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
    res.json(serializeAsset(row, venueSecret));
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
    const venueSecret = await getVenueSigningSecret(venueCode);

    const recordTamper = async (reason: string, source: "scan" | "manual") => {
      let handlerId: string | null = null;
      if (handlerEmail && handlerName) {
        try {
          handlerId = await ensureHandler(venueCode, handlerEmail, handlerName);
        } catch {
          // ignore — we still want to log the attempt
        }
      }
      const [matchingAsset] = await db
        .select({ id: assetsTable.id })
        .from(assetsTable)
        .where(
          and(
            eq(assetsTable.venueId, venueCode),
            sql`upper(${assetsTable.ticketId}) = upper(${ticketId})`,
          ),
        )
        .limit(1);
      const [inserted] = await db
        .insert(eventsTable)
        .values({
          venueId: venueCode,
          assetId: matchingAsset?.id ?? null,
          handlerId,
          type: "signature_invalid",
          meta: { ticketId, source, reason },
        })
        .returning();
      if (inserted) {
        publish(venueCode, {
          type: "signature.invalid",
          tamper: serializeTamperEvent(inserted),
          actorEmail: handlerEmail ?? null,
        });
        // Fire-and-forget: check whether this attempt pushes the venue over
        // the configured tamper-spike threshold and, if so, email owners.
        // We deliberately don't await here so a slow email provider can't
        // delay the request response.
        void maybeAlertOnTamperSpike({ venueCode, ticketId });
      }
    };

    // Releases originating from a QR scan MUST present a valid signature.
    // Manual typed entry (`source: "manual"` or omitted with no signature)
    // is the explicit fallback and bypasses signature verification.
    const hasSignature = typeof body.signature === "string" && body.signature.length > 0;
    if (body.source === "scan") {
      if (!hasSignature || !verifyTicket(venueSecret, venueCode, ticketId, body.signature!)) {
        await recordTamper(
          hasSignature ? "Signature did not match this venue" : "Scan missing signature",
          "scan",
        );
        res.status(403).json({ error: "Invalid or missing tag signature" });
        return;
      }
    } else if (hasSignature) {
      if (!verifyTicket(venueSecret, venueCode, ticketId, body.signature!)) {
        await recordTamper("Signature did not match this venue", "manual");
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
    const serialized = serializeAsset(updated, venueSecret);
    publish(venueCode, {
      type: "asset.released",
      asset: serialized,
      actorEmail: handlerEmail ?? null,
    });
    res.json(serialized);
  } catch (err) {
    next(err);
  }
});

// Owner-triggered rotation of the venue's QR signing secret. After rotation,
// any QR codes printed/issued before this point will fail signature checks
// when scanned (handlers can still release via manual typed entry, which
// remains the documented fallback).
router.post(
  "/venues/:venueCode/signing-secret/rotate",
  requireVenueRole(["owner"]),
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      await ensureVenue(venueCode);
      await rotateVenueSigningSecret(venueCode);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
