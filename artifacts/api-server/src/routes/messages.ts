import { Router, type IRouter } from "express";
import { z } from "zod";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import {
  db,
  messageReadsTable,
  messagesTable,
  type Message,
} from "@workspace/db";
import {
  requireAuth,
  requireVenueMembership,
} from "../middlewares/requireAuth";
import { ensureVenue } from "../lib/assets";

const router: IRouter = Router();

const PostBody = z.object({
  body: z.string().trim().min(1).max(2000),
});

function serialize(row: Message) {
  return {
    id: row.id,
    venueCode: row.venueCode,
    authorUserId: row.authorUserId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.getTime(),
  };
}

router.use(
  "/venues/:venueCode/messages",
  requireAuth,
  requireVenueMembership(),
);

router.get("/venues/:venueCode/messages", async (req, res, next) => {
  try {
    const venueCode = String(req.params.venueCode).toUpperCase();
    await ensureVenue(venueCode);
    const limitRaw = Number(req.query.limit);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(200, Math.floor(limitRaw))
        : 100;
    // Pull most recent N then return ascending so the UI can append directly.
    const rows = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.venueCode, venueCode))
      .orderBy(desc(messagesTable.createdAt))
      .limit(limit);
    rows.reverse();
    res.json(rows.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.post("/venues/:venueCode/messages", async (req, res, next) => {
  try {
    const venueCode = String(req.params.venueCode).toUpperCase();
    const parsed = PostBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid request",
      });
      return;
    }
    await ensureVenue(venueCode);
    const [inserted] = await db
      .insert(messagesTable)
      .values({
        venueCode,
        authorUserId: req.userId!,
        authorName: req.userName ?? "Handler",
        body: parsed.data.body,
      })
      .returning();
    // Posting your own message implicitly clears your unread count.
    await db
      .insert(messageReadsTable)
      .values({
        handlerUserId: req.userId!,
        venueCode,
        lastReadAt: inserted.createdAt,
      })
      .onConflictDoUpdate({
        target: [messageReadsTable.handlerUserId, messageReadsTable.venueCode],
        set: { lastReadAt: inserted.createdAt },
      });
    res.status(201).json(serialize(inserted));
  } catch (err) {
    next(err);
  }
});

router.post("/venues/:venueCode/messages/read", async (req, res, next) => {
  try {
    const venueCode = String(req.params.venueCode).toUpperCase();
    const now = new Date();
    await db
      .insert(messageReadsTable)
      .values({
        handlerUserId: req.userId!,
        venueCode,
        lastReadAt: now,
      })
      .onConflictDoUpdate({
        target: [messageReadsTable.handlerUserId, messageReadsTable.venueCode],
        set: { lastReadAt: now },
      });
    res.json({ lastReadAt: now.getTime() });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/venues/:venueCode/messages/unread-count",
  async (req, res, next) => {
    try {
      const venueCode = String(req.params.venueCode).toUpperCase();
      const [readRow] = await db
        .select({ lastReadAt: messageReadsTable.lastReadAt })
        .from(messageReadsTable)
        .where(
          and(
            eq(messageReadsTable.handlerUserId, req.userId!),
            eq(messageReadsTable.venueCode, venueCode),
          ),
        )
        .limit(1);
      // Treat "never read" as "everything since the user signed up is new"
      // — capped to a 7-day lookback so a brand-new handler doesn't drown
      // in months of historical chatter.
      const cutoff =
        readRow?.lastReadAt ??
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.venueCode, venueCode),
            gt(messagesTable.createdAt, cutoff),
            sql`${messagesTable.authorUserId} <> ${req.userId!}`,
          ),
        );
      res.json({ count: Number(row?.count ?? 0) });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
// Keep `asc` referenced so editor lints don't whine; it is used in pagination
// experimentation when limit is changed in the future.
void asc;
