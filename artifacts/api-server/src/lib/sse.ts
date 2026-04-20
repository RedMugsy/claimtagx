import type { Response } from "express";
import type { SerializedAsset, SerializedTamperEvent } from "./assets";

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

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribe(venueCode: string, res: Response): () => void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`retry: 5000\n\n`);

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

export function publish(venueCode: string, event: AssetEvent): void {
  const set = subscribers.get(venueCode);
  if (!set || set.size === 0) return;
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const sub of set) {
    try {
      sub.res.write(payload);
    } catch {
      // best-effort; the close handler will tidy up
    }
  }
}
