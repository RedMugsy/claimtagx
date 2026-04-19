import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAsset,
  getAssetByTicket,
  getListAssetsQueryKey,
  listAssets,
  releaseAsset,
  type CustodyAsset as ApiCustodyAsset,
} from "@workspace/api-client-react";
import type { AssetModeId, CustodyAsset, HandlerSession } from "./types";
import { MODES } from "./modes";

const SESSION_KEY = "ctx_handler_session";
const MODE_KEY = "ctx_handler_mode";

function toLocal(a: ApiCustodyAsset): CustodyAsset {
  return {
    id: a.id,
    ticketId: a.ticketId,
    mode: a.mode as AssetModeId,
    patron: { name: a.patron.name, phone: a.patron.phone },
    fields: (a.fields ?? {}) as Record<string, string | number | boolean>,
    photos: (a.photos ?? []) as string[],
    intakeAt: a.intakeAt,
    handler: a.handler,
    status: a.status as "active" | "released",
    releasedAt: a.releasedAt ?? undefined,
  };
}

interface StoreCtx {
  session: HandlerSession | null;
  signIn: (s: HandlerSession) => void;
  signOut: () => void;
  mode: AssetModeId;
  setMode: (m: AssetModeId) => void;
  assets: CustodyAsset[];
  loading: boolean;
  intake: (
    a: Omit<CustodyAsset, "id" | "ticketId" | "intakeAt" | "handler" | "status">,
  ) => Promise<CustodyAsset>;
  release: (ticketId: string) => Promise<CustodyAsset | null>;
  findByTicket: (ticketId: string) => Promise<CustodyAsset | undefined>;
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

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const venueCode = session?.venueCode ?? "";
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: getListAssetsQueryKey(venueCode),
    queryFn: () => listAssets(venueCode).then((rows) => rows.map(toLocal)),
    enabled: Boolean(venueCode),
  });

  const invalidate = useCallback(() => {
    if (!venueCode) return;
    queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(venueCode) });
  }, [queryClient, venueCode]);

  const intake = useCallback<StoreCtx["intake"]>(
    async (a) => {
      if (!session) throw new Error("Not signed in");
      const created = await createAsset(session.venueCode, {
        mode: a.mode,
        patron: a.patron,
        fields: a.fields,
        photos: a.photos,
        handlerEmail: session.email,
        handlerName: session.handlerName,
        venueName: session.venueName,
      });
      const local = toLocal(created);
      // Optimistic insert into cache so Custody view feels instant.
      queryClient.setQueryData<CustodyAsset[] | undefined>(
        getListAssetsQueryKey(session.venueCode),
        (prev) => (prev ? [local, ...prev] : [local]),
      );
      invalidate();
      return local;
    },
    [session, queryClient, invalidate],
  );

  const release = useCallback<StoreCtx["release"]>(
    async (ticketId) => {
      if (!session) return null;
      try {
        const updated = await releaseAsset(session.venueCode, ticketId, {});
        const local = toLocal(updated);
        queryClient.setQueryData<CustodyAsset[] | undefined>(
          getListAssetsQueryKey(session.venueCode),
          (prev) =>
            prev?.map((row) => (row.ticketId === local.ticketId ? local : row)) ??
            prev,
        );
        invalidate();
        return local;
      } catch {
        return null;
      }
    },
    [session, queryClient, invalidate],
  );

  const findByTicket = useCallback<StoreCtx["findByTicket"]>(
    async (ticketId) => {
      if (!session) return undefined;
      try {
        const found = await getAssetByTicket(session.venueCode, ticketId.trim());
        return toLocal(found);
      } catch {
        return undefined;
      }
    },
    [session],
  );

  const value = useMemo<StoreCtx>(
    () => ({
      session,
      signIn: (s) => setSession(s),
      signOut: () => {
        setSession(null);
        queryClient.clear();
      },
      mode,
      setMode: (m) => setModeState(m),
      assets,
      loading: isLoading,
      intake,
      release,
      findByTicket,
    }),
    [session, mode, assets, isLoading, intake, release, findByTicket, queryClient],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
