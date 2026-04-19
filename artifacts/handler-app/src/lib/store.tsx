import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssetModeId, CustodyAsset, HandlerSession } from "./types";
import { MODES } from "./modes";

const SESSION_KEY = "ctx_handler_session";
const MODE_KEY = "ctx_handler_mode";

function genId(prefix: string) {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

function seedAssets(): CustodyAsset[] {
  const now = Date.now();
  return [
    {
      id: "a1",
      ticketId: "VAL-4839",
      mode: "vehicles",
      patron: { name: "Maya Chen", phone: "+1 415 555 0182" },
      fields: { plate: "7XYZ-921", make: "Tesla", model: "Model Y", color: "White", keyTag: "Hook 09", spot: "B2-104" },
      photos: [],
      intakeAt: now - 1000 * 60 * 38,
      handler: "Alex K.",
      status: "active",
    },
    {
      id: "a2",
      ticketId: "VAL-5102",
      mode: "vehicles",
      patron: { name: "Daniel Park", phone: "+1 408 555 7711" },
      fields: { plate: "8ABC-554", make: "BMW", model: "M3", color: "Black", keyTag: "Hook 14", spot: "B1-018" },
      photos: [],
      intakeAt: now - 1000 * 60 * 12,
      handler: "Alex K.",
      status: "active",
    },
    {
      id: "a3",
      ticketId: "BAG-2210",
      mode: "baggage",
      patron: { name: "Sofia Romero", phone: "+34 612 88 04 21" },
      fields: { pieces: 3, size: "Large", contents: "Two black hardshell, one duffel", shelf: "Aisle 3, Shelf C" },
      photos: [],
      intakeAt: now - 1000 * 60 * 60 * 4,
      handler: "Priya N.",
      status: "active",
    },
    {
      id: "a4",
      ticketId: "BAG-2247",
      mode: "baggage",
      patron: { name: "Hiro Tanaka", phone: "+81 90 1234 5678" },
      fields: { pieces: 1, size: "Carry-on", contents: "Navy roller", shelf: "Aisle 1, Shelf A" },
      photos: [],
      intakeAt: now - 1000 * 60 * 90,
      handler: "Priya N.",
      status: "active",
    },
    {
      id: "a5",
      ticketId: "CLK-0712",
      mode: "cloakrooms",
      patron: { name: "Lena Voss", phone: "+49 30 555 0119" },
      fields: { garment: "Coat", color: "Camel wool", accessories: "Umbrella", rack: "Rack 12 · #047" },
      photos: [],
      intakeAt: now - 1000 * 60 * 22,
      handler: "Marco T.",
      status: "active",
    },
    {
      id: "a6",
      ticketId: "CLK-0718",
      mode: "cloakrooms",
      patron: { name: "Owen Reilly", phone: "+1 312 555 9924" },
      fields: { garment: "Jacket", color: "Navy denim", accessories: "—", rack: "Rack 14 · #053" },
      photos: [],
      intakeAt: now - 1000 * 60 * 8,
      handler: "Marco T.",
      status: "active",
    },
    {
      id: "a7",
      ticketId: "RET-3380",
      mode: "bags",
      patron: { name: "Kira Osei", phone: "+1 646 555 4408" },
      fields: { store: "Atelier Nord", count: 2, fragile: false, locker: "Locker 22" },
      photos: [],
      intakeAt: now - 1000 * 60 * 50,
      handler: "Jules P.",
      status: "active",
    },
    {
      id: "a8",
      ticketId: "RET-3392",
      mode: "bags",
      patron: { name: "Theo Ng", phone: "+1 917 555 2204" },
      fields: { store: "Marche Verre", count: 1, fragile: true, locker: "Locker 09" },
      photos: [],
      intakeAt: now - 1000 * 60 * 18,
      handler: "Jules P.",
      status: "active",
    },
  ];
}

interface StoreCtx {
  session: HandlerSession | null;
  signIn: (s: HandlerSession) => void;
  signOut: () => void;
  mode: AssetModeId;
  setMode: (m: AssetModeId) => void;
  assets: CustodyAsset[];
  intake: (a: Omit<CustodyAsset, "id" | "ticketId" | "intakeAt" | "handler" | "status">) => CustodyAsset;
  release: (ticketId: string) => CustodyAsset | null;
  findByTicket: (ticketId: string) => CustodyAsset | undefined;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<HandlerSession | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as HandlerSession) : null;
    } catch {
      return null;
    }
  });
  const [mode, setModeState] = useState<AssetModeId>(() => {
    try {
      const raw = localStorage.getItem(MODE_KEY);
      if (raw && MODES.some((m) => m.id === raw)) return raw as AssetModeId;
    } catch {}
    return "vehicles";
  });
  const [assets, setAssets] = useState<CustodyAsset[]>(() => seedAssets());

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const value = useMemo<StoreCtx>(
    () => ({
      session,
      signIn: (s) => setSession(s),
      signOut: () => setSession(null),
      mode,
      setMode: (m) => setModeState(m),
      assets,
      intake: (a) => {
        const cfg = MODES.find((x) => x.id === a.mode)!;
        const ticketId = genId(cfg.ticketPrefix);
        const created: CustodyAsset = {
          ...a,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ticketId,
          intakeAt: Date.now(),
          handler: session?.handlerName ?? "Handler",
          status: "active",
        };
        setAssets((prev) => [created, ...prev]);
        return created;
      },
      release: (ticketId) => {
        let released: CustodyAsset | null = null;
        setAssets((prev) =>
          prev.map((a) => {
            if (a.ticketId.toUpperCase() === ticketId.toUpperCase() && a.status === "active") {
              released = { ...a, status: "released", releasedAt: Date.now() };
              return released;
            }
            return a;
          })
        );
        return released;
      },
      findByTicket: (ticketId) =>
        assets.find((a) => a.ticketId.toUpperCase() === ticketId.toUpperCase()),
    }),
    [session, mode, assets]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
