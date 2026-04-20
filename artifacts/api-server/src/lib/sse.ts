import type { Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  assetsTable,
  db,
  eventsTable,
  handlersTable,
  pg,
  pool,
} from "@workspace/db";
import { logger } from "./logger";
import {
  getVenueSigningSecret,
  serializeAsset,
  serializeTamperEvent,
  type SerializedAsset,
  type SerializedTamperEvent,
} from "./assets";

export type AssetEvent =
  | { type: "asset.created"; asset: SerializedAsset; actorEmail: string | null }
  | { type: "asset.released"; asset: SerializedAsset; actorEmail: string | null }
  | {
      type: "signature.invalid";
      tamper: SerializedTamperEvent;
      actorEmail: string | null;
    };

type Subscriber = {
  res: Response;
  heartbeat: ReturnType<typeof setInterval>;
};

// Local-instance subscribers. We still keep a per-process map of HTTP
// responses so we can fan out incoming notifications to whichever connections
// happen to live on this instance. The cross-instance hop is provided by
// Postgres LISTEN/NOTIFY below, so a publish on instance A reaches every
// subscriber on every instance.
const subscribers = new Map<string, Set<Subscriber>>();

const CHANNEL = "claimtagx_sse_events";
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 15_000;

// NOTIFY payloads are limited to 8000 bytes by Postgres. We deliberately
// keep the wire format tiny (just IDs + actor email) and hydrate the full
// event by reading from the database on receipt. That way we never have to
// drop a cross-instance fanout because of payload size — every subscriber on
// every instance reliably gets the event.
type NotifyPayload =
  | {
      kind: "asset";
      type: "asset.created" | "asset.released";
      venueCode: string;
      assetId: string;
      actorEmail: string | null;
    }
  | {
      kind: "tamper";
      type: "signature.invalid";
      venueCode: string;
      tamperId: string;
      actorEmail: string | null;
    };

let listenerClient: pg.Client | null = null;
let listenerReady: Promise<void> | null = null;
// True only when the dedicated `LISTEN` connection is fully established and
// has not since errored/ended. Used by `publish()` to decide whether to also
// fan out locally — necessary during cold start and reconnect windows when
// `pg_notify` would otherwise be invisible to subscribers on this instance.
let listenerActive = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function fanout(venueCode: string, event: AssetEvent): void {
  const set = subscribers.get(venueCode);
  if (!set || set.size === 0) return;
  const wire = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const sub of set) {
    try {
      sub.res.write(wire);
    } catch {
      // best-effort; the close handler will tidy up
    }
  }
}

async function hydrateAndFanout(payload: NotifyPayload): Promise<void> {
  // Skip the database round-trip entirely when no local subscriber cares.
  // Other instances will hydrate on their own behalf.
  const set = subscribers.get(payload.venueCode);
  if (!set || set.size === 0) return;

  if (payload.kind === "asset") {
    const venueSecret = await getVenueSigningSecret(payload.venueCode);
    const [row] = await db
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
      .where(eq(assetsTable.id, payload.assetId))
      .orderBy(desc(eventsTable.at))
      .limit(1);
    if (!row) {
      logger.warn(
        { assetId: payload.assetId, venueCode: payload.venueCode },
        "SSE hydrate: asset row not found",
      );
      return;
    }
    const serialized = serializeAsset(
      row.asset,
      venueSecret,
      payload.type === "asset.released" ? row.releasedBy ?? null : null,
    );
    fanout(payload.venueCode, {
      type: payload.type,
      asset: serialized,
      actorEmail: payload.actorEmail,
    });
    return;
  }

  // tamper event hydration
  const [row] = await db
    .select()
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.id, payload.tamperId),
        eq(eventsTable.type, "signature_invalid"),
      ),
    )
    .limit(1);
  if (!row) {
    logger.warn(
      { tamperId: payload.tamperId, venueCode: payload.venueCode },
      "SSE hydrate: tamper event not found",
    );
    return;
  }
  fanout(payload.venueCode, {
    type: "signature.invalid",
    tamper: serializeTamperEvent(row),
    actorEmail: payload.actorEmail,
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectAttempts += 1;
  const backoff = Math.min(
    RECONNECT_MAX_MS,
    RECONNECT_BASE_MS * 2 ** Math.min(reconnectAttempts, 6),
  );
  // Add a small jitter so multiple instances don't reconnect in lockstep.
  const jitter = Math.floor(Math.random() * 250);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    ensureListener().catch((err) => {
      logger.error(
        { err, attempt: reconnectAttempts },
        "SSE listener reconnect failed; will retry",
      );
    });
  }, backoff + jitter);
}

function ensureListener(): Promise<void> {
  if (listenerReady) return listenerReady;
  listenerReady = (async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    client.on("error", (err: Error) => {
      logger.error({ err }, "SSE listener client error");
      if (listenerClient === client) {
        listenerClient = null;
        listenerReady = null;
        listenerActive = false;
        try {
          client.end().catch(() => {});
        } catch {
          // ignore
        }
        scheduleReconnect();
      }
    });
    client.on("end", () => {
      if (listenerClient === client) {
        listenerClient = null;
        listenerReady = null;
        listenerActive = false;
        logger.warn("SSE listener client ended; reconnecting");
        scheduleReconnect();
      }
    });
    client.on("notification", (msg: pg.Notification) => {
      if (msg.channel !== CHANNEL || !msg.payload) return;
      let parsed: NotifyPayload;
      try {
        parsed = JSON.parse(msg.payload) as NotifyPayload;
      } catch (err) {
        logger.warn({ err }, "Failed to parse SSE notification payload");
        return;
      }
      hydrateAndFanout(parsed).catch((err) => {
        logger.error({ err, parsed }, "SSE hydrate/fanout failed");
      });
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    listenerClient = client;
    listenerActive = true;
    reconnectAttempts = 0;
  })().catch((err) => {
    listenerReady = null;
    listenerClient = null;
    listenerActive = false;
    // Initial connect failed — schedule a retry so this instance eventually
    // joins the shared transport even if the database was briefly down.
    scheduleReconnect();
    throw err;
  });
  return listenerReady;
}

export function subscribe(venueCode: string, res: Response): () => void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`retry: 5000\n\n`);

  // Lazily start the LISTEN connection on first subscribe. Failures schedule
  // their own retry inside ensureListener; we just log here.
  ensureListener().catch((err) => {
    logger.error({ err }, "Failed to start SSE Postgres listener");
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      // ignore
    }
  }, 25_000);

  const sub: Subscriber = { res, heartbeat };
  let set = subscribers.get(venueCode);
  if (!set) {
    set = new Set();
    subscribers.set(venueCode, set);
  }
  set.add(sub);

  return () => {
    clearInterval(heartbeat);
    const cur = subscribers.get(venueCode);
    if (cur) {
      cur.delete(sub);
      if (cur.size === 0) subscribers.delete(venueCode);
    }
  };
}

function toNotifyPayload(
  venueCode: string,
  event: AssetEvent,
): NotifyPayload {
  if (event.type === "signature.invalid") {
    return {
      kind: "tamper",
      type: "signature.invalid",
      venueCode,
      tamperId: event.tamper.id,
      actorEmail: event.actorEmail,
    };
  }
  return {
    kind: "asset",
    type: event.type,
    venueCode,
    assetId: event.asset.id,
    actorEmail: event.actorEmail,
  };
}

export function publish(venueCode: string, event: AssetEvent): void {
  const payload = JSON.stringify(toNotifyPayload(venueCode, event));

  // If our LISTEN connection is not currently active (cold start, mid
  // reconnect, or the initial connect attempt failed), the NOTIFY round-trip
  // would not be visible to subscribers on this instance. Fan out locally so
  // those subscribers still receive the event. Other instances that DO have
  // an active listener will still get the event via the NOTIFY below.
  // We also kick off a listener attempt so this instance recovers ASAP.
  const localFallback = !listenerActive;
  if (localFallback) {
    fanout(venueCode, event);
    ensureListener().catch(() => {
      // ensureListener already schedules its own retry on failure.
    });
  }

  // Fire-and-forget cross-instance broadcast. The pool client used for
  // NOTIFY is released back immediately. When listenerActive is true, this
  // instance's subscribers receive the event via the LISTEN path (and we
  // skipped the local fanout above to avoid double delivery).
  pool
    .query(`SELECT pg_notify($1, $2)`, [CHANNEL, payload])
    .catch((err) => {
      logger.error(
        { err, venueCode, type: event.type },
        "Failed to publish SSE event via pg_notify",
      );
      // Best-effort local fallback so this instance's subscribers still see
      // the update if NOTIFY itself failed and we hadn't already fanned out
      // locally above.
      if (!localFallback) fanout(venueCode, event);
    });
}
